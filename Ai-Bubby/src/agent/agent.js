const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph")
const { ToolMessage, AIMessage, HumanMessage, SystemMessage } = require("@langchain/core/messages")
const tools = require("./tools")


const { ChatGroq } = require("@langchain/groq")

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant", // fast + free
  temperature: 0.5
})


const graph = new StateGraph(MessagesAnnotation)
  .addNode("tools", async (state, config) => {
    const lastMessage = state.messages[state.messages.length - 1]

    const toolsCall = Array.isArray(lastMessage.tool_calls)
      ? lastMessage.tool_calls
      : []

    // 🔥 VERY IMPORTANT
    if (toolsCall.length === 0) {
      return state
    }

    const toolCallResults = await Promise.all(
      toolsCall.map(async (call) => {
        const tool = tools[call.name]
        if (!tool) {
          throw new Error(`Tool ${call.name} not found`)
        }

        const toolResult = await tool.func({
          ...call.args,
          token: config.metadata.token
        })

        return new ToolMessage({
          content: toolResult,
          name: call.name,
          tool_call_id: call.id // ✅ REQUIRED FOR GROQ
        })
      })
    )

    state.messages.push(...toolCallResults)
    return state
  })



.addNode("chat", async (state, config) => {

  const lastUserMessage = [...state.messages]
    .reverse()
    .find(m => m instanceof HumanMessage)

  const wantsAddToCart =
    lastUserMessage &&
    /add to cart|add this|add product/i.test(lastUserMessage.content)

  const lastMessage = state.messages[state.messages.length - 1]

  // 🔥 AUTO add-to-cart (FIXED)
  if (
    wantsAddToCart &&
    lastMessage?.name === "searchProduct"
  ) {
    const parsed = JSON.parse(lastMessage.content)

    if (parsed?.data?.length === 1) {
      const product = parsed.data[0]

      state.messages.push(
        new AIMessage({
          content: "",
          tool_calls: [
            {
              id: `auto_add_${Date.now()}`,
              name: "addProductToCart",
              args: {
                productId: product._id,
                qty: 1
              }
            }
          ]
        })
      )

      return state
    }
  }

  // ⬇️ normal LLM call
  const response = await model.invoke(
    [
      new SystemMessage(`You are an e-commerce shopping assistant.`),
      ...state.messages
    ],
    {
      tools: [tools.searchProduct, tools.addProductToCart]
    }
  )

  state.messages.push(
    new AIMessage({
      content: response.content,
      tool_calls: response.tool_calls
    })
  )

  return state
})


  .addEdge("__start__", "chat")
  .addConditionalEdges("chat", async (state) => {

    const lastMessage = state.messages[state.messages.length - 1]

    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
      return "tools"
    } else {
      return "__end__"
    }

  })
  .addEdge("tools", "chat")



const agent = graph.compile()


module.exports = agent
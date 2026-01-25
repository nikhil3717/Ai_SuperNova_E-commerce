const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie"); // ✅ REQUIRED
const agent = require("../agent/agent")

const initSocketServer = (httpServer) => {

  const io = new Server(httpServer, {
    cors: {
      origin: "*", // adjust for production
      credentials: true,
    },
  });

  // 🔐 Auth middleware
  io.use((socket, next) => {
    try {
      const cookies = socket.handshake?.headers?.cookie;
      if (!cookies) {
        return next(new Error("Cookies not found"));
      }

      const { token } = cookie.parse(cookies);

      if (!token) {
        return next(new Error("Token not provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // attach user to socket
      socket.token = token
      next();

    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  // 🔌 Connection
  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);
    console.log("👤 User:", socket.user);
    console.log("👤 token:", socket.token);

    socket.agentMessages = []

    socket.on("message", async (data) => {
      if (!data || typeof data !== "string") return

      try {
        socket.agentMessages.push({
          role: "user",
          content: data
        })

        const agentResponse = await agent.invoke(
          {
            messages: socket.agentMessages
          },
          {
            metadata: {
              token: socket.token
            }
          }
        )

        // 🔥 SAVE agent messages back to memory
        socket.agentMessages = agentResponse.messages

        const lastMessage =
          agentResponse.messages[agentResponse.messages.length - 1]

     socket.emit("response", {
      // type: lastMessage.tool_calls?.length ? "tool" : "text",
      content:lastMessage.content || "",
      // tool_calls: lastMessage.tool_calls || []
    })

      } catch (err) {
        console.error("Agent error:", err)

        socket.emit("response", {
          content: "⚠️ Something went wrong. Please try again.",
          tool_calls: []
        })
      }

    })


    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
      socket.agentMessages = []
    });
  });

  return io; // ✅ IMPORTANT
};

module.exports = { initSocketServer };

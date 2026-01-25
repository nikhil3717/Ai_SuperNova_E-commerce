const { tool } = require("@langchain/core/tools")
const { z } = require("zod")
const axios = require("axios")

const searchProduct = tool(async ({ query, token }) => {
  try {
    console.log("searchProduct called with data:", { query, token })

    const response = await axios.get(
      `http://localhost:3001/api/products?q=${query}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    // ✅ Groq-safe: always string
    return JSON.stringify(response.data)
  } catch (err) {
    console.error("searchProduct error:", err.message)

    // ✅ NEVER throw from tool
    return JSON.stringify({
      error: "Failed to search products"
    })
  }
}, {
  name: "searchProduct",
  description: "Search for products based on a query",
  schema: z.object({
    query: z.string().describe("The search query for products")
  })
})




const addProductToCart = tool(async ({ productId, qty = 1, token }) => {
  console.log("addProductToCart called with data:", { productId, qty, token })
  try {
    const response = await axios.post(
      `http://localhost:3002/api/cart/items`,
      { productId, qty },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    console.log("add to cart response", response.data)

    // ✅ Groq-safe string
    return JSON.stringify({ success: true, message: `Added product with id ${productId} (qty: ${qty}) to cart`, data: response.data })
  } catch (err) {
    console.error("addProductToCart error:", err.message)

    return JSON.stringify({ success: false, error: `Failed to add product ${productId} to cart: ${err.message}` })
  }
}, {
  name: "addProductToCart",
  description: "Add a product to the shopping cart",
  schema: z.object({
    productId: z.string().describe("The id of the product to add to the cart"),
    qty: z.number().describe("The quantity of the product to add to the cart").default(1),
    token: z.string().describe("Authorization token").optional()
  })
})



module.exports = { searchProduct, addProductToCart }
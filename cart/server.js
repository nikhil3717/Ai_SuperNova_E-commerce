const app = require("./src/app")
const connectToDB = require("./src/db/db")
require("dotenv").config()


connectToDB()
app.listen(3002, () => {
  console.log("server is running port 3002")
})
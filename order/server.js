const app = require("./src/app")
const connectToDB = require("./src/db/db")
require("dotenv").config()


connectToDB()

app.listen(3003, () => {
  console.log("server is running port 3003")
})


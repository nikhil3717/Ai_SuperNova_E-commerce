const app = require("./src/app")
const connectToDatabase = require("./src/db/db")


require("dotenv").config()


connectToDatabase()

app.listen(3000, () => {
  console.log("Server is running on port 3000")
})
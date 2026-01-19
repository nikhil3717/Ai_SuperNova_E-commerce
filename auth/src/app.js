
const express = require("express")
const cookieParser = require("cookie-parser")
const userRoutes = require("./routes/auth.route")

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use("/api/auth", userRoutes)




module.exports = app
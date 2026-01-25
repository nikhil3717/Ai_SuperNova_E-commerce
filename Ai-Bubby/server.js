const app = require("./src/app")
require("dotenv").config()
const http = require("http")
const {initSocketServer} = require("./src/sockets/socket.server")

const httpServer = http.createServer(app)

initSocketServer(httpServer)

httpServer.listen(3005,() => {
  console.log("server is running port 3005")
})
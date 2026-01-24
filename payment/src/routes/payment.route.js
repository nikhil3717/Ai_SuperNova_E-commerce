const express = require("express")
const createAuthMiddleware = require("../middlewares/auth.middleware")
const paymentController = require("../controllers/payment.controller")

const route = express.Router()

route.post("/create/:orderId", createAuthMiddleware(["user"]), paymentController.createPayment);
route.post("/verify", createAuthMiddleware(["user"]), paymentController.verifyPayment);

module.exports = route
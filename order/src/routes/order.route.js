const express = require("express");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const validateion = require("../middlewares/validation.middleware")
const orderController = require("../controllers/order.controller");

const router = express.Router();

/* ======================
   CREATE ORDER
====================== */
router.post(
  "/",
  createAuthMiddleware(["user"]),
  validateion.validateShippingAddress,
  orderController.createOrder
);

/* ======================
   GET MY ORDERS
====================== */
router.get(
  "/me",
  createAuthMiddleware(["user"]),
  orderController.getOrders
);

/* ======================
   CANCEL ORDER
====================== */
router.post(
  "/:id/cancel",
  createAuthMiddleware(["user", "admin"]),
  orderController.cancelOrder
);

/* ======================
   UPDATE SHIPPING ADDRESS
====================== */
router.patch(
  "/:id/address",
  createAuthMiddleware(["user"]),
  validateion.validateUpdateShippingAddress,
  orderController.updateShippingAddress
);

/* ======================
   GET ORDER BY ID
====================== */
router.get(
  "/:id",
  createAuthMiddleware(["user", "admin"]),
  orderController.getOrderById
);

module.exports = router;

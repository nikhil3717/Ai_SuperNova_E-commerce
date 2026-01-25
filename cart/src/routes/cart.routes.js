const express = require("express")
const createAuthMiddleware = require("../middlewares/auth.middleware")
const cartController = require("../controllers/cart.controller")
const validation = require("../middlewares/validators.middleware")

const router = express.Router()


router.get("/", createAuthMiddleware(["user"]), cartController.getCart)

router.post("/items", validation.validateAddItemToCart, createAuthMiddleware(["user"]), cartController.addItemToCart)

router.patch(
  "/items/:productId",
  validation.validateUpdateCartItem,
  createAuthMiddleware(["user"]),
  cartController.updateCartItem
);

router.delete(
  "/items/:productId",
  createAuthMiddleware(["user"]),
  cartController.deleteCartItem
);

router.delete(
  "/",
  createAuthMiddleware(["user"]),
  cartController.clearCart
);


module.exports = router
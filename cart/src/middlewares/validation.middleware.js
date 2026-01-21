const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");

const validateResult = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
  }

  next();
};

const validateAddItemToCart = [
  body("productId")
    .isString()
    .withMessage("Product ID must be a string")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid Product ID format"),

  body("qty")
    .isInt({ gt: 0 })
    .withMessage("Quantity must be a positive integer"),

  validateResult,
];

const validateUpdateCartItem = [
  param("productId")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid Product ID"),

  body("qty")
    .isInt()
    .withMessage("Quantity must be an integer"),

  validateResult,
];

module.exports = {
  validateAddItemToCart,
  validateUpdateCartItem, // ✅ MUST be exported
};

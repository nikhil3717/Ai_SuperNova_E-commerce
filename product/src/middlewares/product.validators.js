const { body, validationResult } = require("express-validator");

/**
 * Validation Error Handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  next();
};

/**
 * Create Product Validation (MATCHES CONTROLLER)
 */
const createProductValidation = [
  body("title")
    .exists().withMessage("Title is required")
    .isString().withMessage("Title must be a string")
    .trim()
    .notEmpty().withMessage("Title cannot be empty")
    .isLength({ min: 3 }).withMessage("Title must be at least 3 characters"),

  body("description")
    .optional()
    .isString().withMessage("Description must be a string")
    .trim()
    .isLength({ min: 10 }).withMessage("Description must be at least 10 characters"),

  body("priceAmount")
    .exists().withMessage("priceAmount is required")
    .notEmpty().withMessage("priceAmount cannot be empty")
    .isNumeric().withMessage("priceAmount must be a number")
    .custom((value) => value > 0)
    .withMessage("priceAmount must be greater than 0"),

  body("priceCurrency")
    .optional()
    .isIn(["USD", "INR"])
    .withMessage("priceCurrency must be USD or INR"),

  handleValidationErrors,
];

module.exports = {
  createProductValidation,
};

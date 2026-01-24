const { body, validationResult } = require("express-validator");


// Middleware to handle validation errors
const validateResult = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
  }

  next();
};



// Validation middleware for shipping address
const validateShippingAddress = [
  body("street")
    .trim()
    .notEmpty()
    .withMessage("Street is required")
    .isLength({ min: 3 })
    .withMessage("Street must be at least 3 characters long"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 2 })
    .withMessage("City must be at least 2 characters long"),

  body("state")
    .trim()
    .notEmpty()
    .withMessage("State is required")
    .isLength({ min: 2 })
    .withMessage("State must be at least 2 characters long"),

  body("zip")
    .trim()
    .notEmpty()
    .withMessage("ZIP pincode is required")
    .matches(/^[0-9]{5,6}$/)
    .withMessage("ZIP pincode must be 5-6 digits"),

  body("country")
    .trim()
    .notEmpty()
    .withMessage("Country is required")
    .isLength({ min: 2 })
    .withMessage("Country must be at least 2 characters long"),


  validateResult
];


const validateUpdateShippingAddress = [
  body("street")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Street must be at least 3 characters long"),

  body("city")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("City must be at least 2 characters long"),

  body("state")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("State must be at least 2 characters long"),

  body("zip")
    .optional()
    .trim()
    .matches(/^[0-9]{5,6}$/)
    .withMessage("ZIP pincode must be 5-6 digits"),

  body("country")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Country must be at least 2 characters long"),

  validateResult
]


module.exports = {
  validateShippingAddress,
  validateUpdateShippingAddress
};

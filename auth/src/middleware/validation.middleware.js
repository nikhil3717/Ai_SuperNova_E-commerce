
const { body, validationResult } = require("express-validator")

const reqpondWithValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    })
  }
  next()
}

const registerUserValidations = [
  body("username").isString().withMessage("Username Must be a string").isLength({ min: 3 }).withMessage("Username must be at least 3"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("password must be at least 6"),

  body("fullName.firstName")
    .isString()
    .withMessage("first name must be a string")
    .notEmpty()
    .withMessage("first name is required"),

  body("fullName.lastName")
    .isString()
    .withMessage("last name must be a string")
    .notEmpty()
    .withMessage("last name is required"),

    body("role")
    .optional()
    .isIn(['user','seller'])
    .withMessage("Role must be either 'user' or 'seller'"),



  reqpondWithValidationErrors
]



const loginUserValidations = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address"),
  body("username")
    .optional()
    .isString()
    .withMessage("Username must be a string")
  ,
  body("password")
    .notEmpty()
    .withMessage("Password is required"),

  (req, res, next) => {
    if (!req.body.email && !req.body.username) {
      return res.status(400).json({
        errors: [
          { msg: "Either email or username is require" }
        ]
      })
    }
    reqpondWithValidationErrors(req, res, next)

  }



];

const addAddressValidations = [
  body("street").notEmpty().withMessage("Street is required"),
  body("city").notEmpty().withMessage("City is required"),
  body("state").notEmpty().withMessage("State is required"),
  body("country").notEmpty().withMessage("Country is required"),
  body("zipCode")
    .notEmpty()
    .withMessage("Pincode is required")
    .matches(/^\d{6}$/)
    .withMessage("Pincode must be 6 digits"),
  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .matches(/^\d{10}$/)
    .withMessage("Phone must be 10 digits"),
  reqpondWithValidationErrors
];

module.exports = {
  registerUserValidations,
  loginUserValidations,
  addAddressValidations
}
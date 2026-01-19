
const express = require("express");
const validations = require("../middleware/validation.middleware")
const userController = require("../controllers/user.controller");
const AuthMiddleware = require("../middleware/auth.middleware")


const router = express.Router();
// POST REGISTER API
router.post("/register", validations.registerUserValidations, userController.registerUser);
// POST logout API
router.post("/login", validations.loginUserValidations, userController.loginUser);

// get Authme API
router.get("/me", AuthMiddleware, userController.getCurrentUser)

// get logout API
router.get("/logout", AuthMiddleware, userController.logoutUser);

router.get("/users/me/addresses", AuthMiddleware, userController.GetUserAddresses);
router.post("/users/me/addresses", AuthMiddleware, validations.addAddressValidations, userController.addAddress);
router.delete("/users/me/addresses/:addressId", AuthMiddleware, userController.deleteAddress);


module.exports = router;
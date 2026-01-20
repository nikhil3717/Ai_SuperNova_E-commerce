const express = require("express");
const multer = require("multer")
const createAuthMiddleware = require("../middlewares/auth.middleware")
const productController = require("../controllers/product.controller")
const {createProductValidation} = require("../middlewares/product.validators")


const upload = multer({storage: multer.memoryStorage()})

const router = express.Router()


// create POST route /api/products/
router.post("/", createAuthMiddleware(["admin","seller"]), upload.array("images",5),createProductValidation,productController.createProduct )

// GET /api/products/
router.get("/", productController.getProduct)



// PATCH /api/products/:id 

router.patch("/:id" ,createAuthMiddleware(["seller"]), productController.updateProductById)

// DELETE /api/products/:id 

router.delete("/:id",createAuthMiddleware(["seller"]),productController.DeleteProduct)

// GET /api/product/seller
router.get(
  "/seller",
  createAuthMiddleware(["seller"]),
  productController.getSellerProducts
);

// GET /api/products/:id
router.get("/:id",productController.getProductById )


module.exports = router
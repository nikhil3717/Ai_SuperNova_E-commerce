const { default: mongoose } = require("mongoose");
const ProductModel = require("../models/product.model");
const { uploadImage } = require("../service/imagekit.service");

const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      priceAmount,
      priceCurrency = "INR",
    } = req.body;

    if (!title || !priceAmount) {
      return res.status(400).json({
        success: false,
        message: "title and priceAmount are required",
      });
    }

    const seller = req.user.id;

    const price = {
      amount: Number(priceAmount),
      currency: priceCurrency,
    };

    const uploadedImages = await Promise.all(
      (req.files || []).map((file) =>
        uploadImage({ buffer: file.buffer })
      )
    );

    const image = uploadedImages.map((img) => ({
      url: img.url,
      thumbnail: img.thumbnailUrl,
      id: img.fileId,
    }));

    const product = await ProductModel.create({
      title,
      description,
      price,
      seller,
      image,
    });

    return res.status(201).json({
      success: true,
      data: product,
    });

  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


const getProduct = async (req,res) => {
    const {q,minprice,maxprice,skip = 0, limit = 20} = req.query;

const filter = {}

if(q) {
  filter.$text = {$search:q}
}

if(minprice) {
  filter['price.amount'] = {...filter['price.amount'], $gte:Number(minprice)}
}

if(maxprice) {
  filter['price.amount'] = {...filter['price.amount'], $lte:Number(maxprice)}
}

const products = await ProductModel.find(filter).skip(Number(skip)).limit(Math.min(Number(limit), 20))


return res.status(200).json({data:products})
}


const getProductById = async (req,res) => {
       const {id} = req.params

       const product = await ProductModel.findById(id)

       if(!product) {
        return res.status(404).json({message:"product not found"})
       }

       res.status(200).json({
        product: product
       })
}

const updateProductById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product" });
  }

  const product = await ProductModel.findOne({ _id: id });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (product.seller.toString() !== req.user.id) {
    return res.status(403).json({
      message: "Forbidden: you can only update you product",
    });
  }

  const allowedUpdates = ["title", "description", "price"];

  for (const key of Object.keys(req.body)) {
    if (!allowedUpdates.includes(key)) continue;

    if (key === "price" && typeof req.body.price === "object") {
      if (req.body.price.amount !== undefined) {
        product.price.amount = Number(req.body.price.amount);
      }
      if (req.body.price.currency !== undefined) {
        product.price.currency = req.body.price.currency;
      }
    } else {
      product[key] = req.body[key];
    }
  }

  await product.save();

  return res.status(200).json({
    message: "product updated",
    product,
  });
};


const DeleteProduct = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product" });
  }

  const product = await ProductModel.findOne({ _id: id });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (product.seller.toString() !== req.user.id) {
    return res.status(403).json({
      message: "Forbidden: you can only delete your product",
    });
  }

  await product.deleteOne();

  return res.status(200).json({
    message: "product deleted",
  });
};


const getSellerProducts = async (req,res) => {
  const seller = req.user

  const {skip = 0, limit = 20} = req.query;

  const products = await ProductModel.find({seller:seller.id}).skip(skip).limit(Math.min(limit))
  
  return res.status(200).json({product: products})
}

 

module.exports = { 
  createProduct
  ,getProduct,
  getProductById ,
  updateProductById,
  DeleteProduct,
  getSellerProducts
};

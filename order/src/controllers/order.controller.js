const orderModel = require("../models/order.model")
const axios = require("axios")


const createOrder = async (req, res) => {

  const user = req.user
  const { street, city, state, zip, country, isDefault } = req.body

  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  // Construct shippingAddress object from request body
  const shippingAddress = {
    street,
    city,
    state,
    zip,
    country,
    isDefault: isDefault || false
  }

  try {

    const cartResponse = await axios.get(`http://localhost:3002/api/cart`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const products = await Promise.all(cartResponse.data.cart.items.map(async (item) => {
      return (
        await axios.get(`http://localhost:3001/api/products/${item.productId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })).data.product
    }))

    // console.log("products", products[0].price)

    let priceAmount = 0
    const orderItems = cartResponse.data.cart.items.map((item, index) => {
      const product = products.find(p => p._id === item.productId)

      // if not is stock, dese not allow order creation
      if (!product.stock || product.stock < item.quantity) {
        throw new Error(`Product ${product.title} is out of stock or insufficient quantity`);
      }

      // calculate total price
      const itemTotal = product.price.amount * item.quantity;
      priceAmount += itemTotal;

      return {
        product: item.productId,
        quantity: item.quantity,
        price: {
          amount: itemTotal,
          currency: product.price.currency
        }
      }
    })

    console.log("Total price amount:", priceAmount)
    console.log(orderItems)


    const order = await orderModel.create({
      user: user.id,
      items: orderItems,
      status: "PENDING",
      totalPrice: {
        amount: priceAmount,
        currency: "INR"
      },
      shippingAddress: shippingAddress
    })

    res.status(201).json({
      message: "Order created successfully",
      success: true,
      order
    })

  } catch (error) {
    console.log(error.message)
    const errorMessage = error.message || "Failed to create order";
    res.status(500).json({
      message: errorMessage,
      success: false
    })
  }

}


const getOrders = async (req, res) => {

  const user = req.user;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const orders = await orderModel.find({ user: user.id })
    const totalOrders = await orderModel.countDocuments({ user: user.id })

    res.status(200).json({
      orders,
      meta: {
        total: totalOrders,
        page,
        limit,
        skip
      }
    })

  } catch (error) {
    res.status(500).json({
      message: "Internal server error", error
    })
  }


}


const getOrderById = async (req, res) => {
  const user = req.user;
  const orderId = req.params.id;

  try {
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "order not found"
      })
    }

    if (order.user.toString() !== user.id && user.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: you do not have access"
      })
    }

    res.status(200).json({
      order
    })

  } catch (error) {
    res.status(500).json({
      "Internal server error": error.message
    })
  }
}


const cancelOrder = async (req, res) => {
  const user = req.user;
  const orderId = req.params.id;

  try {
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Ownership / admin check
    if (order.user.toString() !== user.id && user.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: you do not have access",
      });
    }

    // Business rules
    if (order.status === "CANCELLED") {
      return res.status(400).json({
        message: "Order is already cancelled",
      });
    }

    if (order.status === "DELIVERED") {
      return res.status(400).json({
        message: "Order is already delivered",
      });
    }

    // Cancel order
    order.status = "CANCELLED";
    await order.save();

    return res.status(200).json({
      message: "Order cancelled successfully",
      success: true,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



const updateShippingAddress = async (req, res) => {
  const user = req.user;
  const orderId = req.params.id;
  const { shippingAddress } = req.body;

  try {
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      })
    }

    if (order.user.toString() !== user.id) {
      return res.status(403).json({
        message: "Forbidden: you do not have access"
      })
    }

    if (order.status !== "PENDING") {
      return res.status(409).json({
        message: "Order address cannot be update address"
      })
    }

    order.shippingAddress = {
      street: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zipCode: shippingAddress.zipCode,
      country: shippingAddress.country
    }


    await order.save()

    res.status(200).json({
      order
    })

  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
};


module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  updateShippingAddress
}
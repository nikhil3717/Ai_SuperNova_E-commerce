const cartModel = require("../models/cart.model");

const addItemToCart = async (req, res) => {
  const { productId, qty } = req.body;
  const user = req.user;

  let cart = await cartModel.findOne({ user: user.id });

  if (!cart) {
    cart = new cartModel({ user: user.id, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    item => item.productId.toString() === productId
  );

  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity += qty;
  } else {
    cart.items.push({ productId, quantity: qty });
  }

  await cart.save();

  return res.status(200).json({
    message: "Item added to cart",
    cart,
  });
};

const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { qty } = req.body;
    const user = req.user;

    // Find cart
    const cart = await cartModel.findOne({ user: user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find item index
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Remove item if qty <= 0
    if (qty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = qty;
    }

    await cart.save();

    return res.status(200).json({
      message: "Cart updated",
      cart,
    });
  } catch (error) {
    console.error("Update Cart Item Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};



const getCart = async (req, res) => {
  try {
    const user = req.user;

    let cart = await cartModel.findOne({ user: user.id });

    if (!cart) {
      cart = new cartModel({
        user: user.id,
        items: [],
      });

      await cart.save();
    }

    return res.status(200).json({
      cart,
      totals: {
        itemCount: cart.items.length,
        totalQuantity: cart.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};




const deleteCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = req.user;

    // Find user's cart
    const cart = await cartModel.findOne({ user: user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find item index
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    await cart.save();

    return res.status(200).json({
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    console.error("Delete Cart Item Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};




const clearCart = async (req, res) => {
  try {
    const user = req.user;

    let cart = await cartModel.findOne({ user: user.id });

    // If cart does not exist, create empty cart
    if (!cart) {
      cart = new cartModel({
        user: user.id,
        items: [],
      });
    } else {
      // Clear existing cart
      cart.items = [];
    }

    await cart.save();

    return res.status(200).json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};





module.exports = { addItemToCart, updateCartItem, getCart, deleteCartItem, clearCart };

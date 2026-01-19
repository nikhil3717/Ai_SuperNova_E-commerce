const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken")
const redis = require("../db/redis")

const registerUser = async (req, res) => {
  try {
    const { username, email, password, fullName: { firstName, lastName } , role} = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      fullName: {
        firstName,
        lastName
      },
      role: role || 'user'
    })


    const token = await jwt.sign({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role


    }, process.env.JWT_SECRET, { expiresIn: "1d" })

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxage: 24 * 60 * 60 * 1000
    })

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Find user by email
    const user = await userModel.findOne({ $or: [{ email }, { username }] }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }, process.env.JWT_SECRET, { expiresIn: "1d" });


    console.log("JWT TOKEN:", token);


    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


const getCurrentUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }

}


const logoutUser = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (token) {
      await redis.set(
        `blacklist:${token}`,
        "true",
        "EX",
        24 * 60 * 60
      );
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: false, // IMPORTANT for Jest
      sameSite: "strict"
    });

    return res.status(200).json({
      message: "Logout successful"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


const GetUserAddresses = async (req, res) => {
  try {
    const id = req.user.id;
    const user = await userModel.findById(id).select("addresses");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({
      message: "User addresses fetched successfully",
      addresses: user.addresses || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const addAddress = async (req, res) => {
  try {
    const { street, city, state, zipCode, country, phone } = req.body;

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.addresses) {
      user.addresses = [];
    }

    const newAddress = {
      street,
      city,
      state,
      zipCode,
      country,
      phone,
      isDefault: user.addresses.length === 0 // First address is default
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      message: "Address added successfully",
      address: newAddress
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.addresses || user.addresses.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();

    res.status(200).json({
      message: "Address deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = { registerUser, loginUser, getCurrentUser, logoutUser, GetUserAddresses, addAddress, deleteAddress };
const mongoose = require("mongoose");


const AddressSchema = new mongoose.Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String },
  phone: { type: String },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    select: false
  },
  fullName: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }
  },

  role: {
    type: String,
    enum: ["user", "seller"],
    default: "user"
  },

  addresses: [AddressSchema]

})


module.exports = mongoose.model("user", userSchema);
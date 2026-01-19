const mongoose = require("mongoose");

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL)
    console.log("Connected to the database successfully")

  } catch (error) {
    console.error("Database connection error:", error)
  }
}

module.exports = connectToDatabase;
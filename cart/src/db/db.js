const mongoose = require("mongoose")

const connectToDB = async () => {
  
  try {

    await mongoose.connect(process.env.MONGO_URL)
    console.log("Connect to dataBase")
    
  } catch (error) {
    console.log(error)
  }

}

module.exports = connectToDB
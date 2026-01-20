const mongoose = require("mongoose")

const connectToDB = async () => {
   try {

    await mongoose.connect(process.env.MONGO_URL)
    console.log("connect to Database")
    
   } catch (error) {
     console.log(error)
   }
}

module.exports = connectToDB 
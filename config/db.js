 const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
      const mongoURI =
      process.env.MONGO_URI_ATLAS ||
      "mongodb+srv://app_user:Ibra987654321@commodity-credit-cluster0.jffgeq2.mongodb.net/ccn_database";

     
    console.log("Mongo URI used:", mongoURI);

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

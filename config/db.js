 const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);

    const mongoURI = process.env.MONGO_URI_ATLAS;

    if (!mongoURI) {
      throw new Error("❌ MONGO_URI_ATLAS haijawekwa kwenye env");
    }

    console.log(
      "Mongo URI used:",
      mongoURI.includes("mongodb+srv") ? "ATLAS" : "LOCAL"
    );

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

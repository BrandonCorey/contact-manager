const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

async function mongo() {
  try {
    mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB", error.message);
  }
}

module.exports = {
  mongo,
};

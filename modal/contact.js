const mongoose = require("mongoose");

const contactSchema = mongoose.Schema({
  full_name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  phone_number: {
    type: String,
    required: true,
  },

  tags: [{ type: String }],
});

contactSchema.set("toJSON", {
  transform: (_, returnedObj) => {
    returnedObj.id = returnedObj._id.toString();
    delete returnedObj._id;
    delete returnedObj.__v;
  },
});

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;

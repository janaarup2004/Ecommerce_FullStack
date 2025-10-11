const mongoose = require("../config/mongoose-connection");

const orderSchema = mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "user",
        required: true 
    },
    products: [{ 
        type: mongoose.Schema.Types.ObjectId,
         ref: "product" 
    }],
    address: {
        fullname: String,
        number: String,
        email: String,
        flat: String,
        area: String,
        pincode: String
    },
    paymentMode: { type: String },
    totalPrice: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("order", orderSchema);

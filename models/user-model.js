const mongoose = require("../config/mongoose-connection");

const userSchema = mongoose.Schema({
    fullname: {
        type: String,
        minLength: 3,
        trim: true,
    },
    email: String,
    password: String,
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "product"
    }],
    contact: Number,
    orders: {
        type: Array,
        default: []
    },
    picture: String,
});

module.exports = mongoose.model("user", userSchema);

const express=require("express");
const router=express.Router();
const isLoggedin = require("../middlewares/isLoggedin");
const productModel=require("../models/product-model");
const userModel = require("../models/user-model");
const orderModel = require("../models/order-model");
const ownerModel = require("../models/owners-model");
const isOwner = require("../middlewares/isOwner");
const {generateToken} = require("../utiles/generateToken");


router.get("/",function(req,res){
    let error = req.flash("error");
    let success = req.flash("success");
    res.render("index", { error, success, loggedin: false });
})

router.get("/shop",isLoggedin,async function(req,res){
   let products= await productModel.find()
   let success = req.flash("success");
    res.render("shop",{products, success})
})
// My Account page: show user details and orders
router.get("/myaccount", isLoggedin, async function(req, res) {
    const user = await userModel.findOne({ email: req.user.email });
    const orders = await orderModel.find({ user: user._id })
        .sort({ createdAt: -1 })
        .populate("products");
    res.render("myaccount", { user, orders });
});

router.get("/cart",isLoggedin,async function(req,res){
    let user = await userModel.findOne({ email: req.user.email }).populate("cart");
    let cartProducts = user.cart || [];
    res.render("cart", { cartProducts, user });
})

router.get("/addtocart/:id",isLoggedin,async function(req,res){
   let user=await userModel.findOne({email:req.user.email})
    user.cart.push(req.params.id);
    await user.save();
    req.flash("success","Product added to cart successfully.")
    res.redirect("/shop");
})
// Remove product from cart
router.post("/removefromcart/:id", isLoggedin, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    // Remove all occurrences of the product from the cart
    user.cart = user.cart.filter(pid => pid.toString() !== req.params.id); // Filter out the product by ID
    await user.save();
    req.flash("success", "Product removed from cart.");
    res.redirect("/cart");
});

// Show place order page for a specific user by ID
router.get("/placeorder/:id", isLoggedin, async function(req, res) {
    const user = await userModel.findById(req.params.id);
    if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/cart");
    }
    res.render("placeorder", { user });
});


// Handle place order form submission for a specific user by ID
router.post("/placeorder/:id", isLoggedin, async function(req, res) {
    let user = await userModel.findById(req.params.id);
    if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/cart");
    }
    // Store address in session for payment step, do not save order yet
    req.session.address = {
        fullname: req.body.fullname,
        number: req.body.number,
        email: req.body.email,
        flat: req.body.flat,
        area: req.body.area,
        pincode: req.body.pincode
    };
    req.flash("success", "Address saved! Proceed to payment.");
    res.redirect("/payment");
});

// Show payment page
router.get("/payment", isLoggedin, function(req, res) {
    res.render("payment");
});

// Cash on Delivery payment route
router.post("/payment/cod", isLoggedin, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/cart");
    }
    // Get address from session
    const address = req.session.address;
    if (!address) {
        req.flash("error", "Address not found. Please fill address form first.");
        return res.redirect("/cart");
    }
    // Calculate total price (discounted price + shipping fee)
    let totalPrice = 0;
    if (user.cart && user.cart.length > 0) {
        const products = await productModel.find({ _id: { $in: user.cart } });
        const discountedTotal = products.reduce((sum, p) => sum + ((p.price || 0) - (p.discount || 0)), 0);
        const shippingFee = 40;
        totalPrice = discountedTotal + shippingFee;
    }
    // Save order as COD
    await orderModel.create({
        user: user._id,
        products: user.cart,
        address: address,
        paymentMode: "COD",
        customerName: address.fullname,
        customerMobile: address.number,
        customerEmail: address.email,
        totalPrice: totalPrice
    });
    // Optionally clear address from session
    req.session.address = null;
    req.flash("success", "Order placed successfully! Pay on delivery.");
    res.redirect("/shop");
});

router.get("/owner-login", function(req, res) {
    res.render("owner-login");
});
router.post("/owner-login", async function(req, res) {
    const { email, password } = req.body;
    // Here you would typically check the credentials against a database
    const owner = await ownerModel.find({ email: email });
    if (!owner || owner.length === 0) {
        req.flash("error", "Invalid email or password.");
        return res.redirect("/owner-login");
    }
    // If the owner exists, you can set a cookie or session to keep them logged in
    bcrypt.compare(password, owner[0].password, function(err, result) {
        if (err) {
            req.flash("error", "Something went wrong.");
            return res.redirect("/owner-login");
        }
        if (!result) {
            req.flash("error", "Invalid email or password.");
            return res.redirect("/owner-login");
        }
        // Generate token and set cookie
        let token = generateToken(owner[0]);
        res.cookie("token", token);
        req.flash("success", "Owner logged in successfully.");
        res.redirect("/owners/admin");
    });

})
router.get("/admin/logout", isOwner, function(req, res) {
    res.cookie("token", "");
    req.flash("success", "Owner logged out successfully.");
    res.redirect("/");
})

router.get("/users/logout",isLoggedin,function(req,res){
    res.cookie("token","");
    res.redirect("/")
})

module.exports=router
const ownerModel = require("../models/owners-model");
const jwt = require("jsonwebtoken");

module.exports = async function(req, res, next) {
    // Check for token in cookies
    if (!req.cookies.token) {
        req.flash("error", "You need to login as owner first");
        return res.redirect("/");
    }
    try {
        // Verify token
        let decode = jwt.verify(req.cookies.token, process.env.JWT_KEY);
        // Find owner by email
        let owner = await ownerModel.findOne({ email: decode.email }).select("-password");
        if (!owner) {
            req.flash("error", "Owner not found");
            return res.redirect("/");
        }
        req.owner = owner;
        next();
    } catch (err) {
        req.flash("error", "Something went wrong");
        res.redirect("/");
    }
};

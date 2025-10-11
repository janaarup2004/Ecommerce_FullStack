

const express=require("express")
const router=express.Router();
const ownerModel=require("../models/owners-model")
const bcrypt=require("bcrypt")
const cookieParser=require("cookie-parser")
const jwt=require("jsonwebtoken")
const {generateToken}=require("../utiles/generateToken")
const isOwner = require("../middlewares/isOwner");

router.get("/",function(req,res){
    res.send("hey it's working")
})

if(process.env.NODE_ENV === "development"){
    router.post("/create",async function(req,res){
       let owners=await ownerModel.find()
       if(owners.length > 0) {
        return res
       .status(503)
       .send("you don't have permission to create new owner")
       }
       else{
        let {fullname,email,password}=req.body;
        bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt,async function(err, hash) {
        if(err) return res.status(500).send(err.message);
        else{
        let createdOwner=await ownerModel.create({
        fullname,
        email,
        password:hash,
       })
       let token=generateToken(createdOwner)
       res.cookie("token",token)
         req.flash("success", "Owner created successfully.")
         //res.send("Owner created successfully. Now you can login.")
         res.redirect("/owners/admin")
      }
    })

 })
}
 })
}
// Owner login route
router.post("/login", async function(req, res) {
    const { email, password } = req.body;
    const owner = await ownerModel.findOne({ email });
    if (!owner) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/owner-login");
    }
    const match = await bcrypt.compare(password, owner.password);
    if (!match) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/owner-login");
    }
    const token = generateToken(owner);
    res.cookie("token", token);
    req.flash("success", "Owner logged in successfully.");
    res.redirect("/owners/admin");
});

router.get("/admin", isOwner, function(req,res){
   let success= req.flash("success")
    res.render("createproducts",{success})
})

module.exports=router
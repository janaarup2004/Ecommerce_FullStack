const userModel = require("../models/user-model");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const cookieparser = require("cookie-parser");
const {generateToken}=require("../utiles/generateToken")
const flash=require("connect-flash")

module.exports.registerUser=async function(req,res){
   try{
     let {fullname,email,password}=req.body;

     let user=await userModel.findOne({email:email})
     if(user) return res.status(401).send("you already have an account, please login.")

     bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt,async function(err, hash) {
        if(err) return res.status(500).send(err.message);
        else{
        let user=await userModel.create({
        fullname,
        email,
        password: hash,
        })
        let token=generateToken(user)
        res.cookie("token",token)
        req.flash("success", "user created successfully.Now you can login")
        res.redirect("/")
        }       
       });
     });
    
    } catch(err){
    res.send(err.message);
   }  
}

module.exports.loginUser=async function(req,res) {
    let {email,password}=req.body;
    let user=await userModel.findOne({email:email})
    if(!user) return req.flash("error","email or password incorrect.")   //when we use return there was no need to write else{}

    bcrypt.compare(password, user.password, function(err, result) {
        if(err) return res.status(500).send(err.message);
        if(!result) return res.send("email or password incorrect.")

        let token=generateToken(user)
        res.cookie("token",token)
        res.redirect("/shop")
      }
    );
}

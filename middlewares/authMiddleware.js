var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const userModel = require('../models/userModel.js');
// const User = userModel.User;
// dotenv.config();


class authMiddleware{
    constructor(){
        this.user = userModel.User
    }
    async requireSignIn(req,res,next){
        
            const token = req.cookies.accessToken; // if you're using cookies

            if (!token) {
                return res.status(401).json({ message: 'Access token missing' });
            }

            try {
                const decoded = JWT.verify(token, process.env.TOKEN_SECRET);
                req.userId = decoded._id; // add userId to request
                // console.log(decoded);
                next();
            }catch (err) {
                 if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ message: 'Access token expired' });
                }

                return res.status(401).json({ message: 'Invalid or expired token' });
            }
    };

    async is_admin(req,res,next){
        //const user_name = req.body.name;
        //console.log(req.user);
        const user_email=req.user.email;
        try{
        const my_user = await this.user.findOne({ email: user_email }); 
        //console.log(my_user);
        const name = my_user.name;
        if(user_email=="arghag123@gmail.com"){
           
            next();
        }
        else{
            req.user = "testuser";
            res.status(201).send({
                success:false,
                message:"You Are Not Admin",
                name:my_user.name,
                phone:my_user.phone,
            })
        }
        }
        catch(err){
            console.log(err);
            res.send(err);
          
        }
    }
}

module.exports = authMiddleware;
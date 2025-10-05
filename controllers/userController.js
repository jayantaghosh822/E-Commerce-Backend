const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const userModel = require('../models/userModel.js');
const tokenModel = require("../models/tokenModel.js");
const bcrypt = require('bcryptjs');
const refreshTokenModel = require("../models/refreshTokenModel.js");
const axios = require("axios");
dotenv.config();

class UserController {
    constructor() {
        this.user = userModel.User; // Assigning the user model
        // this.register = this.register.bind(this);
        this.token = tokenModel.Token;
        this.refreshToken = refreshTokenModel.RefreshToken;
    }

    // User Registration Method
    async userRegister(req, res) {
        try {
            // console.log(req.body);
            let { firstname, lastname , displayname, email, password, phone } = req.body;
            if(firstname == '' || lastname == '' || email == '' || password == '' || phone == ''){
                return res.status(400).json({
                    success: false,
                    message: "Either of the fields is empty",
                });
            }
            const existing_user = await this.user.findOne({ email: req.body.email });
            // console.log(existing_user);
            const salt = await bcrypt.genSalt(10);
            password = await bcrypt.hash(password, salt);
            const isVerified = false;
            const role = 2;
            const auth_provider =  "password";
            if (!existing_user) {
                const newUser = await new this.user({
                    firstname,
                    lastname,
                    email,
                    displayname,
                    password,
                    isVerified,
                    auth_provider,
                    phone,
                    role
                }).save();

                let origin = (req.headers.origin);
               

                let reset_token = await new this.token({
                        userId: newUser._id,
                        token: crypto.randomBytes(32).toString("hex"),
                }).save();
                
                const link = `${origin}/verify-email/${reset_token.token}`;
                const mailStatus = await sendEmail.sendEmail(newUser.email, "Password reset", link);
                if(mailStatus.status=='sent'){
                    return res.status(201).json({
                        success: true,
                        message: "Email Verification link sent to your email account",
                        newUser,
                    });
                }
                
            } else {
                return res.status(200).json({
                    success: false,
                    message: "User already exists with this email address",
                });
            }
        } catch (error) {
            console.error("Registration Error:", error);
            return res.status(500).json({
                success: false,
                message: "Server error",
            });
        }
    }

    async sendEmailVerification(req,res){
        try{
        console.log(req.query);
        if(req.query.userID){
            console.log(req.query.userID);
            const userID = req.query.userID;
            const user = await this.user.findById(userID , {email:1});
            console.log(user.email);
            let origin = (req.headers.origin);
            let reset_token = await new this.token({
                        userId: user._id,
                        token: crypto.randomBytes(32).toString("hex"),
                }).save();
                
            const link = `${origin}/verify-email/${reset_token.token}`;
            const mailStatus = await sendEmail.sendEmail(user.email, "Email Verification Link", link);
            if(mailStatus.status=='sent'){
                return res.status(201).json({
                    success: true,
                    message: "Email verification link sent to your email account"
                });
            }else{
                return res.status(401).json({
                    success: false,
                    message: "Email Verification link failed to sent!"
                });
            }
                
        }
        
         res.status(201).send({
            success:true,
            message:"mail sent"
        })
        }catch(err){
            console.log(err);
            return res.status(401).json({
                    success: false,
                    message: "Something Went Wrong"
            });
        }
        
    }

    async fetchUser(req, res){
        // console.log(req.cookies.token);
        const userId = req.userId;
        console.log(req.userId);
        if(userId){
            try{
                const user = await this.user.findById(userId ,{firstname:1 , lastname:1 , displayname:1 , email:1 , role:1});
                let userType = 'customer';
                if(user.role == 1){
                    userType = 'admin';
                }
                console.log("me user",user);
                return res.status(200).send({
                    success: true,
                    "message":"User logged inn",
                    user: {
                        firstname:user.firstname,
                        lastname:user.lastname,
                        displayname:user.firstname,
                        email:user.email,
                        userType:userType
                    }
                });
            }catch(err){
                console.log(err);
                return res.status(500).send({
                    success: false,
                    message:"Server Error"
                });
            }
            
        }else{
            return res.status(200).send({
                success: true,
                message:"No User"
            });
        }
        
    }

    generateAccessToken(userId) {
     return JWT.sign({  
        _id: userId,
      }, process.env.TOKEN_SECRET, { expiresIn: '15m' });
    }

    generateRefreshToken(userId , sessionId) {
        const refreshToken = JWT.sign({ 
             userId: userId,
             sessionId: sessionId
            }, process.env.TOKEN_SECRET, {
            expiresIn: '7d'
        });
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return { token: refreshToken, expiresAt };
    }

    generateSessionId() {
        return crypto.randomBytes(12).toString('hex');
    }

    async userLogin(req, res){
        const userEmail = req.body.email;
        const userPass = req.body.pass;
      
        try { 
            // Check if the user exists
            const user = await this.user.findOne({ email: userEmail });
            
            if (user) { 
                console.log(user.auth_provider);
                if(user.auth_provider == 'google'){
                    console.log("sending wromg auh mess");
                    return res.status(404).send({
                        success: false,
                        error: "This email is registered using Google authentication. Please log in using Google."
                    });
                }
                console.log(user);
                console.log(userPass);
                // Check if password matches
                // const result = user_pass === my_user.password;
                const isMatch = await bcrypt.compare(userPass, user.password);
                // if (!isMatch) {
                //   return res.status(400).json({ message: "Invalid credentials." });
                // }
               
                if (isMatch) { 
                    try {
                        console.log(user);
                        if(!user.isVerified){
                            return res.status(401).json({ success: false, userId:user._id, error: "email not verified" }); 
                        }
                        let userType = 'customer';
                        if(user.role == 1){
                            userType = 'admin';
                        }

                        const accessToken = this.generateAccessToken( user._id);
                        console.log(accessToken);
                        const sessionId = this.generateSessionId();
                        const { token: refreshToken, expiresAt } = this.generateRefreshToken( user._id , sessionId);
                        console.log('refreshToken',refreshToken);

                       
                        await this.refreshToken.create({
                            userId: user._id,
                            sessionId: sessionId,
                            token: refreshToken,
                            expiresAt
                        });
                        // const token = JWT.sign({ 
                        // _id: my_user._id,
                        // email: my_user.email,
                        // name: my_user.displayname,
                        // userType: userType
                        // }, process.env.TOKEN_SECRET, { expiresIn: '1d' });


                        res.cookie("accessToken", accessToken, {
                        httpOnly: true,     // Can't be accessed by JS 👈
                        secure: true,       // Only sent over HTTPS (use false in local dev)
                        sameSite: "Lax",    // Or "None" if cross-site, but then also use secure: true
                        maxAge: 15 * 60 * 1000, // 15 mins
                        });

                        res.cookie("refreshToken", refreshToken, {
                        httpOnly: true,     // Can't be accessed by JS 👈
                        secure: true,       // Only sent over HTTPS (use false in local dev)
                        sameSite: "Lax",    // Or "None" if cross-site, but then also use secure: true
                        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 day
                        });


                        return res.status(200).send({
                            success: true,
                            message: "User logged in",
                            user: {
                                displayname: user.firstname || 'N/A', // Provide default values if fields are undefined
                                email: user.email || 'N/A',
                                userType: userType
                            },
                        });
                    } catch (error) {
                        console.error("Token generation error:", error);
                        return res.status(500).json({ success: false, error: "Internal server error" });
                    }
                } else { 
                    return res.status(401).json({ success: false, error: "Password doesn't match" }); 
                } 
            } else { 
                return res.status(404).json({ success: false, error: "User doesn't exist" }); 
            } 
        } catch (error) { 
            console.error("Database query error:", error);
            return res.status(500).json({ success: false, error: "Internal server error" }); 
        } 
    };

    async getAccessToken(req,res){
        // console.log(req);
        const token = req.cookies.refreshToken;
        console.log(token);
        if (!token) return res.status(401).json({ error: 'No refresh token provided' });

        try {
            const payload = JWT.verify(token, process.env.TOKEN_SECRET);
            console.log(payload);
            // return;
            const { sessionId, userId } = payload;
            console.log(sessionId);
            console.log(userId);
            const session = await this.refreshToken.findOne({ sessionId });
            console.log(session);
            if (!session || session.token !== token) {
                // console.log(session.token);

                console.log(token);
                // Reuse detected or session not valid
                if (session) {
                    await this.refreshToken.deleteOne({ sessionId: sessionId }); // or findByIdAndDelete
                    // console.log(sessiondelete);
                }
                res.clearCookie("refreshToken", {
                    httpOnly: true,
                    secure: true,
                    sameSite: "Lax",
                });
                
                return res.status(403).json({ error: 'Refresh token reuse detected or invalid' });
            }

            // Rotate token: invalidate old, issue new
            
            const { token: refreshToken, expiresAt } = this.generateRefreshToken(userId,sessionId);

           
                       
            await this.refreshToken.findOneAndUpdate(
                { sessionId }, // find by sessionId
                {
                    sessionId,
                    token: refreshToken,
                    userId,
                },
                {
                    upsert: false,           // create if not found
                    new: true,              // return the updated document
                    setDefaultsOnInsert: true, // apply defaults from schema if inserting
                }
            );

            const accessToken = this.generateAccessToken( userId );
           
             res.cookie("accessToken", accessToken, {
                httpOnly: true,     // Can't be accessed by JS 👈
                secure: true,       // Only sent over HTTPS (use false in local dev)
                sameSite: "Lax",    // Or "None" if cross-site, but then also use secure: true
                maxAge: 15 * 60 * 1000, // 15 mins
            });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,     // Can't be accessed by JS 👈
                secure: true,       // Only sent over HTTPS (use false in local dev)
                sameSite: "Lax",    // Or "None" if cross-site, but then also use secure: true
                maxAge: 7 * 24 * 60 * 60 * 1000, // 1 day
            });

            return res.status(200).json({ message: 'Access token refreshed successfully' });


        } catch (err) {
            console.log(err);
            return res.status(403).json({ error: 'Invalid or expired refresh token' });
        }
    }


    
    async userAuthGoogle(req, res) {
        try{
            const user = req.body;
            if(user.email!=''){
                console.log(user.email);
                const existingUser = await this.user.findOne({ email: user.email });
                console.log(existingUser);
                if(existingUser && existingUser.auth_provider == 'password'){
                    console.log("sending wromg auh mess");
                    return res.status(404).send({
                        success: false,
                        error: "This email is registered using password authentication. Please log in using pssword."
                    });
                }
                console.log("user ret",existingUser);
                
                if(existingUser==null){
                    console.log("usr not presenbt");
                    const firstname = user.firstname;
                    const lastname = user.lastname;
                    const email = user.email;
                    const displayname = user.displayname;
                    const role = 2;
                    const phone = '0123456789';
                    let password = email;
                    const  auth_provider = 'google';
                    const salt = await bcrypt.genSalt(10);
                    password = await bcrypt.hash(password, salt);
                    const newUser = await new this.user({
                        firstname,
                        lastname,
                        email,
                        displayname,
                        password,
                        auth_provider,
                        phone,
                        role
                    }).save();
                    console.log(newUser);
                    if(newUser){
                        try {
                        const accessToken = this.generateAccessToken( user._id);
                        console.log(accessToken);
                        const sessionId = this.generateSessionId();
                        const { token: refreshToken, expiresAt } = this.generateRefreshToken( newUser._id , sessionId);
                        console.log('refreshToken',refreshToken);

                       
                        await this.refreshToken.create({
                            userId: newUser._id,
                            sessionId: sessionId,
                            token: refreshToken,
                            expiresAt
                        });
                        // const token = JWT.sign({ 
                        // _id: my_user._id,
                        // email: my_user.email,
                        // name: my_user.displayname,
                        // userType: userType
                        // }, process.env.TOKEN_SECRET, { expiresIn: '1d' });


                        res.cookie("accessToken", accessToken, {
                        httpOnly: true,     // Can't be accessed by JS 👈
                        secure: true,       // Only sent over HTTPS (use false in local dev)
                        sameSite: "Lax",    // Or "None" if cross-site, but then also use secure: true
                        maxAge: 15 * 60 * 1000, // 15 mins
                        });

                        res.cookie("refreshToken", refreshToken, {
                        httpOnly: true,     // Can't be accessed by JS 👈
                        secure: true,       // Only sent over HTTPS (use false in local dev)
                        sameSite: "Lax",    // Or "None" if cross-site, but then also use secure: true
                        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 day
                        });
                            res.status(200).send({
                                success: true,
                                message: "User logged in",
                                user: {
                                    displayname: newUser.firstname || 'N/A', // Provide default values if fields are undefined
                                    email: newUser.email || 'N/A',
                                    userType: 'customer'
                                },
                            });
                        } catch (error) {
                            console.error("Token generation error:", error);
                            res.status(500).json({ success: false, error: "Internal server error" });
                        }
                    }
                }else{
                    let userType = 'customer';
                    if(existingUser.role == 1){
                        userType = 'admin';
                    }
                    console.log("usr presenbt");
                    // const token = JWT.sign({ _id: existingUser._id }, process.env.TOKEN_SECRET, { expiresIn: '1d' });
                    const accessToken = this.generateAccessToken( existingUser._id);
                        console.log(accessToken);
                        const sessionId = this.generateSessionId();
                        const { token: refreshToken, expiresAt } = this.generateRefreshToken( existingUser._id , sessionId);
                        console.log('refreshToken',refreshToken);

                       
                        await this.refreshToken.create({
                            userId: existingUser._id,
                            sessionId: sessionId,
                            token: refreshToken,
                            expiresAt
                        });
                        // const token = JWT.sign({ 
                        // _id: my_user._id,
                        // email: my_user.email,
                        // name: my_user.displayname,
                        // userType: userType
                        // }, process.env.TOKEN_SECRET, { expiresIn: '1d' });


                        res.cookie("accessToken", accessToken, {
                        httpOnly: true,     // Can't be accessed by JS 👈
                        secure: true,       // Only sent over HTTPS (use false in local dev)
                        sameSite: "Lax",    // Or "None" if cross-site, but then also use secure: true
                        maxAge: 15 * 60 * 1000, // 15 mins
                        });

                        res.cookie("refreshToken", refreshToken, {
                        httpOnly: true,     // Can't be accessed by JS 👈
                        secure: true,       // Only sent over HTTPS (use false in local dev)
                        sameSite: "Lax",    // Or "None" if cross-site, but then also use secure: true
                        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 day
                        });
                        res.status(200).send({
                            success: true,
                            message: "User logged in",
                            user: {
                                displayname: existingUser.firstname || 'N/A', // Provide default values if fields are undefined
                                email: existingUser.email || 'N/A',
                                userType: userType
                            },
                        });
                    
                }
            }
        }catch(err){
            console.log(err);
            res.status(500).json({ success: false, error: "Internal server error" });
        }
       
    }

    async userLogout(req, res){

        const token = req.cookies.refreshToken;
        console.log(token);
        if (!token) return res.status(401).json({ error: 'No refresh token provided' });
        try {
            const payload = JWT.verify(token, process.env.TOKEN_SECRET);
            console.log(payload);
            // return;
            const { sessionId, userId } = payload;
            console.log(sessionId);
            console.log(userId);
            const session = await this.refreshToken.findOne({ sessionId });
            console.log(session);

            console.log(token);
            // Reuse detected or session not valid
            if (session) {
                await this.refreshToken.deleteOne({ sessionId: sessionId }); // or findByIdAndDelete
                // console.log(sessiondelete);
            }
            
            res.clearCookie("accessToken", {
                httpOnly: true,
                secure: true,
                sameSite: "Lax",
            });
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: true,
                sameSite: "Lax",
            });
            res.status(200).json({ message: "Logged out" });
        }catch(err){
            res.status(200).json({ message: "No User Data Found" });
        }

        
    }

    async getUserById(req,res){
        try{
            const userId = req.params.ID;
            // console.log("fromcontroller",req.body);
            const userById = await this.user.findById(userId).select('firstname lastname displayname email phone role');
            //  console.log(userById);
            if(userById){
                res.status(200).send(userById);
            }else{
                res.status(401).send({
                    success: false,
                    message: 'user not found'
                });
            }
            
        }catch(err){
            res.send(err);
        }
       
       
    }

    async sendPasswordResetLink(req,res){
        let origin = (req.headers.origin);
        
      
        const userEmail = req.body.vemail;
        let userx="";
        
        if(userEmail!=""){
        
        try{
      
            userx =  await this.user.findOne({ email: userEmail }); 
            if(userx){
                
                let reset_token = await this.token.findOne({ userId: userx._id });
                    if (!reset_token) {
                    reset_token = await new this.token({
                            userId: userx._id,
                            token: crypto.randomBytes(32).toString("hex"),
                        }).save();
                    }
                // console.log(process.env.BASE_URL);
                if(origin == undefined){
                    origin = process.env.MAIL_SEND_BASE_URL
                }
                const link = `${origin}/password-reset/${userx._id}/${reset_token.token}`;
                console.log(userEmail);
                console.log(link);
               

                // 🔹 Send POST request to your PHP endpoint
                const response = await axios.post(
                    "https://argha-email-provider.ct.ws/mail-services/send-email.php",
                    {
                        to: userEmail,
                        subject: "Password Reset",
                        message: `Click the link to reset your password: ${link}`,
                    },
                    {
                        headers: { "Content-Type": "application/json" },
                        timeout: 10000,
                    }
                );

                console.log("MAIL RESPONSE:", response.data);


                const mailStatus = await sendEmail.sendEmail(userEmail, "Password reset", link);
                if(mailStatus.status=='sent'){
                    res.status(201).send({
                        success:true,
                        User:"Verified",
                        message:"Password reset link sent to your email account",
                    })
                }else{
                    res.status(500).send({
                        success:false,
                        User:"Verified",
                        message:"Something Went Wrong",
                    })
                }
                
            }
            else{
                res.status(404).send({
                success:false,
                message:"Not Registered User",
                
            })
            }
      
        }
        catch(error){
          console.log(error);
          res.status(201).send({
             
            message:"Something Went Wrong",
           
        })
        }
       
      }else{
        res.status(401).send({
            success:false,
            message:'empty email'
        })
      }
        
    }

    // async sendPasswordResetLink(req,res){
    //     console.log(req.body.email);
    // }

    async resetPasswordByEmail(req,res){
        try {
            console.log(req.body.email);
            const userX = await this.user.findById(req.body.userId);
            if (!userX) return res.status(404).send({
                success:false,
                message:'Invalid User'
            });
    
            const find_token = await this.token.findOne({
                userId: req.body.userId,
                token: req.body.resetToken,
            });

            if(req.body.resetToken){
                // console.log("gere");
                if (!find_token) return res.status(401).send({
                    success:false,
                    message:'Token Expired'
                });
            }
            if (!find_token) return res.status(401).send({
                success:false,
                message:'Empty Token'
            });
    
            userX.password = req.body.vpass;
            await userX.save();
            await find_token.deleteOne();
    
            return res.status(200).send({
                success: true,
                message: "Password Reset Successfully!",
            });
        } catch (error) {
            res.send("An error occured");
            console.log(error);
        }
    }

    async verifyEmailToken(req,res){
        try{
        const token = req.query.token;

        console.log(token);
        const findEmailToken = await this.token.findOne({
            token: token,
        });
        let tokenId = '';
        if(findEmailToken!=null){
            tokenId = findEmailToken._id;
        }
         
        // console.log(findEmailToken); 
        if(findEmailToken!=null){
        // console.log("not null");
        let userId = findEmailToken.userId;
        // console.log("userId:", userId);
        const mailVerified = await this.user.findOneAndUpdate({_id:userId},{isVerified:true});
        console.log(mailVerified); 
        if(mailVerified){
            res.status(201).send({
                success:true,
                message:"Mail Verified Successfully!",
            })
        }
        await this.token.findByIdAndDelete(tokenId);
        }else{
            res.status(201).send({
                success:false,
                message:"Token Has Expired!",
            });
        }
        }catch(err){
            console.log(err);
            res.status(500).send({
                success:false,
                message:"Server Error!",
            })
        }
        

    }
}

module.exports =  UserController;

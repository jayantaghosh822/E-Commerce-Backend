const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const userModel = require('../models/userModel.js');
const user = userModel.User;
dotenv.config();

class UserController {
    constructor() {
        this.User = userModel.User; // Assigning the user model
        // this.register = this.register.bind(this);
    }

    // User Registration Method
    async userRegister(req, res) {
        try {
            // console.log(req.body);
            const { firstname, lastname , displayname, email, password, phone } = req.body;
            if(firstname == '' || lastname == '' || email == '' || password == '' || phone == ''){
                return res.status(400).json({
                    success: false,
                    message: "Either of the fields is empty",
                });
            }
            const existing_user = await user.findOne({ email: req.body.email });
            // console.log(existing_user);

            
            const role = 2;

            if (!existing_user) {
                const newUser = await new this.User({
                    firstname,
                    lastname,
                    email,
                    displayname,
                    password,
                    phone,
                    role
                }).save();

                return res.status(201).json({
                    success: true,
                    message: "User registered successfully",
                    newUser,
                });
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
    async userLogin(req, res){
        const user_email = req.body.email;
        const user_pass = req.body.pass;
      
        try { 
            // Check if the user exists
            const my_user = await user.findOne({ email: user_email });
      
            if (my_user) { 
                // Check if password matches
                const result = user_pass === my_user.password;
      
                if (result) { 
                    try {
                        const token = JWT.sign({ _id: my_user._id }, process.env.TOKEN_SECRET, { expiresIn: '1d' });
      
                        res.status(200).send({
                            success: true,
                            message: "User logged in",
                            user: {
                                name: my_user.displayname || 'N/A', // Provide default values if fields are undefined
                                email: my_user.email || 'N/A',
                                id: my_user._id,
                                token: token,
                            },
                        });
                    } catch (error) {
                        console.error("Token generation error:", error);
                        res.status(500).json({ success: false, error: "Internal server error" });
                    }
                } else { 
                    res.status(401).json({ success: false, error: "Password doesn't match" }); 
                } 
            } else { 
                res.status(404).json({ success: false, error: "User doesn't exist" }); 
            } 
        } catch (error) { 
            console.error("Database query error:", error);
            res.status(500).json({ success: false, error: "Internal server error" }); 
        } 
      };

}

module.exports =  UserController;

// const get_user_by_id = async(req,res)  => {
//    // console.log(req);
//     const id = req.body.id;
//    const my_user = user.findById(id).then(doc => {
//     console.log(doc);
//     res.send(doc);
//    });
//    //console.log(my_user);
   
    
// }

// const login = async (req, res) => {
//   const user_email = req.body.lemail;
//   const user_pass = req.body.lpass;

//   try { 
//       // Check if the user exists
//       const my_user = await user.findOne({ email: user_email });

//       if (my_user) { 
//           // Check if password matches
//           const result = user_pass === my_user.password;

//           if (result) { 
//               try {
//                   const token = JWT.sign({ _id: my_user._id }, process.env.TOKEN_SECRET, { expiresIn: '1d' });

//                   res.status(200).send({
//                       success: true,
//                       message: "User logged in",
//                       user: {
//                           name: my_user.displayname || 'N/A', // Provide default values if fields are undefined
//                           email: my_user.email || 'N/A',
//                           id: my_user._id,
//                           token: token,
//                       },
//                   });
//               } catch (error) {
//                   console.error("Token generation error:", error);
//                   res.status(500).json({ success: false, error: "Internal server error" });
//               }
//           } else { 
//               res.status(401).json({ success: false, error: "Password doesn't match" }); 
//           } 
//       } else { 
//           res.status(404).json({ success: false, error: "User doesn't exist" }); 
//       } 
//   } catch (error) { 
//       console.error("Database query error:", error);
//       res.status(500).json({ success: false, error: "Internal server error" }); 
//   } 
// };


// const test_controller = (req,res) =>{
//     try
//     {res.status(201).send({
       
//         message:"protected",
       
//     })
//     }
//     catch(error){
//         res.send(error);
//     }
// }

// const verify_email = async(req,res) => {
//   const tokenModel = require("../model/tokenmodel.js");
//   const token = tokenModel.Token;
//   let origin = (req.headers.origin);
//   console.log(req.headers.host);

//   const user_email = req.body.vemail;
//   let userx="";
//   console.log(req.body.email);
// if(user_email!=""){
  
//   try{

//     userx =  await user.findOne({ email: user_email }); 
//     if(userx){
//       console.log(userx);
//       let reset_token = await token.findOne({ userId: userx._id });
//         if (!reset_token) {
//           reset_token = await new token({
//                 userId: userx._id,
//                 token: crypto.randomBytes(32).toString("hex"),
//             }).save();
//         }
//         console.log(process.env.BASE_URL);
//         const link = `${origin}/password-reset/${userx._id}/${reset_token.token}`;
//         await sendEmail(user_email, "Password reset", link);
//       res.status(201).send({
//         success:true,
//         User:"Verified",
//        message:"password reset link sent to your email account",
//     })
//     }
//     else{
//       res.status(201).send({
//         success:false,
//         User:"Not Verified",
       
//     })
//     }

//   }
//   catch(error){
//     console.log(error);
//     res.status(201).send({
       
//       message:"Something Went Wrong",
     
//   })
//   }
 
// }
  
//   }

// const password_link = async(req,res) =>{
// console.log(req.header);
// } 

// const all_users = async(req,res) =>{
//   const my_user = await user.find(); 
//   console.log(my_user);
//   res.send(my_user);
// }

// const my_user = async(req,res)=>{
//   const user_id = req.params.user_id;
//   console.log(req.headers.user_id);
//  const my_user = await user.findOne({ _id: user_id }); 
//   console.log(my_user);
//   res.send(my_user);
// }

// const my_user_del = async(req,res)=>{
//   const user_id = req.headers.user_id;
//   console.log(req.headers.user_id);
//  const my_user = await user.deleteOne({ _id: user_id }); 
//   console.log(my_user);
//   res.send(my_user);
// }

// const user_address = async(req,res)=>{
//   console.log('user_id_address',req.params.user_id);
//   const user_id = req.params.user_id;
//   const finduseraddress = await address.findOne({userid:user_id});
//   if(finduseraddress!=null){
//     console.log(finduseraddress);
//     return res.status(200).send({
//       finduseraddress
//     })
//   }
//   else{
//     return res.status(204).send({
//       'message' : 'address not found',
//       'data_found' : true,
//     })
//   }
// }

// const save_user_address = async(req,res)=>{
//   const {firstname,lastname,streetAddress1,streetAddress2,city,state,zip,phone,country,email} = (req.body);
//   const userid = req.params.user_id;
//   console.log(req.params.user_id);
//   try{
//     const finduseraddress = await address.findOne({userid:userid});
//     if(finduseraddress){
//       const update_user = await address.findByIdAndUpdate(finduseraddress._id,{firstname,lastname,streetAddress1,streetAddress2,city,state,zip,phone,country,email},{ new: true });
//       if(update_user){
//         return res.status(200).send({
//           success:true,
//           message:"address updated successfully"
//         })
//       }
      
//     }
//     else{
//       const register_address =  await new address({userid,firstname,lastname,streetAddress1,streetAddress2,city,state,zip,phone,country,email}).save();
//       if(register_address){
//         console.log(register_address);
//         return res.status(200).send({
//           success:true,
//           message:"address saved successfully"
//         })
//       }
//     }
//   }
//   catch(err){
//     console.log(err);
//     return res.status(401).send({
//       message:"something went wrong"
//     })
//   }
// }

// const editmyaccount = async(req , res) =>{
// console.log(req.body);
// const userid = req.params.user_id;
// const {email , password , firstname , lastname, displayname} = req.body;
// const user_details = await user.findByIdAndUpdate(userid, {email , password , firstname , lastname, displayname}, { new: true });
// if(user_details){
//   console.log(user_details);
//   return res.status(200).send({
//     success:true,
//     message:"account updated successfully"
//   })
// }
// }
// module.exports = { 
//     registerController , 
//     get_user_by_id ,
//     login ,
//     test_controller,
//     verify_email,
//     password_link,
//     all_users,
//     my_user,
//     my_user_del,
//     user_address,
//     save_user_address,
//     editmyaccount
//  };
var express = require('express');
const router = express.Router();
const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const tokenModel = require("../models/tokenModel.js");
const token = tokenModel.Token;
const authMiddleware = require ('../middlewares/authMiddleware.js');
const UserController = require('../controllers/userController.js');
// const Joi = require("joi");

// const data_base = require("../config/db");
// const userRegisterController = userController.register;
// console.log(userRegisterController);
// const userRegisterController = (req, res) => new UserController().register(req, res);
// const myuserController = new UserController(); 
// const userRegisterController = (req, res) =>  myuserController.register(req, res);
// const test_controller = registerControllers.test_controller;
// const login = registerControllers.login;
// const verifyEmail = registerControllers.verify_email;
// const mail_password_link = registerControllers.password_link;
// const all_user = registerControllers.all_users;
// const my_user = registerControllers.my_user;
// const my_user_delete = registerControllers.my_user_del;
// const user_address = registerControllers.user_address;
// const save_user_address = registerControllers.save_user_address;
// const edit_user_account = registerControllers.editmyaccount;
// const my_user_by_id = userRegisterController.get_user_by_id;

// router.post('/register', userRegisterController);

// router.get('/user-id',my_user_by_id);
// router.post('/login',login);
// router.get('/get-user-address/:user_id',user_address);
// router.get('/test_controller',token_middleware.requireSignIn ,token_middleware.is_admin,test_controller);
// router.get('/user-auth' , token_middleware.requireSignIn,(req,res)=>{
//     //console.log(req);
//     res.status(200).send({ok:true});
// });
// router.post('/edit-user-account/:user_id' , token_middleware.requireSignIn ,edit_user_account );

// router.get('/admin-auth' , token_middleware.requireSignIn,token_middleware.is_admin,(req,res)=>{
//     console.log(req);
//     res.status(200).send({ok:true});
// });
// router.get('/all-users',all_user);
// router.post('/verify-email',verifyEmail);
// router.post('/reset-password-mail',mail_password_link);
// router.post('/save-user-address/:user_id',save_user_address);
// router.post('/set-password', async (req, res) => {
//     try {
//         // const schema = Joi.object({ password: Joi.string().required() });
//         // const { error } = schema.validate(req.body);
//         // if (error) return res.status(400).send(error.details[0].message);
//         console.log(req.body.params);
//         const userX = await user.findById(req.body.params.user_id.id);
//         if (!userX) return res.status(200).send("invalid link or expired user");

//         const find_token = await token.findOne({
//             userId: req.body.params.user_id.id,
//             token: req.body.params.token.token,
//         });
//         if (!find_token) return res.status(200).send("Invalid link or expired");

//         userX.password = req.body.params.password;
//         await userX.save();
//         await find_token.deleteOne();

//         return res.status(200).send(
//             {success:true,
//             message:"invalid link or expired user",
//             }
//             );
//     } catch (error) {
//         res.send("An error occured");
//         console.log(error);
//     }
// });
// router.get('/user-details/:user_id',token_middleware.requireSignIn,my_user);
// router.delete('/user-delete/',my_user_delete);
// module.exports = {router};
// const userController = require('../controllers/userController.js');
// const userRegisterController = (req, res) => userController.register(req, res);


class UserRoutes{
    constructor(){
        this.router = express.Router();
        this.userController = new UserController(); // ✅ Create an instance
        this.verifyUser = (req, res) => this.userController.verifyToken(req, res);
        this.userRegisterController = (req, res) => this.userController.userRegister(req, res);
        this.userLoginController = (req, res) => this.userController.userLogin(req, res);

        this.userAuthGoogleController = (req, res) => this.userController.userAuthGoogle(req, res);

        this.userByIdController = (req, res) => this.userController.getUserById(req, res);
        this.sendPasswordResetLink = (req,res) => this.userController.sendPasswordResetLink(req, res);
        this.resetPassByEmail = (req,res) => this.userController.resetPasswordByEmail(req, res);
        this.authsCheck = new authMiddleware();
        this.requireAuthCheck = (req,res,next) => this.authsCheck.requireSignIn(req, res , next);
        this.createRoutes();
    }
    createRoutes(){
        this.router.get('/verify-user', this.verifyUser);
        this.router.post('/register', this.userRegisterController);
        this.router.post('/login', this.userLoginController);
        this.router.post('/auth-google', this.userAuthGoogleController);
        this.router.get('/user-by-id/:ID', this.requireAuthCheck, this.userByIdController);
        this.router.post('/send-pasword-reset-link', this.sendPasswordResetLink);
        this.router.post('/reset-pass-by-link', this.resetPassByEmail);
    }
    getRoutes(){
        return this.router;
    }
}

const routes = new UserRoutes();
// console.log(routes);
// console.log(routes.getRoutes());
module.exports = routes.getRoutes(); // ✅ Clean export
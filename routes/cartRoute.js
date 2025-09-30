var express = require('express');
const router = express.Router();
const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const CartController = require('../controllers/cartController.js');
const multer = require('multer');
const authMiddleware = require ('../middlewares/authMiddleware.js');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/img/")
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname)
    },
  })
// const storage = multer.memoryStorage();
const uploadStorage = multer({ storage: storage });
class CartRoutes{
    constructor(){
        this.router = express.Router();
        this.CartController = new CartController(); // ✅ Create an instance
        this.addItemToCart = (req,res)=>this.CartController.addToCart(req,res);
        this.cartItems = (req,res)=>this.CartController.cartItems(req,res);
        this.cartData = (req,res)=>this.CartController.cartData(req,res);
        this.userCartData = (req,res)=>this.CartController.userCartData(req,res);
        this.addLocalItems = (req,res)=>this.CartController.addLocalItems(req,res);
        this.removeCartItem = (req,res)=>this.CartController.removeCartItem(req,res);
        this.updateCartItem = (req,res)=>this.CartController.updateCartItem(req,res);
        this.authsCheck = new authMiddleware();
        this.requireAuthCheck = (req,res,next) => this.authsCheck.requireSignIn(req, res , next);
        this.cartUser = (req,res,next) => this.authsCheck.cartUser(req, res , next);
        this.createRoutes();
    }
    createRoutes(){
      // this.router.get('/Products', this.allProducts);
      this.router.post('/add-to-cart',this.cartUser,this.addItemToCart);
      this.router.get('/get-cart-items',this.cartUser, this.cartItems);
      // this.router.post('/get-cart-data', this.cartData);
      // this.router.post('/get-user-cart-data',this.requireAuthCheck, this.userCartData);
      // this.router.post('/add-local-items-to-cart',this.requireAuthCheck, this.addLocalItems);
      this.router.delete('/remove-cart-item', this.cartUser , this.removeCartItem);
      this.router.patch('/update-item/',this.cartUser, this.updateCartItem);
      //   this.router.get('/filter-products', this.filterProducts);
      // this.router.get('/Product/:slug', this.getProduct);
      // this.router.put('/Product/edit/:id', this.editProduct);
      
    }
    getRoutes(){
        return this.router;
    }
}

const routes = new CartRoutes();
// console.log(routes);
// console.log(routes.getRoutes());
module.exports = routes.getRoutes(); // ✅ Clean export 
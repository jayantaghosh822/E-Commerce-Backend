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
        this.addLocalItems = (req,res)=>this.CartController.addLocalItems(req,res);
        this.removeCartItem = (req,res)=>this.CartController.removeCartItem(req,res);
        this.updateCartItem = (req,res)=>this.CartController.updateCartItem(req,res);
        this.authsCheck = new authMiddleware();
        this.requireAuthCheck = (req,res,next) => this.authsCheck.requireSignIn(req, res , next);
        this.createRoutes();
    }
    createRoutes(){
        // this.router.get('/Products', this.allProducts);
      this.router.post('/add-to-cart',this.requireAuthCheck, this.addItemToCart);
      this.router.get('/get-cart-items',this.requireAuthCheck, this.cartItems);
      this.router.post('/add-local-items-to-cart',this.requireAuthCheck, this.addLocalItems);
      this.router.delete('/remove-cart-item', this.requireAuthCheck , this.removeCartItem);
      this.router.patch('/update-item/:itemId',this.requireAuthCheck, this.updateCartItem);
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
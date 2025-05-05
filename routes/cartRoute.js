var express = require('express');
const router = express.Router();
const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const CartController = require('../controllers/cartController.js');
const multer = require('multer');

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
        // this.deleteProduct = (req,res)=>this.ProductController.deleteProduct(req,res);
        this.createRoutes();
    }
    createRoutes(){
        // this.router.get('/Products', this.allProducts);
      this.router.post('/add-to-cart', this.addItemToCart);
      this.router.get('/get-cart-items', this.cartItems);
      this.router.post('/add-local-items-to-cart', this.addLocalItems);
    //   this.router.get('/filter-products', this.filterProducts);
      // this.router.get('/Product/:slug', this.getProduct);
        // this.router.put('/Product/edit/:id', this.editProduct);
        // this.router.delete('/Product/delete/:id', this.deleteProduct);
    }
    getRoutes(){
        return this.router;
    }
}

const routes = new CartRoutes();
// console.log(routes);
// console.log(routes.getRoutes());
module.exports = routes.getRoutes(); // ✅ Clean export 
var express = require('express');
const router = express.Router();
const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const ProductController = require('../controllers/productController.js');
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
class ProductRoutes{
    constructor(){
        this.router = express.Router();
        this.ProductController = new ProductController(); // ✅ Create an instance
        // this.allProducts = (req,res)=>this.ProductController.allProducts(req,res);
        this.saveProduct = (req,res)=>this.ProductController.saveProduct(req,res);
        // this.getProduct = (req,res)=>this.ProductController.getProductById(req,res);
        // this.editProduct = (req,res)=>this.ProductController.editProduct(req,res);
        // this.deleteProduct = (req,res)=>this.ProductController.deleteProduct(req,res);
        this.createRoutes();
    }
    createRoutes(){
        // this.router.get('/Products', this.allProducts);
        this.router.post(
        '/save-product', 
        uploadStorage.fields([
          { name: "pimage", maxCount: 1 },
          { name: "pgalleryimage", maxCount: 4 }
        ]), 
        this.saveProduct
      );
        // this.router.get('/Product/:slug', this.getProduct);
        // this.router.put('/Product/edit/:id', this.editProduct);
        // this.router.delete('/Product/delete/:id', this.deleteProduct);
    }
    getRoutes(){
        return this.router;
    }
}

const routes = new ProductRoutes();
// console.log(routes);
// console.log(routes.getRoutes());
module.exports = routes.getRoutes(); // ✅ Clean export 
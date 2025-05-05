var express = require('express');
var app = express();
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
var slugify = require('slugify');
// var bodyParser = require('body-parser');
// const Grid = require('gridfs-stream');
const JWT = require('jsonwebtoken');
const productModel = require('../models/productModel.js');
// var formidable = require('formidable');
const categoryModel = require('../models/categoryModel.js');
const brandModel = require('../models/brandModel.js');
const colorModel = require('../models/colorModel.js');
const cartModel = require('../models/cartModel.js');
const ProductImagesModel = require ('../models/ProductImagesModel.js');
const { arrayBuffer } = require('stream/consumers');

const cloudinary = require('cloudinary');

cloudinary.v2.config({
  cloud_name: 'dychqyphl',
  api_key: '111533752771191',
  api_secret: 'JJXOWxHVf9DtuXUFzR3H0BYqJk0',
  secure: true,
});

class CartController {
    constructor() {
        // this.user = userModel.User; // Assigning the user model
        // this.register = this.register.bind(this);
        // this.token = tokenModel.Token;

        this.product = productModel.Product;

        this.category = categoryModel.Category;

        this.brand = brandModel.Brand;

        this.color = colorModel.Color;

        this.productImages = ProductImagesModel.ProductImages;

        this.cart = cartModel.Cart;

    }

    // User Registration Method
  async addToCart(req, res) {
    try{
      let userId = null;
      // console.log(req.cookies.token);
      const token = req.cookies.token;
      if(token){
        // console.log(token);
        const user =  JWT.verify(req.cookies.token,process.env.TOKEN_SECRET);
        if(user){
          console.log(user);
          userId = user._id;
        }
        // console.log(userId);
      }
      // console.log(userId);
     
      const {product , metaData ,quan } =  req.body.productData;
      // console.log(product);
      // console.log(name);
      // console.log(metaData);
      const item = new this.cart({
        product,
        userId, 
        metaData,
        quan
        // image, // Save image path in DB
      });
      const itemSaved = await item.save();
      // console.log(itemSaved);
      if(itemSaved){
        console.log(itemSaved);
        res.status(201).json({ message: "Item Added To Cart", itemSaved });
      }
    }catch(err){
      console.log(err);
    }
     
  }


  async addLocalItems(req, res) {
    try {
      const unSavedCartItems = req.body.unSavedCartItems;
      // const userId = req.body.userId; // Passed from frontend
      let userId = null;
      // console.log(req.cookies.token);
      const token = req.cookies.token;
      if(token){
        // console.log(token);
        const user =  JWT.verify(req.cookies.token,process.env.TOKEN_SECRET);
        if(user){
          console.log(user);
          userId = user._id;
        }
        // console.log(userId);
      }
      if (!unSavedCartItems || !userId) {
        return res.status(400).json({ message: "Missing cart items or userId" });
      }
  
      const cartItems = Object.values(unSavedCartItems);
  
      for (const item of cartItems) {
        const newItem = new this.cart({
          product: item.productId,
          userId,
          metaData: item.metaData,
          quan: item.metaData.quantity || 1, // default to 1 if not available
        });
  
        await newItem.save();
      }
  
      return res.status(201).json({ message: "Items added to cart successfully" });
    } catch (error) {
      console.error("Error adding items:", error);
      return res.status(500).json({ message: "Failed to add items", error });
    }
  }
  



  async cartItems(req, res) {
    try{
      const token = req.cookies.token;
      let userId = null;
      if(token){
        // console.log(token);
        const user =  JWT.verify(req.cookies.token,process.env.TOKEN_SECRET);
        if(user){
          // console.log(user);
          userId = user._id;
        }
        // console.log(userId);
        if(userId!=null){
          const cartItems = await this.cart.find({userId:userId});
          // console.log(cartItems);
          res.status(201).json({ message: "Item Fetched", cartItems });
        }
      }
    }catch(err){
      console.log(err);
    }
  }




}

module.exports =  CartController;

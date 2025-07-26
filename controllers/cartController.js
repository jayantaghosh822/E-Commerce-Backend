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
const mongoose = require('mongoose');
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
    // console.log(req);
    // console.log(req.userId);
    try{
      let userId = req.userId;
      // console.log(req.cookies.token);
      // const token = req.cookies.token;
      
      
     
      const item =  req.body.productData;
      if(item.product && item.metaData && item.price && item.metaData.sizeId && item.quan){
      // console.log('item',item);
      const savedCartItems = await this.cart.find({ userId });
      console.log(savedCartItems);

     
        // Look for a matching item (same product & sizeId)
        const match = savedCartItems.find(savedItem =>
          item.product === savedItem.product.toString() &&
          item.metaData.sizeId === savedItem.metaData.sizeId?.toString()
        );
      
      // console.log('match',match);
      if(match){
        const updateQuan = match.quan+item.quan;
        console.log(updateQuan);
        const itemUpdated = await this.cart.updateOne(
          { _id: match._id },
          { quan: updateQuan } 
        );
        if(itemUpdated){
          // console.log(itemSaved);
          res.status(201).json({ message: "Item Added To Cart", itemUpdated });
        }
      }else{
      item.userId = userId;
      const itemSaved =  await new this.cart(
        item
      ).save();
      // console.log('itemSaved',itemSaved);
      if(itemSaved){
        // console.log(itemSaved);
        res.status(201).json({ message: "Item Added To Cart", itemSaved });
      }
      }
      return;
      
    }else{
      res.status(401).json({success:false, message: "Item data missing" });
    }
    }catch(err){
      console.log(err);
      res.status(401).json({success:false, message: "Token Error" });
    }
     
  }
  

  async addLocalItems(req, res) {
      try {
        const unSavedCartItems = req.body.unSavedCartItems;
        let userId = req.userId;

        // const token = req.cookies.token;
        // if (token) {
        //   const user = JWT.verify(token, process.env.TOKEN_SECRET);
        //   if (user) {
        //     userId = user._id;
        //   }
        // }

        if (!Array.isArray(unSavedCartItems) || !userId) {
          return res.status(400).json({ message: "Missing or invalid cart items or user not authenticated" });
        }

        // Fetch user's existing cart items
        const savedCartItems = await this.cart.find({ userId });

        const updates = [];
        const inserts = [];

        for (const localItem of unSavedCartItems) {
          // Look for a matching item (same product & sizeId)
          const match = savedCartItems.find(savedItem =>
            localItem.product === savedItem.product.toString() &&
            localItem.sizeId === savedItem.sizeId?.toString()
          );

          if (match) {
            updates.push({
              _id: match._id,
              incrementBy: localItem.quan || 1
            });
          } else {
            inserts.push({
              product: new mongoose.Types.ObjectId(localItem.product),
              userId: new mongoose.Types.ObjectId(userId),
              quan: localItem.quan || 1,
              metaData: localItem.metaData || {},
              price: localItem.price || 0,
              image: localItem.image || ''
            });
          }
        }

        // Update matched items
        for (const item of updates) {
          await this.cart.updateOne(
            { _id: item._id },
            { $inc: { quan: item.incrementBy } }
          );
        }

        // Insert new items
        if (inserts.length > 0) {
          await this.cart.insertMany(inserts);
        }

        return res.status(201).json({ message: "Items added to cart successfully" });
      } catch (error) {
        console.error("Error adding local cart items:", error);
        return res.status(500).json({ message: "Failed to add items", error });
      }
  }





  async cartItems(req, res) {
    try{
      // const token = req.cookies.token;
      let userId = req.userId;
      
        // console.log(token);
        // const user =  JWT.verify(req.cookies.token,process.env.TOKEN_SECRET);
        // if(user){
        //   // console.log(user);
        //   userId = user._id;
        // }
        // console.log(userId);
        if(userId!=null){
          const cartItems = await this.cart.find({userId:userId});
          // console.log(cartItems);
          res.status(200).json({ message: "Item Fetched", cartItems });
        }
      
    }catch(err){
      console.log(err);
    }
  }




}

module.exports =  CartController;

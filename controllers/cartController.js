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

const productVariationModel = require('../models/productVariationModel.js');
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
        this.productVariation = productVariationModel.ProductVariation;

        this.category = categoryModel.Category;

        this.brand = brandModel.Brand;

        this.color = colorModel.Color;

        this.productImages = ProductImagesModel.ProductImages;

        this.cart = cartModel.Cart;

    }

    // User Registration Method
    async addToCart(req, res) {
      console.log(req.body.productData);
      try {
        const userId = req.userId;
        const item = req.body.productData;

        if (
          !item.productId ||
          !item.variationId ||
          !item.quan
        ) {
          return res.status(400).json({
            success: false,
            message: "Item data missing",
          });
        }

        // Find or create user's cart
        let cart = await this.cart.findOne({ userId });

        if (!cart) {
          cart = new this.cart({
            userId,
            items: [],
          });
        }

        // Look for a matching item (same product & variation)
        const match = cart.items.find(
          (savedItem) =>
            savedItem.productId.toString() === item.productId &&
            savedItem.variationId.toString() === item.variationId
        );

        if (match) {
          // If exists → increment quantity
          match.quan += item.quan;
        } else {
          // Otherwise push new item
          cart.items.push({
            productId: new mongoose.Types.ObjectId(item.productId),
            variationId: new mongoose.Types.ObjectId(item.variationId),
            quan: item.quan,
            price: item.price || 0,
            image: item.image || "",
            metaData: item.metaData || {},
          });
        }

        const itemSaved = await cart.save();

        return res.status(201).json({
          success: true,
          message: "Item added to cart",
          cart: itemSaved,
        });
      } catch (err) {
        console.error("Error in addToCart:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to add item to cart",
          error: err.message,
        });
      }
    }

  

  async addLocalItems(req, res) {
    try {
      const unSavedCartItems = req.body.unSavedCartItems;
      const userId = req.userId;

      if (!Array.isArray(unSavedCartItems) || !userId) {
        return res.status(400).json({
          message: "Missing or invalid cart items or user not authenticated",
        });
      }

      // Find or create the user's cart
      let cart = await this.cart.findOne({ userId });

      if (!cart) {
        cart = new this.cart({
          userId,
          items: [],
        });
      }

      // Merge local items into cart.items
      for (const localItem of unSavedCartItems) {
        const existingItem = cart.items.find(
          (item) =>
            item.productId.toString() === localItem.productId &&
            item.variationId.toString() === localItem.variationId
        );

        if (existingItem) {
          // If same product + variation exists → increment quantity
          existingItem.quan += localItem.quan || 1;
        } else {
          // Push new item into the array
          cart.items.push({
            productId: new mongoose.Types.ObjectId(localItem.productId),
            variationId: new mongoose.Types.ObjectId(localItem.variationId),
            quan: localItem.quan || 1,
            price: localItem.price || 0,
            image: localItem.image || "",
            metaData: localItem.metaData || {},
          });
        }
      }

      await cart.save();

      return res
        .status(201)
        .json({ message: "Items added to cart successfully", cart });
    } catch (error) {
      console.error("Error adding local cart items:", error);
      return res
        .status(500)
        .json({ message: "Failed to add items", error: error.message });
    }
  }



  async cartData(req, res) {
    const cartItems = (req.body.cart.items);
    try {
    const cartItems = req.body.cart.items; // [{ productId, variationId, quan }]

    const productIds = cartItems.map(i => i.productId);
    const variationIds = cartItems.map(i => i.variationId);

    // fetch all products & variations
    const products = await this.product.find({ _id: { $in: productIds } }).lean();
    const variations = await this.productVariation.find({ _id: { $in: variationIds } }).lean();

    // create maps for fast lookup
    const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));
    const variationMap = Object.fromEntries(variations.map(v => [v._id.toString(), v]));

    // merge cart items with product + variation data
    const structuredCart = cartItems.map(item => {
      const product = productMap[item.productId];
      const variation = variationMap[item.variationId];

      return {
        _id: item._id,
        quan: item.quan,
        product: product ? {
          id: product._id,
          name: product.name,
          slug: product.slug,
          image: product.image,
          brand: product.brand,
          category: product.category
        } : null,
        variation: variation ? {
          id: variation._id,
          attributes: variation.attributes,
          price: variation.price,
          stock: variation.stock,
          sku: variation.sku
        } : null
      };
    });

    return res.json(structuredCart);

    } catch (err) {
    console.error("Error fetching cart data:", err);
    return res.status(500).json({ error: "Something went wrong" });
    } 
  }

  async userCartData(req, res) {
    // const cartItems = (req.body.cart.items);
    try {
    let userId = req.userId;
    console.log(userId);
    const fetchUserCart = await this.cart.findOne({userId:userId});
    console.log(fetchUserCart);
    const cartItems = fetchUserCart.items;
    console.log(cartItems);
    // return;
    const productIds = cartItems.map(i => i.productId);
    const variationIds = cartItems.map(i => i.variationId);

    // fetch all products & variations
    const products = await this.product.find({ _id: { $in: productIds } }).lean();
    const variations = await this.productVariation.find({ _id: { $in: variationIds } }).lean();

    // create maps for fast lookup
    const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));
    const variationMap = Object.fromEntries(variations.map(v => [v._id.toString(), v]));

    // merge cart items with product + variation data
    const structuredCart = cartItems.map(item => {
      const product = productMap[item.productId];
      const variation = variationMap[item.variationId];

      return {
        _id: item._id,
        quan: item.quan,
        product: product ? {
          id: product._id,
          name: product.name,
          slug: product.slug,
          image: product.image,
          brand: product.brand,
          category: product.category
        } : null,
        variation: variation ? {
          id: variation._id,
          attributes: variation.attributes,
          price: variation.price,
          stock: variation.stock,
          sku: variation.sku
        } : null
      };
    });
    const cartData = {
      cartId : fetchUserCart._id,
      structuredCart
    }
    return res.json(cartData);

    } catch (err) {
    console.error("Error fetching cart data:", err);
    return res.status(500).json({ error: "Something went wrong" });
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
          const cartItems = await this.cart.findOne({userId:userId});
          // console.log(cartItems);
          res.status(200).json({ message: "Item Fetched", cartItems });
        }
      
    }catch(err){
      console.log(err);
    }
  }


  async removeCartItem(req,res){
    let userId = req.userId;
    try{
     
      let userId = req.userId;
      if(userId){
          const {itemId,cartId} = req.query;
          console.log(itemId);
          console.log(userId);
          if(itemId){

          const updatedCart = await this.cart.findByIdAndUpdate(
              cartId,
              {
                $pull: { items: { _id: itemId } } // remove item by its _id
              },
              { new: true } // return updated cart
          );
          console.log(updatedCart);
          res.status(200).send({
            success:true,
            message:'Item Deleted',
            updatedCart
          })
        }
      }
    }catch(err){
      console.log(err);
      res.status(500).send({
            success:false,
            message:'server Error'
      })
    }
    
  }

  async updateCartItem(req, res) {
    const { itemId } = req.params; // itemId inside cart.items
    const { action } = req.body; // "inc" or "dec"
    const userId = req.userId;
    
    try {
    const updateValue = action === "inc" ? 1 : -1;

    const cart = await this.cart.findOneAndUpdate(
      { userId: userId, "items._id": itemId },
      { $inc: { "items.$.quan": updateValue } },
      { new: true } // return updated cart
    );

    // Remove item if quantity falls below 1
    // if (cart) {
    //   const item = cart.items.id(itemId);
    //   if (item && item.quan < 1) {
    //     item.remove();
    //     await this.cart.save();
    //   }
    // }

    res.status(201).send({
      success:true,
      message:'Item Upadted',
      cart
    })
  } catch (err) {
    console.error("Error updating cart item:", err);
    throw err;
  }
  }


}

module.exports =  CartController;

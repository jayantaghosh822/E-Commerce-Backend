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
    // async addToCart(req, res) {
    //   //console.log(req.body.productData);
    //   try {
    //     const userId = req.userId;
    //     const item = req.body.productData;

    //     if (
    //       !item.productId ||
    //       !item.variationId ||
    //       !item.quan
    //     ) {
    //       return res.status(400).json({
    //         success: false,
    //         message: "Item data missing",
    //       });
    //     }

    //     // Find or create user's cart
    //     let cart = await this.cart.findOne({ userId });

    //     if (!cart) {
    //       cart = new this.cart({
    //         userId,
    //         items: [],
    //       });
    //     }

    //     // Look for a matching item (same product & variation)
    //     const match = cart.items.find(
    //       (savedItem) =>
    //         savedItem.productId.toString() === item.productId &&
    //         savedItem.variationId.toString() === item.variationId
    //     );

    //     if (match) {
    //       // If exists → increment quantity
    //       match.quan += item.quan;
    //     } else {
    //       // Otherwise push new item
    //       cart.items.push({
    //         productId: new mongoose.Types.ObjectId(item.productId),
    //         variationId: new mongoose.Types.ObjectId(item.variationId),
    //         quan: item.quan,
    //         price: item.price || 0,
    //         image: item.image || "",
    //         metaData: item.metaData || {},
    //       });
    //     }

    //     const itemSaved = await cart.save();

    //     return res.status(201).json({
    //       success: true,
    //       message: "Item added to cart",
    //       cart: itemSaved,
    //     });
    //   } catch (err) {
    //     console.error("Error in addToCart:", err);
    //     return res.status(500).json({
    //       success: false,
    //       message: "Failed to add item to cart",
    //       error: err.message,
    //     });
    //   }
    // }

  

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
    //console.log(userId);
    const fetchUserCart = await this.cart.findOne({userId:userId});
    //console.log(fetchUserCart);
    const cartItems = fetchUserCart.items;
    //console.log(cartItems);
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


 
  async removeCartItem(req, res) {
    try {
      const userId = req.userId;

      if (userId) {
        // ✅ Logged-in user → DB cart
        const { itemId } = req.query;

        if (!itemId) {
          return res.status(400).json({ success: false, message: "Missing itemId" });
        }

        const updatedCart = await this.cart.findOneAndUpdate(
          { userId: userId },                        // find cart by userId
          { $pull: { items: { _id: itemId } } },     // remove item by _id
          { new: true }
        );

        if (!updatedCart) {
          return res.status(404).json({ success: false, message: "Cart or item not found" });
        }

        return res.status(200).json({
          success: true,
          message: "Item deleted",
          cart: updatedCart
        });
      } else {
        // ✅ Guest user → session cart
        const { productId, variationId } = req.body; // frontend must send these

        if (!req.session.cart) req.session.cart = { items: [] };

        const beforeLength = req.session.cart.items.length;

        req.session.cart.items = req.session.cart.items.filter(
          i => !(i.product?.id === productId && i.variation?.id === variationId)
        );

        if (req.session.cart.items.length === beforeLength) {
          return res.status(404).json({ success: false, message: "Item not found in session cart" });
        }

        return res.status(200).json({
          success: true,
          message: "Item deleted",
          cart: req.session.cart.items
        });
      }
    } catch (err) {
      console.error("Error removing cart item:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }



  async updateCartItem(req, res) {
    try {
      const { itemId, action, productId, variationId } = req.body; 
      // itemId might be null for guest, so we use productId + variationId
      const userId = req.userId;

      const updateValue = action === "inc" ? 1 : -1;

      if (userId) {
        // ✅ Logged-in user → DB cart (unchanged)
        const cart = await this.cart.findOneAndUpdate(
          { userId: userId, "items._id": itemId },
          { $inc: { "items.$.quan": updateValue } },
          { new: true }
        );

        if (!cart) return res.status(404).json({ success: false, message: "Cart or item not found" });

        // Remove item if quantity < 1
        const item = cart.items.id(itemId);
        if (item && item.quan < 1) {
          item.remove();
          await cart.save();
        }

        return res.status(200).json({ success: true, message: "Item updated", cart });
      } else {
        console.log(req.session.cart);
        // ✅ Guest user → session cart
        if (!req.session.cart) req.session.cart = { items: [] };

        const itemIndex = req.session.cart.items.findIndex(
          i =>
            i.productId === productId &&
            i.variationId === variationId
        );

        
        if (itemIndex === -1) return res.status(404).json({ success: false, message: "Item not found" });

        req.session.cart.items[itemIndex].quan += updateValue;

        // Remove item if quantity < 1
        if (req.session.cart.items[itemIndex].quan < 1) {
          req.session.cart.items.splice(itemIndex, 1);
        }

        return res.status(200).json({
          success: true,
          message: "Item updated",
          cart: req.session.cart.items
        });
      }
    } catch (err) {
      console.error("Error updating cart item:", err);
      return res.status(500).json({ success: false, message: "Something went wrong" });
    }
  }



  async addToCart(req, res) {
  //console.log(req.body.productData);
  try {
    const userId = req.userId || null; // null if guest
    const item = req.body.productData;

    if (!item.productId || !item.variationId || !item.quan) {
      return res.status(400).json({
        success: false,
        message: "Item data missing",
      });
    }

    // If not logged in → use session only
    if (!userId) {
      if (!req.session.cart) {
        req.session.cart = { items: [] };
      }

      const match = req.session.cart.items.find(
        (savedItem) =>
          savedItem.productId === item.productId &&
          savedItem.variationId === item.variationId
      );

      if (match) {
        match.quan += item.quan;
      } else {
        req.session.cart.items.push({
          productId: item.productId,
          variationId: item.variationId,
          quan: item.quan
        });
      }
      // //console.log(req.session.cart);
      return res.status(201).json({
        success: true,
        message: "Item added to guest cart (session)",
        cart: req.session.cart,
      });
    }

    
    // If logged in → use DB cart
    let cart = await this.cart.findOne({ userId });
    if (!cart) {
      cart = new this.cart({ userId, items: [] });
    }

    const match = cart.items.find(
      (savedItem) =>
        savedItem.productId.toString() === item.productId &&
        savedItem.variationId.toString() === item.variationId
    );

    if (match) {
      match.quan += item.quan;
    } else {
      cart.items.push({
        productId: new mongoose.Types.ObjectId(item.productId),
        variationId: new mongoose.Types.ObjectId(item.variationId),
        quan: item.quan
      });
    }

    const itemSaved = await cart.save();

    // Sync session cart with DB cart too
    req.session.cart = {
      items: itemSaved.items.map((i) => ({
        productId: i.productId.toString(),
        variationId: i.variationId.toString(),
        quan: i.quan,
      })),
    };

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

  async cartItems(req, res) {
  try {
    let rawItems = [];

    if (req.userId) {
      // 🔹 Logged-in user
      let dbCart = await this.cart.findOne({ userId: req.userId });
       console.log(dbCart);
      // 🔹 Session items (guest cart)
      const sessionItems = req.session.cart?.items || [];

      if (sessionItems.length > 0) {
        if (!dbCart) {
          // No DB cart → create with session items
          dbCart = await this.cart.create({
            userId: req.userId,
            items: sessionItems
          });
        } else {
          // Merge session into DB cart
          sessionItems.forEach(sessionItem => {
            const existingIndex = dbCart.items.findIndex(
              i =>
                i.productId.toString() === sessionItem.productId &&
                i.variationId.toString() === sessionItem.variationId
            );

            if (existingIndex !== -1) {
              // Same item → sum quantities
              dbCart.items[existingIndex].quan += sessionItem.quan;
            } else {
              // New item → push
              dbCart.items.push(sessionItem);
            }
          });

          await dbCart.save();
        }

        // 🔹 Clear guest session after merge
        req.session.cart = { items: [] };
      }

      rawItems = dbCart?.items || [];
    } else {
      // 🔹 Guest user → session cart
      rawItems = req.session.cart?.items || [];
    }

    if (rawItems.length === 0) return res.json([]); // empty cart

    // 🔹 Fetch products & variations
    const productIds = rawItems.map(i => i.productId);
    const variationIds = rawItems.map(i => i.variationId);

    const products = await this.product.find({ _id: { $in: productIds } }).lean();
    const variations = await this.productVariation.find({ _id: { $in: variationIds } }).lean();

    // 🔹 Build lookup maps
    const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));
    const variationMap = Object.fromEntries(variations.map(v => [v._id.toString(), v]));

    // 🔹 Structured cart response
    const structuredCart = rawItems.map(item => {
      const product = productMap[item.productId.toString()];
      const variation = variationMap[item.variationId.toString()];

      return {
        _id: item._id || null,
        quan: item.quan,
        product: product
          ? {
              id: product._id,
              name: product.name,
              slug: product.slug,
              image: product.image,
              brand: product.brand,
              category: product.category
            }
          : null,
        variation: variation
          ? {
              id: variation._id,
              attributes: variation.attributes,
              price: variation.price,
              stock: variation.stock,
              sku: variation.sku
            }
          : null
      };
    });

    return res.json(structuredCart);
  } catch (err) {
    console.error("Error fetching cart data:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
  }



}

module.exports =  CartController;

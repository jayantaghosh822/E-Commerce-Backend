var express = require('express');
const router = express.Router();
const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const OrderController = require('../controllers/orderController.js');
const multer = require('multer');
const authMiddleware = require ('../middlewares/authMiddleware.js');


class OrderRoutes{
    constructor(){
        this.router = express.Router();
        this.OrderController = new OrderController(); // ✅ Create an instance
        this.placeOrder = (req,res)=>this.OrderController.placeOrder(req,res);
        this.findOrder = (req,res)=>this.OrderController.findOrder(req,res);
        this.stripePaymentStatus = (req,res)=>this.OrderController.stripePaymentStatus(req,res);
        this.stripePaymentWebHook = (req,res)=>this.OrderController.stripePaymentWebHook(req,res);
        this.authsCheck = new authMiddleware();
        this.requireAuthCheck = (req,res,next) => this.authsCheck.requireSignIn(req, res , next);
        this.createRoutes();
    }
    createRoutes(){
      
        this.router.post('/place-order',this.requireAuthCheck, this.placeOrder);
        this.router.get('/find-order/:orderId',this.requireAuthCheck, this.findOrder);
        this.router.get('/stripe-payment-status/:stripeSessionId',this.requireAuthCheck, this.stripePaymentStatus);
        this.router.post('/v1/auth/payment-status-webhook', this.stripePaymentWebHook);
    }
    getRoutes(){
        return this.router;
    }
}

const routes = new OrderRoutes();
// console.log(routes);
// console.log(routes.getRoutes());
module.exports = routes.getRoutes(); // ✅ Clean export 
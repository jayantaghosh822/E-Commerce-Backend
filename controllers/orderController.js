const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const userModel = require('../models/userModel.js');
const orderModel = require('../models/orderModel.js');
const cartModel = require('../models/cartModel.js');
const stripe = require("stripe")("sk_test_51LX0WLSBdfOGEPmAWrkusfIomBJ8uG9q02Lf3NJpPqPfO82lWHBicyPGvLpIIUQDCv4Nlb2vKeEKhPgylO7zsFV400shpQFWJ3");
dotenv.config();

class OrderController {
    constructor() {
        this.user = userModel.User; // Assigning the user model
        // this.register = this.register.bind(this);
        this.order = orderModel.Order;
        this.cart = cartModel.Cart; // Assigning the user model
    }

    async findOrder(req,res){
        try{
            const userId = req.userId;
            const orderId = req.params.orderId;
            ////console.log(orderId)
            if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
            }
            const order = await this.order.findById(orderId);
            return res.status(200).send({ order });
            ////console.log(order);

        }catch(err){
            ////console.log(err);
        }
    }
    // User Registration Method
    async placeOrder(req, res) {
        try {
            const userId = req.userId;

            if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
            }

            const cartItems = await this.cart.findOne({ userId:userId }).populate({
                path: "items.variationId",
                model: "ProductVariation",
                select: "price stock sku images attributes" // 👈 only fetch required fields
            })
            .populate({
                path: "items.productId",
                model: "Product",
                select: "name" // optional: basic product info
            });

            if (!cartItems) {
            return res.status(400).json({ message: 'Cart is empty' });
            }
            // ////console.log('cartItems');
            // // ////console.log(cartItems);
            // ////console.log(cartItems.items);
            // ////console.log('cartItems');
            // return;
            // const items = cartItems.map(item => ({
            // product: item.product,
            // price: item.price,
            // quan: item.quan,
            // image: item.image,
            // metaData: item.metaData,
            // }));

           
            // const totalAmount = items.reduce((sum, item) => sum + item.price * item.quan, 0);
            
            const { paymentMethod, userDetails } = req.body;

            

            if(!userDetails.phone || !userDetails.streetaddress || !userDetails.city || !userDetails.state || !userDetails.pin ||  !userDetails.country){
                return res.status(400).json({ message: 'Missing user info' });
            }
            const shippingAddress = {
            name: `${userDetails.firstname} ${userDetails.lastname}`,
            phone: userDetails.phone,
            addressLine1: userDetails.streetaddress,
            addressLine2: userDetails.appartment,
            city: userDetails.city,
            state: userDetails.state,
            postalCode: userDetails.pin,
            country: userDetails.country?userDetails.country:'India', // default, or pass from frontend if available
            };
            if (!paymentMethod) {
                return res.status(400).json({ message: 'Missing payment info' });
            }
             if(paymentMethod == 'stripe'){
                const striprPaymentCreation = await this.stripePayment(cartItems,userId,shippingAddress);
                // ////console.log(striprPaymentCreation,userId);
                if(striprPaymentCreation.stripeSessionStatus){
                    return res.status(201).json({ paymentUrl:striprPaymentCreation.paymentUrl,paymentMethod : paymentMethod });
                }
                
            }
            // ////console.log(userDetails);
            // if (!paymentMethod) {
            //     if(!userDetails.phone || !userDetails.streetaddress || !userDetails.city || !userDetails.state || !userDetails.pin ||  !userDetails.country){
            //         return res.status(400).json({ message: 'Missing user info' });
            //     }
            //     return res.status(400).json({ message: 'Missing payment info' });
            // }

            
            // Map frontend's userDetails to shippingAddress format
            

            // const order = await this.order.create({
            // userId,
            // items,
            // totalAmount,
            // shippingAddress,
            // paymentMethod,
            // });

            // Optionally clear cart
            // await this.cart.deleteMany({ userId });

            
            // res.status(201).json({
            // message: 'Order placed successfully',
            // orderId: order._id,
            // paymentMethod : paymentMethod
            // });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        }
    }



    async stripePayment(cartItems,userId,shippingAddress){
        // ////console.log(userId);
        const user = await this.user.findById(userId);
        ////console.log("user",user);
        // ////console.log(cartItems);
        ////console.log(cartItems);
        // return;
        //console.log(shippingAddress);
      
        const userEmail = user.email;
        try {
            // let order_details = req.body.cartItems;
            // let shippingCharge = req.body.shippingCharge;
           
            const lineitems = cartItems.items.map((item) => ({
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: item.productId.name,
                        metadata:{
                        productId: item.productId._id.toString(),
                        variationId:item.variationId._id.toString(),
                        },
                    },
                
                    unit_amount: item.variationId.price * 100,
                },
                quantity: item.quan
            }));
            const client = (req.headers.origin);
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: lineitems,
                metadata: {

                    user_id: userId,
                    
                    address: JSON.stringify(shippingAddress),

                    cartItemId:  JSON.stringify(cartItems._id)
                    
                },
                mode: "payment",
                success_url: `${client}/stripe-payment?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${client}/cart`,

                customer_email: userEmail, // dynamically use user's email

                shipping_address_collection: {
                    allowed_countries: ["IN"],
                },
                billing_address_collection: 'required',

                shipping_options: [
                    {
                    shipping_rate_data: {
                        display_name: 'Standard Shipping',
                        type: 'fixed_amount',
                        fixed_amount: {
                        amount: 12000,
                        currency: 'inr',
                        },
                        delivery_estimate: {
                        minimum: { unit: 'business_day', value: 3 },
                        maximum: { unit: 'business_day', value: 5 },
                        },
                    },
                    },
                ],
            });

            if (session) {
                // ////console.log(session);
                return {stripeSessionStatus:true,paymentUrl:session.url}
                // Assuming you have a function to delete cart items
            // await deleteCartItems(req.params.userId); // Call your delete cart items function here
                // return res.status(200).send({
                //     session
                // });
            }
        } catch (error) {
            console.error("Error processing payment:", error);
            return {stripeSessionStatus:false}
            // return res.status(500).send({ error: "Payment processing error" });
        }
    }

    async stripePaymentStatus(req,res){
        // const stripeSessionId = req.params.stripeSessionId;
        // console.log(stripeSessionId);
       

        try {
            const session_id  = req.params.stripeSessionId;
            if (!session_id) return res.status(400).json({ error: "Missing session_id" });

            // 1️⃣ Retrieve Stripe session
            const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ["line_items", "line_items.data.price.product"]
            });

            if (!session) return res.status(404).json({ error: "Session not found" });

            // 2️⃣ Find your order in DB using metadata.user_id or metadata.order_id
            const userOrder = await this.order.findOne({ stripeSessionId: session_id }).lean();
            if (!userOrder) return res.status(404).json({ error: "Order not found" });

            const paymentIntentId = session.payment_intent;
            const paymentIntent =  await stripe.paymentIntents.retrieve(paymentIntentId,{ 
                expand: ['latest_charge'] 
            })
            // 3️⃣ Build invoice structure
            const invoice = {
            orderId: userOrder._id,
            status: userOrder.paymentStatus,
            seller: {
                name: "Male Fashion",
                address: "3184 Spruce Drive Pittsburgh, PA 15201",
                email: "xyz@987.com",
                phone: "012-345-6789"
            },
            customer: {
                name: userOrder.shippingAddress.name,
                addressLine1: userOrder.shippingAddress.addressLine1,
                addressLine2: userOrder.shippingAddress.addressLine2,
                email: userOrder.customerEmail || session.customer_email,
                phone: userOrder.shippingAddress.phone
            },
            shippingAddress: userOrder.shippingAddress,
            invoiceDate: userOrder.placedAt.toISOString().split("T")[0],
            orderNo: userOrder._id,
            items: userOrder.items.data,
            subTotal: userOrder.total,
            discount: userOrder.discount || 0,
            shipping: userOrder.shippingCost || 0,
            tax: userOrder.tax || 0,
            total: userOrder.totalAmount,
            stripeReceiptUrl: paymentIntent.latest_charge.receipt_url
            };

            res.json(invoice);
        } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
        }
        

        
    }

    async stripePaymentWebHook(request,response){
        const sig = request.headers['stripe-signature'];
        const endpointSecret = "whsec_7e2d8f6798f66b5eb6e64f0d5167f003565e5364166e5e7542732271c2897c4f";
        // 1mwhsec_7e2d8f6798f66b5eb6e64f0d5167f003565e5364166e5e7542732271c2897c4f
        let event;
        
        try {
            event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
        } catch (err) {
            ////console.log("erroer" , err);
            response.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        //console.log(event);
        return;
        switch (event.type) {
            case 'checkout.session.completed':
            const paymentIntentSucceeded = event.data.object;
            // ////console.log('checkout.session.completed');
            ////console.log(event);
            // ////console.log('metadata',paymentIntentSucceeded);
            if(paymentIntentSucceeded.payment_status == 'paid'){
                const session_id = paymentIntentSucceeded.id; 
                const line_items = await stripe.checkout.sessions.listLineItems(session_id, {
                expand: ['data.price.product'],
                });
                ////console.log('line_items',line_items);
                const order_details=[];
                const cart_item_ids = [];
                line_items.data.forEach(item=>{
                let price = item.price;
                ////console.log(price);
                cart_item_ids.push(price.product.metadata.cart_item_id);
                order_details.push({product_metadata:price.product.metadata,name:item.description,total:item.amount_total,quan:item.quantity});
                
                });
                ////console.log('cart ids are', cart_item_ids);
                // ////console.log('order details', paymentIntentSucceeded.metadata);
                // const order_details =  JSON.parse(paymentIntentSucceeded.metadata.order);
                ////console.log('order details', order_details);
                const user_id = JSON.parse(paymentIntentSucceeded.metadata.user_id);
                ////console.log('userID', user_id);
                const order_item = new order({order_details,user_id});
                const order_save_status =  await order_item.save();
                if(order_save_status){
                ////console.log(order_save_status);
                await cart.deleteMany({ user_id: user_id });
                }
            }
            // Then define and call a function to handle the event payment_intent.succeeded
            break;
            // ... handle other event types
            default:
            ////console.log(`Unhandled event type ${event.type}`);
        }
    }


}

module.exports =  OrderController;

const express = require('express');
const path = require('path');
const dbConn = require('./config/db');
const authRoutes = require("./routes/userRoute");
const categoryRoutes = require("./routes/categoryRoute");
const productRoutes = require("./routes/productRoute");
const cartRoutes = require("./routes/cartRoute");
const orderModel = require('./models/orderModel.js');
const order = orderModel.Order;
const cartModel = require('./models/cartModel.js');
const cart = orderModel.Cart;
const variationModel = require('./models/productVariationModel.js');
const variations = variationModel.ProductVariation;
const cors = require("cors");
const cookieParser = require("cookie-parser");
const corsOptions = {
    origin: ["https://yourfrontend.com" , "http://localhost:3000"], // Allow only specific domains
    methods: "GET,POST,PUT,DELETE,PATCH",
    credentials: true, 
    allowedHeaders: "Content-Type,Authorization",
};
const stripe = require("stripe")("sk_test_51LX0WLSBdfOGEPmAWrkusfIomBJ8uG9q02Lf3NJpPqPfO82lWHBicyPGvLpIIUQDCv4Nlb2vKeEKhPgylO7zsFV400shpQFWJ3");
class Server {
    constructor() {
        this.app = express();
        this.app.use('/public', express.static('public'));
        // this.app.use('/img', express.static(path.join(__dirname, 'public/img')));
        

        this.app.post('/api/payment-status-webhook', express.raw({ type: 'application/json' }),async(request,res)=>{
            const sig = request.headers['stripe-signature'];
            const endpointSecret = "whsec_7e2d8f6798f66b5eb6e64f0d5167f003565e5364166e5e7542732271c2897c4f";
            // 1mwhsec_7e2d8f6798f66b5eb6e64f0d5167f003565e5364166e5e7542732271c2897c4f
            let event;
            
            try {
                event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
                switch (event.type) {
                    case 'checkout.session.completed':
                    const paymentIntentSucceeded = event.data.object;
                    // //console.log('checkout.session.completed');
                    //console.log(event);
                    // //console.log('metadata',paymentIntentSucceeded);
                    if(paymentIntentSucceeded.payment_status == 'paid'){
                        const session_id = paymentIntentSucceeded.id; 
                        const line_items = await stripe.checkout.sessions.listLineItems(session_id, {
                        expand: ['data.price.product'],
                        });
                        // const sessionWithDetails = await stripe.checkout.sessions.retrieve(session_id, {
                        //     expand: ['line_items', 'customer', 'shipping'],
                        // });
                        // console.log(sessionWithDetails.shipping);
                        
                        // console.log('line_items',line_items);

                        const orderItems = line_items.data.map((item) => {
                        const price = item.price;
                        const productMeta = price.product.metadata;
                        
                        return {
                            product: productMeta.productId,       // from Stripe metadata
                            price: price.unit_amount,             // Stripe unit price
                            quan: item.quantity,                  // Stripe quantity
                            image: price.product.images?.[0] || "", // first image if available
                            metaData: {
                            variationId: productMeta.variationId,
                            stripePriceId: price.id,
                            stripeProductId: price.product.id,
                            rawStripeObject: item               // keep full Stripe data
                            }
                        };
                        });
                        const shippingCost = paymentIntentSucceeded.total_details.amount_shipping;
                        
                        // console.log(orderItems);
                        // console.log(paymentIntentSucceeded.metadata); 
                        const shippingAddress = paymentIntentSucceeded.metadata.address
                        ? JSON.parse(paymentIntentSucceeded.metadata.address)
                        : {};
                        // return;
                        // Now create a full order
                        // console.log(orderItems);
                        // const totalAmount =  orderItems.reduce((acc, item) => acc + item.price * item.quan, 0); // total in paise
                        // console.log(totalAmount);
                        // return;
                        const total = orderItems.reduce((acc, item) => acc + item.price * item.quan);
                        const cartItemsId = paymentIntentSucceeded.metadata.cartItemId
                        ? JSON.parse(paymentIntentSucceeded.metadata.cartItemId)
                        : {};
                        const orderData = {
                            stripeSessionId:session_id,
                            userId: paymentIntentSucceeded.metadata.user_id, // comes from Stripe metadata
                            items: line_items,
                            total: paymentIntentSucceeded.amount_subtotal, // total in paise
                            shippingCost: paymentIntentSucceeded.total_details?.amount_shipping || 0,
                            totalAmount: paymentIntentSucceeded.amount_total,
                            paymentStatus: "paid", // set after webhook confirmation
                            paymentMethod: "stripe",
                            orderStatus: "processing",
                            shippingAddress: {
                                name: shippingAddress.name,
                                phone: shippingAddress.phone,
                                addressLine1: shippingAddress.addressLine1,
                                addressLine2: shippingAddress.addressLine2,
                                city: shippingAddress.city,
                                state: shippingAddress.state,
                                postalCode: shippingAddress.postalCode,
                                country: shippingAddress.country,
                            },
                        };

                        const newOrder = await order.create(orderData);
                        if(newOrder){
                            for (const orderItem of orderItems) {
                            const variationId = orderItem.metaData.variationId;

                            if (variationId) {
                                const updated = await variations.findOneAndUpdate(
                                { _id: variationId, stock: { $gte: orderItem.quan } }, // only update if enough stock
                                { $inc: { stock: -orderItem.quan } },
                                { new: true }
                                );

                                if (!updated) {
                                throw new Error(`Not enough stock for variation ${variationId}`);
                                }
                            }
                            }
                        }
                    }
                    // Then define and call a function to handle the event payment_intent.succeeded
                    break;
                    // ... handle other event types
                    default:
                    //console.log(`Unhandled event type ${event.type}`);
                }
            } catch (err) {
                console.log("erroer" , err);
                // res.status(400).send(`Webhook Error: ${err.message}`);
                return;
            }

            // console.log(event);
            return;
        });

        this.app.use(express.json());

        

        this.app.use(express.urlencoded({ extended: true }));
        this.port = 5000;
        this.databaseURI = process.env.MONGODB_URI;
        // this.app.use((req, res, next) => {
        //     if (!req.headers.origin) {
        //         return res.status(403).json({ message: "Forbidden: API access restricted." });
        //     }
        // });
        this.app.use(cors(corsOptions));
        this.app.use(cookieParser());
        this.connectDB();
        // this.middlewares();
        this.routes();
        this.startServer();
    }

    // Database Connection
    async connectDB() {
        try {
            const db = new dbConn(this.databaseURI);
            db.getConnection();
        } catch (error) {
            console.error("Database connection failed:", error);
        }
    }

    // Middlewares
    // middlewares() {
    //     this.app.use(express.json()); // Parse JSON requests
    // }

    // Routes
    routes() {
        const authRoutes = require("./routes/userRoute");
        // console.log(authRoutes);
        this.app.use('/api/user', authRoutes); // Use user routes
        const categoryRoutes = require("./routes/categoryRoute");
        this.app.use('/api/', categoryRoutes); // Use category routes 

        const colorRoutes = require("./routes/colorRoute");
        this.app.use('/api/', colorRoutes); // Use color routes 

        const brandRoutes = require("./routes/brandRoute");
        this.app.use('/api/', brandRoutes); // Use brand routes 

        const productRoutes = require("./routes/productRoute");
        this.app.use('/api/', productRoutes); // Use product routes 

        const cartRoutes = require("./routes/cartRoute");
        this.app.use('/api/', cartRoutes); // Use product routes 

        const orderRoutes = require("./routes/orderRoute");
        this.app.use('/api/', orderRoutes); // Use product routes
    }

    // Start Server
    startServer() {
        this.app.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        });
        this.app.get('/api/check',function(req,res){
            console.log(req.body);
           return res.status(200).json({
                success:true,
                message: "Api Works"});
              // res.send('All is good!');
            
        });
    }
}
// app.listen(5000);
// Initialize the server
// console.log('jhgj');
const serverStart = new Server();

const express = require('express');
const dbConn = require('./config/db');
const authRoutes = require("./routes/userRoute");
const categoryRoutes = require("./routes/categoryRoute");
const cors = require("cors");
const corsOptions = {
    origin: ["https://yourfrontend.com" , "http://localhost:3000"], // Allow only specific domains
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
};

class Server {
    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.port = 5000;
        this.databaseURI = process.env.MONGODB_URI;
        // this.app.use((req, res, next) => {
        //     if (!req.headers.origin) {
        //         return res.status(403).json({ message: "Forbidden: API access restricted." });
        //     }
        // });
        this.app.use(cors(corsOptions));
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
        this.app.use('/api/user', authRoutes); // Use user routes
        const categoryRoutes = require("./routes/categoryRoute");
        this.app.use('/api/', categoryRoutes); // Use category routes 
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

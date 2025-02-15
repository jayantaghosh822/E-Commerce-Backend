const express = require('express');
const mongoose = require('mongoose');
// const uri = "mongodb+srv://vercel-admin-user-65a42be41fcdc35ed0f17878:XTBsRgoMt5i27Zcn@cluster0.0o7bjqw.mongodb.net/ecommerce?retryWrites=true&w=majority";
class dbConn{
    constructor(uri){
        this.app = express();
        this.port = 5000;
        this.uri = uri;
    }
 async getConnection(){
    try{
        const connect = await mongoose.connect(this.uri,{
         useNewUrlParser: true,
         useUnifiedTopology: true,
        //  useFindAndModify: false,
        });
        console.log("Mongodb connection successfull!");
        //res.send('connected');
     }
     catch(error){
         console.log(error);
     } 
 }
}
module.exports = dbConn;
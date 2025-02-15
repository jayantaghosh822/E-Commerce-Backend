const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema(
    {
   firstname:{
    type:String,
    required:true,
    trim:true,
   },
   lastname:{
    type:String,
    required:true,
    trim:true,
   },
   displayname:{
    type:String,
    required:true,
    trim:true,
   },
   email:{
    type:String,
    required:true,
    unique:true,
   },
   password:{
    type:String,
    required:true,
   },
    phone:{
        type:String,
        required:true,
    },
    role:{
        type:Number,
        required: true,
    }
}

);
const User = mongoose.model('User',UserSchema);

module.exports = { User };
const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const categoryModel = require('../models/categoryModel.js');

const colorModel = require('../models/colorModel.js');

dotenv.config();

class ColorController {
    constructor() {
        this.color = colorModel.Color; // Assigning the user model
    }

    // User Registration Method
    async allColors(req, res) {
        try {
            // console.log(req.body);
            
            const categories = await this.category.find();
            // console.log(existing_user);
                return res.status(201).json({
                    success: true,
                    message: "Categories fetched successfully",
                    categories,
                });
            } 
        catch (error) {
            console.error("Categories fetch Error:", error);
            return res.status(500).json({
                success: false,
                message: "Server error",
            });
        }
    }
    async saveColor(req, res) {
        try {
            // console.log(req.body);
            const {name , hexCode } = req.body;
            const colorDoc = await this.color.findOneAndUpdate(
                { hexCode }, // Search condition
                { name, hexCode }, // Data to update or insert
                { new: true, upsert: true } // Return the updated/new document
            );
            if(colorDoc){
                return res.status(400).json({
                    success: true,
                    colorDoc,
                    // categories,
                });
            }
           
        } 
        catch (error) {
            console.error("Colors fetch Error:", error);
            return res.status(500).json({
                success: false,
                message: "Server error",
            });
        }
    }

}
module.exports =  ColorController;


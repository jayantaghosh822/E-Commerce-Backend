const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const brandModel = require('../models/brandModel.js');

dotenv.config();

class brandController {
    constructor() {
        this.brand = brandModel.Brand; // Assigning the user model
    }

    // User Registration Method
    async allBrands(req, res) {
        try {
            // console.log(req.body);
            
            const Brands = await this.brand.find();
            // console.log(existing_user);
                return res.status(201).json({
                    success: true,
                    message: "Brands fetched successfully",
                    Brands,
                });
            } 
        catch (error) {
            console.error("Brands fetch Error:", error);
            return res.status(500).json({
                success: false,
                message: "Server error",
            });
        }
    }
    async savebrand(req, res) {
        try {
            // console.log(req.body);
            const {name , slug , parent} = req.body;
            const findbrand = await this.brand.findOne({ slug });
            // console.log("here",name , slug , parent);
            if(!name || !slug){
                return res.status(400).json({
                    success: false,
                    message: "Either Slug or Name Missing",
                    // Brands,
                });
            }
            if(findbrand == null){
                console.log("not null");
                const brand = await new this.brand(
                    {name , slug , parent}
                ).save();
                // console.log(brand);
                if(brand){
                    return res.status(201).json({
                        success: true,
                        message: "Brands Saved successfully",
                        // Brands,
                    });
                }
                
            }else{
                return res.status(409).json({
                    success: false,
                    message: "brand Already Present",
                    // Brands,
                });
            }
               
            } 
        catch (error) {
            // console.error("Brands fetch Error:", error);
            return res.status(500).json({
                success: false,
                message: "Server error",
            });
        }
    }
    async getbrandById(req,res){
    const catSlug = req.params.slug;
    
    try{
        console.log(catSlug);
        if(catSlug){
            const brand = await this.brand.findOne({ slug:catSlug });
            if(brand){
                return res.status(201).json({
                    success: true,
                    message: "brand Fetched Successfully",
                    brand
                });
            }
        }
    }catch(err){
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
    
    }
    
    async editbrand(req,res){
        try{
            const catID = req.params.id;
            const brand = await this.brand.findById(catID);
            if(brand){
                const {name , slug , parent } = req.body;
                console.log(name , slug , parent );
                const updatebrand = await this.brand.findByIdAndUpdate(catID , {name , slug , parent});
                if(updatebrand){
                    res.status(200).json({
                        "success":true,
                        "message":"brand Updated Successfully!"
                    })
                }
                console.log("updated",updatebrand);
            }
        }catch(err){
            res.status(500).json({
                "success":false,
                "message":"Server Error!"
            })
        }
        
    }
    async deletebrand(req,res){
        try{
            const catID = req.params.id;
            if(catID){
                const updatebrand = await this.brand.findByIdAndDelete(catID);
                if(updatebrand){
                    res.status(200).json({
                        "success":true,
                        "message":"brand Deleted Successfully!"
                    })
                }
                // console.log("updated",updatebrand);
            }
        }catch(err){
            res.status(500).json({
                "success":false,
                "message":"Server Error!"
            })
        }
        
    }
}
module.exports =  brandController;


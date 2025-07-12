const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const categoryModel = require('../models/categoryModel.js');

dotenv.config();

class CategoryController {
    constructor() {
        this.category = categoryModel.Category; // Assigning the user model
    }

    // User Registration Method
    async allCategories(req, res) {
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
    async saveCategory(req, res) {
        try {
            // console.log(req.body);
            const {name , slug , parent} = req.body;
            const findCategory = await this.category.findOne({ slug });
            // console.log("here",name , slug , parent);
            if(!name || !slug){
                return res.status(400).json({
                    success: false,
                    message: "Either Slug or Name Missing",
                    // categories,
                });
            }
            if(findCategory == null){
                console.log("not null");
                const category = await new this.category(
                    {name , slug , parent}
                ).save();
                // console.log(category);
                if(category){
                    return res.status(201).json({
                        success: true,
                        message: "Categories Saved successfully",
                        // categories,
                    });
                }
                
            }else{
                return res.status(409).json({
                    success: false,
                    message: "Category Already Present",
                    // categories,
                });
            }
               
            } 
        catch (error) {
            // console.error("Categories fetch Error:", error);
            return res.status(500).json({
                success: false,
                message: "Server error",
            });
        }
    }
    async getCategoryById(req,res){
    const catSlug = req.params.slug;
    
    try{
        console.log(catSlug);
        if(catSlug){
            const category = await this.category.findOne({ slug:catSlug });
            if(category){
                return res.status(201).json({
                    success: true,
                    message: "Category Fetched Successfully",
                    category
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
    
    async editCategory(req,res){
        try{
            const catID = req.params.id;
            const category = await this.category.findById(catID);
            if(category){
                const {name , slug , parent } = req.body;
                console.log(name , slug , parent );
                const updateCategory = await this.category.findByIdAndUpdate(catID , {name , slug , parent});
                if(updateCategory){
                    res.status(200).json({
                        "success":true,
                        "message":"Category Updated Successfully!"
                    })
                }
                console.log("updated",updateCategory);
            }
        }catch(err){
            res.status(500).json({
                "success":false,
                "message":"Server Error!"
            })
        }
        
    }
    async deleteCategory(req,res){
        try{
            const catID = req.params.id;
            if(catID){
                const updateCategory = await this.category.findByIdAndDelete(catID);
                if(updateCategory){
                    res.status(200).json({
                        "success":true,
                        "message":"Category Deleted Successfully!"
                    })
                }
                // console.log("updated",updateCategory);
            }
        }catch(err){
            res.status(500).json({
                "success":false,
                "message":"Server Error!"
            })
        }
        
    }

    async getCategoryPath(categoryId){
        console.log('abcd');
        console.log(categoryId);
          console.log('abcd');
        const path = [];

        let current = await this.category.findById(categoryId).lean();

        while (current) {
        path.unshift({ name: current.name, slug: current.slug }); // insert at beginning
        if (!current.parent) break;
        current = await this.category.findById(current.parent).lean();
        }

        return path;
    }
}
module.exports =  CategoryController;


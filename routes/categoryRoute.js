var express = require('express');
const router = express.Router();
const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const CategoryController = require('../controllers/categoryController.js');
class CategoryRoutes{
    constructor(){
        this.router = express.Router();
        this.categoryController = new CategoryController(); // ✅ Create an instance
        this.allCategories = (req,res)=>this.categoryController.allCategories(req,res);
        this.saveCategory = (req,res)=>this.categoryController.saveCategory(req,res);
        this.getCategory = (req,res)=>this.categoryController.getCategoryById(req,res);
        this.editCategory = (req,res)=>this.categoryController.editCategory(req,res);
        this.deleteCategory = (req,res)=>this.categoryController.deleteCategory(req,res);
        this.createRoutes();
    }
    createRoutes(){
        this.router.get('/categories', this.allCategories);
        this.router.post('/save-category', this.saveCategory);
        this.router.get('/category/:slug', this.getCategory);
        this.router.put('/category/edit/:id', this.editCategory);
        this.router.delete('/category/delete/:id', this.deleteCategory);
    }
    getRoutes(){
        return this.router;
    }
}

const routes = new CategoryRoutes();
// console.log(routes);
// console.log(routes.getRoutes());
module.exports = routes.getRoutes(); // ✅ Clean export 
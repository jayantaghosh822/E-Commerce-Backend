var express = require('express');
const router = express.Router();
const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const brandController = require('../controllers/brandController.js');
class brandRoutes{
    constructor(){
        this.router = express.Router();
        this.brandController = new brandController(); // ✅ Create an instance
        this.allBrands = (req,res)=>this.brandController.allBrands(req,res);
        this.savebrand = (req,res)=>this.brandController.saveBrand(req,res);
        this.getbrand = (req,res)=>this.brandController.getBrandById(req,res);
        this.editbrand = (req,res)=>this.brandController.editBrand(req,res);
        this.deletebrand = (req,res)=>this.brandController.deleteBrand(req,res);
        this.createRoutes();
    }
    createRoutes(){
        this.router.get('/brands', this.allBrands);
        this.router.post('/save-brand', this.savebrand);
        this.router.get('/brand/:slug', this.getbrand);
        this.router.put('/brand/edit/:id', this.editbrand);
        this.router.delete('/brand/delete/:id', this.deletebrand);
    }
    getRoutes(){
        return this.router;
    }
}

const routes = new brandRoutes();
// console.log(routes);
// console.log(routes.getRoutes());
module.exports = routes.getRoutes(); // ✅ Clean export 
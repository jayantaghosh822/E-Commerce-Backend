var express = require('express');
const router = express.Router();
const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
const ColorController = require('../controllers/colorController.js');
class ColorRoutes{
    constructor(){
        this.router = express.Router();
        this.ColorController = new ColorController(); // ✅ Create an instance
        this.allColors = (req,res)=>this.ColorController.allColors(req,res);
        this.saveColor = (req,res)=>this.ColorController.saveColor(req,res);
        this.createRoutes();
    }
    createRoutes(){
        this.router.get('/colors', this.allColors);
        this.router.post('/save-color', this.saveColor);
        // this.router.get('/color/:slug', this.getColor);
        // this.router.put('/color/edit/:id', this.editColor);
        // this.router.delete('/color/delete/:id', this.deleteColor);
    }
    getRoutes(){
        return this.router;
    }
}

const routes = new ColorRoutes();
// console.log(routes);
// console.log(routes.getRoutes());
module.exports = routes.getRoutes(); // ✅ Clean export 
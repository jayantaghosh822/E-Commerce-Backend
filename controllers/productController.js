var express = require('express');
var app = express();
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
var slugify = require('slugify');
// var bodyParser = require('body-parser');
// const Grid = require('gridfs-stream');

const productModel = require('../models/productModel.js');
// var formidable = require('formidable');
const categoryModel = require('../models/categoryModel.js');
const brandModel = require('../models/brandModel.js');
const colorModel = require('../models/colorModel.js');
const ProductImagesModel = require ('../models/ProductImagesModel.js');
const { arrayBuffer } = require('stream/consumers');

const cloudinary = require('cloudinary');

cloudinary.v2.config({
  cloud_name: 'dychqyphl',
  api_key: '111533752771191',
  api_secret: 'JJXOWxHVf9DtuXUFzR3H0BYqJk0',
  secure: true,
});

class ProductController {
    constructor() {
        // this.user = userModel.User; // Assigning the user model
        // this.register = this.register.bind(this);
        // this.token = tokenModel.Token;

        this.product = productModel.Product;

        this.category = categoryModel.Category;

        this.brand = brandModel.Brand;

        this.color = colorModel.Color;

        this.productImages = ProductImagesModel.ProductImages;

    }

    // User Registration Method
    async saveProduct(req, res) {
        // try{
        //     console.log(req.files.pimage[0].path);
        //     const imageUploadResult = await cloudinary.uploader.upload(
        //         req.files.pimage[0].path,
        //         {
        //             public_id: `product_image_${Date.now()}`,
        //             resource_type: 'image' // Ensure it's treated as an image
        //         }
        //     );
        //     console.log(imageUploadResult);
           
        // }catch(err){
        //     console.log(err);
        // }
        // return;
        const productImage = req.files.pimage ? req.files.pimage : null;
        const productGalleryImage = req.files.pimage ? req.files.pgalleryimage : null;
        let productImagePath;
        let productGalleryImagePath;
        const hostUrl = `${req.protocol}://${req.get('host')}`;
        if(productImage){
            productImagePath = productImage.map((ele)=>{
                return ele.path;
            });
            
        
        // console.log("uploadResult",uploadResult);
        }
        if(productGalleryImage){
            productGalleryImagePath = productGalleryImage.map((ele)=>{
                return ele.path;
            });
        }
       
        try {
            // console.log("Received Data:", req.body);
            
    
            const { pname, pslug, pdescription, pcategoryid, psize , pcolorid , pbrandid } = req.body;
             
            // Ensure an image is uploaded
           
            console.log(productImagePath);
            if(productImagePath){
                productImagePath = productImagePath[0];
            }
            
            console.log(productImagePath);
            let name;
            let slug;
            let description;
            let category;
            let color;
            let brand;
            let size;
            let image;

            if(!pname || !pslug || !pdescription || !pcategoryid || !pcolorid || !pbrandid || !productImagePath){
                // console.error("Error saving product:", error);
                if (productImagePath) {
                    // Delete uploaded file if validation fails
                    const fs = require("fs");
                    fs.unlinkSync(productImagePath);
                }

                if(productGalleryImagePath){
                    productGalleryImagePath.forEach(element => {
                        const fs = require("fs");
                        fs.unlinkSync(element);
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: "Please Fill The Required Fields",
                    // categories,
                });

            }
            name = pname;
            slug = pslug;
            description = pdescription;
            category = pcategoryid;
            size = psize;
            color = pcolorid;
            brand = pbrandid;
            image = productImagePath;
            // Save product data
            const product = new this.product({
                name,
                slug, 
                description, 
                category, 
                size,
                brand,
                color,
                // image, // Save image path in DB
            });
            
            
            // return;
            let productSaved = await product.save();
            if(productSaved){
                if(productImagePath || productGalleryImagePath){
                    try {
                        const imageUploadResult = await cloudinary.uploader.upload(
                            productImagePath,
                            {
                                public_id: 'product_image',
                                resource_type: 'image' // Ensure it's treated as an image
                            }
                        );
                        let singleProductImage = '';
                        let galleryProductImage = [];
                        if(imageUploadResult){
                            singleProductImage = imageUploadResult.url;
                        }
                        
                        const galleryUploadPromises = productGalleryImagePath.map(async (element, index) => {
                            const galleryImageResult = await cloudinary.uploader.upload(
                                element,
                                {
                                    public_id: `product_gallery_${index}_${Date.now()}`, // Unique public_id for each image
                                    resource_type: 'image'
                                }
                            );
                            return galleryImageResult.url;
                        });
                    
                        // Wait for all uploads to complete
                        const galleryImageUrls = await Promise.all(galleryUploadPromises);
                        galleryProductImage.push(...galleryImageUrls);

                        // console.log("After all images:", galleryImage);
                        const productImage = new this.productImages({
                            product: productSaved._id,
                            mainImage:singleProductImage,
                            galleryImages:galleryProductImage
                            // image, // Save image path in DB
                        });
                
                        await productImage.save();
                        // console.log("Upload Result:", uploadResult);
                    } catch (error) {
                        console.error("Upload Error:", error);
                    }
                    

                
            }
            }
            
            res.status(201).json({ message: "Product saved successfully", product });
        } catch (error) {
            if (productImagePath) {
                // Delete uploaded file if validation fails
                const fs = require("fs");
                fs.unlinkSync(productImagePath);
            }
            if(productGalleryImagePath){
                productGalleryImagePath.forEach(element => {
                    const fs = require("fs");
                    fs.unlinkSync(element);
                });
            }
            console.error("Error saving product:", error);
            res.status(500).json({ message: "Internal Server Error", error });
        }
    }
    

    async allProducts(req,res){
        const all_products = await product.find();
        //console.log(all_products);
        return res.status(200).send({
         success:true,
         result:all_products
        })
    }

    async delProduct(req,res){
        // console.log(req.headers.product_id);
    
        const del_product = await product.deleteOne({_id:req.headers.product_id});
        // console.log(del_product);
        if(del_product){
            return res.status(200).send({
                success:true,
                message:"Product Deleted Successfully"
            })
        }
       
    }

    async getProductByID(req,res){
        //console.log(req.headers);
        const pro_id = req.headers.pro_id;
        const get_products = await product.findOne({_id:pro_id});
        // console.log(get_products);
        if(get_products){
            return res.status(200).send({
                success:true,
                result:get_products
            })
        }
       
    }

    async getProductBySlug (req, res){
        console.log('slug', req.params.slug);
        let pro_slug = req.params.slug;
        let pro_id = '';
        const imageDataArray = [];
        let size_pro_find = {};
        try {
            const pro = await product.findOne({ slug: pro_slug });
            
            if (!pro) {
                return res.status(404).send('Product not found');
            }
            
            pro_id = pro._id;
            // console.log(pro_id);
            
            if (pro_id !== "") {
                const productvarImages = await productImages.find({ product: { $in: pro_id } }).select("photo");
                
                console.log('productimages', productvarImages);
                
                // Iterate over the products and extract photo data
                productvarImages.forEach(product => {
                    
                    imageDataArray.push(product);
                });
                 size_pro_find = await product_size_variants.find({ product: pro_id }).select('size')
                 .populate({
                     path: 'size', // field to populate
                     select: 'name', // only select the _id field of the Size document
                 });
                if(size_pro_find){
                    console.log(size_pro_find);
                }
            }
            const responseData = {
                product: pro,
                images: imageDataArray,
                sizes: size_pro_find
            };
            return res.status(200).send(responseData);
        } catch (err) {
            console.log(err);
            return res.status(500).send('Internal Server Error');
        }
    }
    

    async updateProduct(req,res){
        let existing_product=null;
        // const form = JSON.parse(req.body.formData);
    //  console.log(req.body);
    //  console.log(req.body.image);
     myJSON = JSON.parse(req.body.formData);
    // //console.log(myJSON);
     req.body.formData = myJSON;
    //  console.log("pro_slug",req.body.formData.slug);
    //  console.log("pro_name",req.body.formData.name);
    let slug="";
    if(req.body.formData.slug==null){
        slug = slugify( req.body.formData.name, '_');
        req.body.formData.slug = slug;
        // console.log("2pro_slug",slug);
        // console.log("3pro_slug",req.body.formData.slug);
    }
    if(req.body.formData.slug==""){
        slug = slugify( req.body.formData.name, '_');
        req.body.formData.slug = slug;
        // console.log("2pro_slug",slug);
        // console.log("3pro_slug",req.body.formData.slug);
    }
    if( (req.body.formData.slug!="") && (req.body.formData.name!="") ){
    // let slug = req.body.formData.slug;
    let name = req.body.formData.name;
    
    // console.log("line 45",slug);
    if(slug==null){
       return res.status(200).send({
            success:false,
            messgae:"Product Must Have A slug",
        })
    }
    if((name==null)||(name=="")){
       return res.status(200).send({
            success:false,
            message:"Product Must Have A name"
        })
    }
    }
    // console.log("if existing",existing_product);
    if(existing_product==null && req.body.formData.name!=null ){
        // console.log("here");
    
       
        if( req.body.formData.shipping == 1){
            req.body.formData.shipping=true;
        }
        else{
            req.body.formData.shipping=false;
        }
        // const {_id,name,description,slug,price,quan,shipping,category} = req.body.formData;
        
        let prod_id = req.body.formData._id;
        let updateData="";
        try{
    
            
               updateData = {
                name:req.body.formData.name,
                slug:req.body.formData.slug,
                price:req.body.formData.price,
                quan:req.body.formData.quan,
                shipping:req.body.formData.shipping,
                category:req.body.formData.category,
                brand:req.body.formData.brand,
            };
            // console.log(updateData);
            if(req.body.image==undefined){
            if(req.file!=null){
             
               let buffer_data = fs.readFileSync(req.file.path);
                let content_type = req.file.mimetype;
                // console.log(buffer_data);
                // console.log(content_type);
                  updateData = {
                name:req.body.formData.name,
                description:req.body.formData.name,
                slug:req.body.formData.slug,
                price:req.body.formData.price,
                quan:req.body.formData.quan,
                shipping:req.body.formData.shipping,
                category:req.body.formData.category,
                brand:req.body.formData.brand,
                'photo.data':buffer_data,
                'photo.contentType' :content_type,
            };
            }
            }
             // await new_product.save();
            //console.log(new_product);
        }
       catch(error){
        console.log(error);
       }
       product.findByIdAndUpdate(prod_id, updateData, { new: true })
        .then(updatedProduct => {
            if (!updatedProduct) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.status(200).json({ success:true , message: 'Product updated successfully', data: updatedProduct });
        })
        .catch(error => {
            res.status(500).json({ error: 'Internal server error', details: error.message });
        });
    
        if (!(Object.keys(req.body.formData.colors).length === 0)) {
    //         const colorVariants = require('../model/colorVariants.js');
    // const colors = colorVariants.Color;
            let pro_colors = req.body.formData.colors;
            // console.log(pro_colors);
    
            if(Object.keys(pro_colors).length!=0){
                const pro_find = await colors.findOne({ product:prod_id })
                .then(result=>{
                    //console.log("colored" , result);
                    if(result!=null){
                        console.log("not null");
                 colors.updateOne({ product:prod_id }, { color: pro_colors })
                 .then(result => {
                  
                   //console.log(result);
                 })
                 .catch(error => {
                //    console.error(error);
                 });
                 }
                 else{
                    //  console.log("reached else part");
                     const newColor = new colors({
                         product: prod_id,
                         color: pro_colors
                       });
                       newColor.save()
                       .then(savedColor =>{
                        //  console.log('Color inserted:', savedColor);
                       })
                 }
                });
                //console.log("proImage" , pro_find);
               
               
            }
          
        }
        if (!(Object.keys(req.body.formData.sizes) === 0)) {
            let pro_sizes = req.body.formData.sizes;
            // console.log(pro_sizes);
            
            const size_pro_find = await product_size_variants.findOne({product:prod_id});
            
            if(size_pro_find!=null){
                // console.log("products found");
                const sizeVariantsDataupdate = Object.entries(pro_sizes).map(([size, quan]) => ({
                    size,
                    quan: quan ? parseInt(quan) : 0, // Convert quantity to number, handle empty string case
                    sizeproduct : prod_id
                  }));
                  Promise.all(sizeVariantsDataupdate.map(({ size, quan }) => {
                    // Find a size variant with the current size and specific product ID
                    return product_size_variants.findOne({ size, product: prod_id })
                      .then(foundSizeVariant => {
                        if (foundSizeVariant) {
                          // If the size variant exists, update its quantity
                          return product_size_variants.updateOne({ size, product: prod_id }, { $set: { quan } });
                        } else {
                          // If the size variant doesn't exist, insert a new document
                          return product_size_variants.create({ size, quan, product: prod_id });
                        }
                      });
                  }))
                  .then(results => {
                    // console.log('Size variants updated/inserted:', results);
                  })
                  .catch(error => {
                    // console.error('Error updating/inserting size variants:', error);
                  });
                  
            }
            else{
                console.log("products not found");
                const sizeVariantsData = Object.entries(pro_sizes).map(([size, quan]) => ({
                    size,
                    quan: quan ? parseInt(quan) : 0 ,// Convert quantity to number, handle empty string case,
                    product : prod_id
                  }));
                  product_size_variants.insertMany(sizeVariantsData)
                    .then(savedSizeVariants => {
                        // console.log('Size variants inserted:', savedSizeVariants);
                    })
                    .catch(error => {
                        // console.error('Error inserting size variants:', error);
                    });
            }
        }
    
    }
    }

    async productByCatSlug(req,res){
        const catSlug = req.query.category;
        const page = parseInt(req.headers.page_no) || 1;
        // console.log('my-slug');
        // console.log(catSlug);
        try{
          const getCategory = await this.category.findOne({slug:catSlug});
        //   console.log(getCategory);
          if(getCategory){
            // console.log('here');
              let catId = getCategory._id;
              const getProducts = await this.product
              .find({ category: catId })
              .populate('images')
              .populate('color')
              .populate('brand'); // <-- virtual populate
            //   console.log(getProducts);
              const itemsLength = getProducts.length;
            //   console.log(itemsLength);
              if(getProducts){
                  //console.log(get_products);
                  // const page = parseInt(req.query.page) || 1;
                const limit = 5; // Number of products per page
                const startIndex = (page - 1) * limit;
                const endIndex = page * limit;
        
                const paginatedProducts  = getProducts.slice(startIndex, endIndex);
                const sizes = paginatedProducts.map((pro)=>{
                    return pro.size;
                });
                const flattenedSizes = sizes.flat();
                // console.log("sizes");
                // console.log(flattenedSizes);
                // console.log("sizes");
                const colors = paginatedProducts.map((pro)=>{
                    return pro.color;
                });
               

                // console.log("uniquecolors");
                // console.log(colors);
                const uniqueColors = [];

                const colorsSeen = new Set();

                colors.forEach(color => {
                const idStr = color._id.toString();
                if (!colorsSeen.has(idStr)) {
                    colorsSeen.add(idStr);
                    uniqueColors.push(color);
                }
                });
                // console.log(uniqueColors);
                // console.log("uniquecolors");


                // console.log("uniqueBrands");
                const brands = paginatedProducts.map((pro)=>{
                    return pro.brand;
                });
                const uniqueBrands = [];

                const brandsSeen = new Set();

                brands.forEach(brand => {
                const idStr = brand._id.toString();
                if (!brandsSeen.has(idStr)) {
                    brandsSeen.add(idStr);
                    uniqueBrands.push(brand);
                }
                });

                // console.log(uniqueBrands);
                // console.log("uniqueBrands");
                res.status(200).json({ message: 'Product Found successfully', products: paginatedProducts ,currentPage: page, total_products:itemsLength,
                colors:uniqueColors,
                brands:uniqueBrands,
                totalPages: Math.ceil(itemsLength / limit) });
              }
          }
        }
        catch(error){
          console.log(error);
        }
     
    }
  
    async filterProducts(req,res){
        console.log(req.query);
        const prices = req.query.prices || [];
        console.log(prices);
        let pricesToFilter = prices.map((ele)=>{
            return ele.split('-');
        });
        console.log(pricesToFilter);
        pricesToFilter = pricesToFilter.flat();
        console.log(pricesToFilter);
        return;
        const brands = req.query.brands || [];
        // console.log(brands);
        const colors = req.query.colors || [];
        // console.log(colors);
        const sizes = req.query.sizes || [];


        const filter = {};

        if (brands && brands.length > 0) {
        filter.brand = { $in: brands };
        }

        if (colors && colors.length > 0) {
        filter.color = { $in: colors };
        }

        if (sizes && sizes.length > 0) {
            filter['size.size'] = { $in: sizes };
        }

        console.log(filter);
        
        // "grades.grade" :"A",
        // return;
        // let filter = {};
        // if(brands){
        //     filter.brands = brands;
        // }

        // if(colors){
        //     filter.colors = colors;
        // }
       
        let queryByBrands = await this.product.find(
           {
            $and:[
                filter
            ]
           },
           {"name" : 1 , "size": 1}
        );
        console.log(queryByBrands);
        const availableSizes = queryByBrands.map((ele)=>{
           return ele.size;
        });
        console.log(availableSizes.flat()); 
        return;
        const product_category = req.query.category;
        // const brands = req.query.brands;
        const product_colors = req.query.colors;
        let pro_cat_id = "";
        // console.log((req.query));
        const query = req.query;
        //console.log(brands);
        //console.log(colors);
        const page = parseInt(req.query.page_no) || 1;
        const cat_id = await category.findOne({slug:product_category});
        if(cat_id){
          //console.log(cat_id);
          pro_cat_id = cat_id._id;
        }
        const parsed_query = {
            category:pro_cat_id,
            brands: JSON.parse(query.brands),
            sizes: JSON.parse(query.sizes),
            colors: JSON.parse(query.colors),
          };
          console.log('parsed_query',parsed_query);
        
       
    try {
        let query = {};
        let productIds="";
        function isObjEmpty (obj) {
            return Object.keys(obj).length === 0;
        }
        let initial_products = "";
        if (!(isObjEmpty(parsed_query.brands))) {
            const brandIds = Object.keys(parsed_query.brands);
            initial_products = await product.find({ brand: { $in: brandIds },category:parsed_query.category }).select('_id');
            // console.log('initial products1',initial_products);
            productIds = initial_products.map(product => product._id);
            query.product = { $in: productIds };
        }else{
            initial_products = await product.find({category:parsed_query.category }).select('_id');
            // console.log('initial products2',initial_products);
            productIds = initial_products.map(product => product._id);
            query.product = { $in: productIds };
        }
    
        // Check if colors is present in parsed_query
        if (!(isObjEmpty(parsed_query.colors))) {
            const var_colors = Object.keys(parsed_query.colors);
            query.color = { $in: var_colors };
            // console.log('color_query',query);
        // Query ColorVariants collection using the constructed query
        const my_colorVariants = await colors.distinct('product',query);
        // console.log('color_query_result',my_colorVariants);
        productIds = my_colorVariants;
        // console.log('color_query',my_colorVariants);
        query.product = { $in: productIds };
        // console.log('final_query',productIds);
        }
        if (!(isObjEmpty(parsed_query.sizes))) {
            const var_sizes = (parsed_query.sizes);
            console.log('var_sizes',var_sizes);
            var fetch_size_ids =  await sizes.find({slug:var_sizes}).select('_id');
            console.log('size_ids' , fetch_size_ids);
            fetch_size_ids = fetch_size_ids.map(obj => obj._id);
            query.color = null;
            query.size = { $in: fetch_size_ids };
            console.log('size_query',query);
        // Query ColorVariants collection using the constructed query
        // const fetch_size_ids = 
       const my_sizeVariants = await product_size_variants.distinct('product',query);
        // // const my_sizeVariants = await product_size_variants.find(query)
        // .populate('size') // Populate the 'size' field with data from the Size collection
        // .exec();
        // console.log('size_query_result',my_sizeVariants);
        productIds = my_sizeVariants;
        // console.log('my_filtered_products',productIds);
        // console.log('filtered_duplicate_arrs',productIds);
        // console.log('my_filtered_products',uniqueProductIdsArray);
        // console.log('typeof ',typeof(uniqueProductIdsArray));
        // console.log('final_query',productIds);
        }
    
    
        const items_length = productIds.length;
        console.log(items_length);
        const limit = 2; // Number of products per page
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
    
        const filteredProductIds = productIds.slice(startIndex, endIndex);
    
        const filtered_products = await product.find({ _id: { $in: filteredProductIds } });
    //  const filtered_products = await product.find({_id:{$in:productIds}});
    //  console.log('my_filtered_products',filtered_products);
     res.status(200).json({ message: 'Product Found successfully', data: filtered_products ,currentPage: page,total_products:items_length,
     totalPages: Math.ceil(productIds.length / limit) });
    } catch (error) {
        console.error('Error filtering color variants:', error);
        throw error;
    }
    
    }

    async removeDuplicates(arr){
        return arr.filter((item, index) => arr.indexOf(item) === index);
    };

    async productSizes(req,res){
        const pro_id = (req.query.pro_id);
        const size_pro_find = await product_size_variants.find({product:pro_id});
        if(size_pro_find){
            // console.log(size_pro_find);
            res.status(200).json(size_pro_find);
        }
    }

    async productImages(req,res){
        //    console.log(req.file);
           if(req.file!=null){
                 
            let buffer_data = fs.readFileSync(req.file.path);
             let content_type = req.file.mimetype;
            //  console.log(buffer_data);
            //  console.log(content_type);
               updateData = {
              product: req.body.pro_id,
             'photo.data':buffer_data,
             'photo.contentType' :content_type,
         };
          try{
            await new productImages(updateData).save();
            res.status(200).json({ message: 'Variant Images Saved successfully' });
        }
        catch(error){
            //console.error('Error filtering color variants:', error);
            throw error;
        }
         }
    }

    async delProImages(req,res){
        //  console.log(req.body);
         var pro_id = req.body.pro_id;
         var image_ids = req.body.image_ids;
        //  console.log(pro_id);
        //  console.log(image_ids);
         try{
         var deleted_images = await productImages.deleteMany({ _id:image_ids});
        //  console.log(deleted_images);
         }
         catch(error){
            throw error;
         }
    }
    
    async getProductTitle(req,res){
        // console.log(req.params.p_id);
        const get_products = await product.findOne({_id:req.params.p_id});
        // console.log(get_products);
        if(get_products){
            return res.status(200).send({
                success:true,
                result:get_products
            })
        }

    }



}

module.exports =  ProductController;





















       
// module.exports = {create_product,all_products,del_product,get_product,get_product_by_slug,update_product,product_by_cat_slug,filter_products,product_sizes,product_images,del_pro_images,get_product_title};

    // console.log(cat_slug);
    //   const get_categories = await category.findOne({slug:cat_slug});
    //   if(get_categories){
    //   // let cat_id = get_categories._id;
    //   console.log(get_categories);
    //   }
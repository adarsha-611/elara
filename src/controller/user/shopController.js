import { getAllProducts, getProductById, getRelatedProducts } from "../../services/user/shopProductService.js";

import Category from "../../model/categorySchema.js";

const getShopPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1;
    const limit =9;
    const skip = (page-1)*limit;

    const filters = {
      search: req.query.search || "",
      category: req.query.category || "",
      sort: req.query.sort || "",
      price: req.query.price || ""
    };

    const products = await getAllProducts(filters);
    const categories = await Category.find({ isActive: true });

    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts/limit);
    const paginatedProducts = products.slice(skip,skip+limit);

    return res.render("user/shop", {
      products:paginatedProducts,
      filters,
      categories,
      currentPage:page,
      totalPages
    });

  } catch (error) {
    console.log("Shop Page Error:", error);
    return res.status(500).send("Server Error");
  }
};

const getProductDetailPage = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await getProductById(id);

    if (!product) {
      return res.redirect("/shop");
    }
  

    const relatedProducts = await getRelatedProducts(
      product.category,
      product._id
    );

    return res.render("user/productDetail", {
      product,
      relatedProducts
    });

  } catch (error) {
    console.log("Product Detail Error:", error);
    return res.status(500).send("Server Error");
  }
};

const checkProductStatus = async(req,res)=>{
  try {
     const product = await getProductById(req.params.id);

     if(!product||!product.isActive){
      return res.json({available:false})
     }
     return res.json({available:true});
  } catch (error) {
    console.log(error);
    return res.json({available:false});
  }
}

export default {
  getShopPage,
  getProductDetailPage,
  checkProductStatus
};

import { getAllProducts,getProductById,getRelatedProducts,getBestOfferForProduct } from "../../services/user/shopProductService.js";
import Review from "../../model/reviewSchema.js"
import Category from "../../model/categorySchema.js";
import Wishlist from "../../model/wishlistSchema.js"

const getShopPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    let wishlistProductIds = [];
    if(userId){
      const wishlist = await Wishlist.findOne({userId});

      if(wishlist && wishlist.products){
        wishlistProductIds = wishlist.products.map(
          item=> item.productId.toString()
        );
      }
    }
  
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
      totalPages,
      wishlistProductIds
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
    const reviews = await Review.find({productId:id})
        .populate("userId","name")
        .sort({createdAt:-1});

    const userId = req.session.userId;
        let isWishlisted = false;

        if(userId){
          const wishlist = await Wishlist.findOne({userId});

          if (wishlist && Array.isArray(wishlist.products)) {
        isWishlisted = wishlist.products.some(item =>
          item.productId.toString() === id.toString()
       );
      }
        }
    const offerData = await getBestOfferForProduct(product)

    return res.render("user/productDetail", {
      product,
      reviews,
      relatedProducts,
      offerData,
      isWishlisted
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

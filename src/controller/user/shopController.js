import { getAllProducts,getProductById,getRelatedProducts,getBestOfferForProduct } from "../../services/user/shopProductService.js";
import Review from "../../model/reviewSchema.js"
import Category from "../../model/categorySchema.js";
import Wishlist from "../../model/wishlistSchema.js";
import Cart from "../../model/cartSchema.js"

const getShopPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    let wishlistProductIds = [];

    if (userId) {
      const wishlist = await Wishlist.findOne({ userId });

      if (wishlist && wishlist.products) {
        wishlistProductIds = wishlist.products.map(
          item => item.productId.toString()
        );
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const filters = {
      search: req.query.search || "",
      category: req.query.category || "",
      sort: req.query.sort || "",
      price: req.query.price || ""
    };

    const products = await getAllProducts(filters);

    const productsWithOffers = await Promise.all(
      products.map(async (product) => {
        const offerData = await getBestOfferForProduct(product);

        return {
          ...product.toObject(),
          offerData
        };
      })
    );

    const categories = await Category.find({ isActive: true });

    const totalProducts = productsWithOffers.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const paginatedProducts = productsWithOffers.slice(skip, skip + limit);

    return res.render("user/shop", {
      products: paginatedProducts,
      filters,
      categories,
      currentPage: page,
      totalPages,
      wishlistProductIds,
      flashError: req.flash("error")[0] || null,   
      flashSuccess: req.flash("success")[0] || null 
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

    if (product.categoryUnlisted) {
      req.flash("error", "This product's category is currently unavailable.");
      return res.redirect("/shop");
    }

    const relatedProducts = await getRelatedProducts(product.category, product._id);
    const reviews = await Review.find({ productId: id })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    const userId = req.session.userId;
    let isWishlisted = false;
    
    if (userId) {
      const wishlist = await Wishlist.findOne({ userId });
      if (wishlist && Array.isArray(wishlist.products)) {
        isWishlisted = wishlist.products.some(
          item => item.productId.toString() === id.toString()
        );
      }
    }

    const offerData = await getBestOfferForProduct(product, product.variants[0].price);

    const cart = await Cart.findOne({ userId: req.session.userId });
    const cartVariantIds = cart 
  ? cart.items.map(i => i.variantId.toString()) 
  : [];
    return res.render("user/productDetail", {
      product,
      reviews,
      relatedProducts,
      offerData,
      isWishlisted,
      cartVariantIds
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

const getVariantOffer = async (req, res) => {
  try {
    
    const { productId, variantId } = req.params;
    
    const product = await getProductById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    
    const variant = product.variants.id(variantId);
    
    if (!variant) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }
    
    const offerData = await getBestOfferForProduct(product, variant.price);
    
    
    const response = {
      success: true,
      offerData,
      variantPrice: variant.price,
      variantStock: variant.stock,
      variantImages: variant.images
    };
    
  
    
    return res.json(response);
    
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
export default {
  getShopPage,
  getProductDetailPage,
  checkProductStatus,
  getVariantOffer
};
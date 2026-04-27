import { getAllProducts,getProductById,getRelatedProducts,getBestOfferForProduct } from "../../services/user/shopProductService.js";
import Review from "../../model/reviewSchema.js"
import Category from "../../model/categorySchema.js";
import Wishlist from "../../model/wishlistSchema.js"

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
    
    // Pass the first variant price to get initial offer
    const offerData = await getBestOfferForProduct(product, product.variants[0].price);

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

// NEW API endpoint to get offer for specific variant
const getVariantOffer = async (req, res) => {
  try {
    console.log("\n=== GET VARIANT OFFER CALLED ===");
    console.log("Request params:", req.params);
    
    const { productId, variantId } = req.params;
    console.log("Product ID:", productId);
    console.log("Variant ID:", variantId);
    
    const product = await getProductById(productId);
    
    if (!product) {
      console.log("❌ Product not found!");
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    console.log("✅ Product found:", product.name);
    console.log("Product category:", product.category);
    console.log("Total variants:", product.variants.length);
    
    const variant = product.variants.id(variantId);
    
    if (!variant) {
      console.log("❌ Variant not found!");
      console.log("Available variant IDs:", product.variants.map(v => v._id.toString()));
      return res.status(404).json({ success: false, message: "Variant not found" });
    }
    
    console.log("✅ Variant found:", variant.color);
    console.log("Variant price:", variant.price);
    
    console.log("\n--- Fetching offers from database ---");
    const offerData = await getBestOfferForProduct(product, variant.price);
    
    console.log("\n--- Offer result ---");
    console.log("Offer data:", JSON.stringify(offerData, null, 2));
    
    const response = {
      success: true,
      offerData,
      variantPrice: variant.price,
      variantStock: variant.stock,
      variantImages: variant.images
    };
    
    console.log("\n--- Sending response ---");
    console.log("Response:", JSON.stringify(response, null, 2));
    
    return res.json(response);
    
  } catch (error) {
    console.log("❌ Get Variant Offer Error:", error);
    console.log("Error stack:", error.stack);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
export default {
  getShopPage,
  getProductDetailPage,
  checkProductStatus,
  getVariantOffer
};
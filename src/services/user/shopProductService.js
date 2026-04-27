import mongoose from "mongoose";
import Product from "../../model/productSchema.js";
import Category from "../../model/categorySchema.js";
import Offer from "../../model/offerSchema.js";

export const getAllProducts = async (filters = {}) => {
  const activeCategoryIds = await Category.distinct("_id", {
    isActive: true
  });

  let query = {
    isActive: true,
    isDeleted: false,
    category: { $in: activeCategoryIds }
  };

  if (filters.search && filters.search.trim()) {
    query.name = { $regex: filters.search.trim(), $options: "i" };
  }

  if (filters.category && filters.category.trim()) {
    const categoryIds = filters.category.split(",");
    query.category = { $in: categoryIds };
  }

  let sortOption = {};
  if (filters.sort === "low") sortOption["variants.price"] = 1;
  if (filters.sort === "high") sortOption["variants.price"] = -1;
  if (filters.sort === "az") sortOption.name = 1;
  if (filters.sort === "new") sortOption.createdAt = -1;

  let products = await Product.find(query).sort(sortOption);

  if (filters.price && filters.price.trim()) {
    const priceRanges = filters.price.split(",");
    products = products.filter(product => {
      if (!product.variants || product.variants.length === 0) return false;
      
      const price = product.variants[0]?.price || 0;
      
      return priceRanges.some(range => {
        const [min, max] = range.split("-").map(Number);
        if (max === 10000) {
          return price >= min;
        }
        return price >= min && price <= max;
      });
    });
  }

  return products;
};

export const getProductById = async (productId) => {
  const id = new mongoose.Types.ObjectId(productId);
  const product = await Product.findOne({
    _id: id,
    isActive: true,
    isDeleted: false
  });
  return product;
};

export const getRelatedProducts = async (category, currentProductId) => {
  const related = await Product.find({
    category: category,
    _id: { $ne: currentProductId },
    isActive: true,
    isDeleted: false
  }).limit(4);
  return related;
};
export const getBestOfferForProduct = async (product, variantPrice = null) => {
  const now = new Date();
  
  console.log("\n=== getBestOfferForProduct START ===");
  console.log("Product ID:", product._id);
  console.log("Product category:", product.category);
  console.log("Variant price:", variantPrice);
  console.log("Current date:", now);
  
  // Find offers
  const query = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { offerType: "product", productId: product._id },
      { offerType: "category", categoryId: product.category }
    ]
  };
  
  console.log("Query:", JSON.stringify(query, null, 2));
  
  const offers = await Offer.find(query);
  
  console.log(`Found ${offers.length} offers:`);
  offers.forEach((offer, index) => {
    console.log(`Offer ${index + 1}:`, {
      name: offer.name,
      type: offer.offerType,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      productId: offer.productId,
      categoryId: offer.categoryId,
      startDate: offer.startDate,
      endDate: offer.endDate,
      isActive: offer.isActive
    });
  });

  if (!offers.length) {
    console.log("No offers found, returning null");
    return null;
  }
  
  let bestOffer = null;
  let maxDiscount = 0;
  let finalPrice = 0;

  // Use provided variant price or fallback to first variant
  const basePrice = variantPrice !== null ? variantPrice : (product.variants[0]?.price || 0);
  
  console.log(`Base price for calculation: ${basePrice}`);

  for (let offer of offers) {
    let discount = 0;

    if (offer.discountType === "percentage") {
      discount = (basePrice * offer.discountValue) / 100;
      console.log(`Offer ${offer.name}: ${offer.discountValue}% discount = ₹${discount}`);
    } else {
      discount = offer.discountValue;
      console.log(`Offer ${offer.name}: Fixed ₹${offer.discountValue} discount`);
    }

    let currentFinalPrice = basePrice - discount;
    console.log(`  Final price would be: ₹${currentFinalPrice}`);

    if (currentFinalPrice <= 0) {
      console.log(`  Skipping - final price would be zero or negative`);
      continue;
    }

    if (discount > maxDiscount) {
      console.log(`  This is the best offer so far! (Discount: ₹${discount})`);
      maxDiscount = discount;
      bestOffer = offer;
      finalPrice = currentFinalPrice;
    }
  }

  if (!bestOffer) {
    console.log("No valid offers found after filtering");
    return null;
  }

  console.log(`\n✅ Best offer selected: ${bestOffer.name}`);
  console.log(`   Discount: ₹${maxDiscount}`);
  console.log(`   Final price: ₹${finalPrice}`);
  console.log("=== getBestOfferForProduct END ===\n");

  return {
    offer: bestOffer,
    discount: maxDiscount,
    finalPrice
  };
};
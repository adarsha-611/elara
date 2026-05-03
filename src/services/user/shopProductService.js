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
    if (max === 10000) return price >= min;
    return price >= min && price <= max;
  });
});


}

return products;
};

export const getProductById = async (productId) => {
  try {
    const id = new mongoose.Types.ObjectId(productId);

    const product = await Product.findOne({
      _id: id,
      isActive: true,
      isDeleted: false
    }).populate('category');

    if (!product || !product.category || !product.category.isActive) {
      return null;
    }

    return product;

  } catch (error) {
    console.log("Product detail error:", error);
    return null;
  }
};

export const getRelatedProducts = async (category, currentProductId) => {
return await Product.find({
category,
_id: { $ne: currentProductId },
isActive: true,
isDeleted: false
}).limit(4);
};

export const getBestOfferForProduct = async (product, variantPrice = null) => {
const now = new Date();

const offers = await Offer.find({
isActive: true,
startDate: { $lte: now },
endDate: { $gte: now },
$or: [
{ offerType: "product", productId: product._id },
{ offerType: "category", categoryId: product.category }
]
});

if (!offers.length) return null;

let bestOffer = null;
let maxDiscount = 0;
let finalPrice = 0;

const basePrice =
variantPrice !== null
? variantPrice
: (product.variants?.[0]?.price || 0);

for (let offer of offers) {
let discount = 0;


if (offer.discountType === "percentage") {
  discount = (basePrice * offer.discountValue) / 100;
} else {
  discount = offer.discountValue;
}

const currentFinalPrice = basePrice - discount;

if (currentFinalPrice <= 0) continue;

if (discount > maxDiscount) {
  maxDiscount = discount;
  bestOffer = offer;
  finalPrice = currentFinalPrice;
}


}

if (!bestOffer) return null;

return {
offer: bestOffer,
discount: maxDiscount,
finalPrice
};
};

import mongoose, { Query } from "mongoose";
import Product from "../../model/productSchema.js";

export async function getAllProducts(filters = {}) {
  try {

   
    let query = {
      isActive: true,
      isDeleted: false
    };

  
    if (filters.search) {
      query.name = { $regex: filters.search, $options: "i" };
    }

   
    if (filters.category) {
      query.category = { $in: filters.category.split(",") };
    }

 
    let sortOption = {};

    if (filters.sort === "low") sortOption["variants.price"] = 1;
    if (filters.sort === "high") sortOption["variants.price"] = -1;
    if (filters.sort === "az") sortOption.name = 1;
    if (filters.sort === "new") sortOption.createdAt = -1;

 
    let products = await Product.find(query).sort(sortOption);

    if (filters.price) {
      const ranges = filters.price.split(",");
      products = products.filter(p => {
        const price = p.variants[0]?.price || 0;
        return ranges.some(r => {
          const [min, max] = r.split("-").map(Number);
          return price >= min && price <= max;
        });
      });
    }

    return products;

  } catch (error) {
    console.log("Product error", error);
    throw error;
  }
}

 
export async function getProductById(productId){
    try {
        const id = new mongoose.Types.ObjectId(productId);

        const product = await Product.findOne({
            _id:id,
            isActive:true,
            isDeleted:false
        })

        return product
    } catch (error) {
        console.log("product detail error",error)
    }
}

export async function getRelatedProducts(category, currentProductId) {
    try {
        const related = await Product.find({
            category: category,
            _id: { $ne: currentProductId }, 
            isActive: true,
            isDeleted: false
        })
        .limit(4); 

        return related;
    } catch (error) {
        console.log("Related product error", error);
        throw error;
    }
}

import Product from "../../model/productSchema.js";

export const productsPage = async (page = 1, limit = 5) => {
  try {
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments({ isDeleted: false });

    const products = await Product.find({ isDeleted: false })
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalProducts / limit);

    return {
      products,
      totalPages,
      currentPage: page
    };
  } catch (error) {
    console.log("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
};


export const createProduct = async (data, files) => {
  try {
     
    const rawVariants = data.variants || {};
    const variantKeys = Object.keys(rawVariants);

   
    const variants = variantKeys.map((key) => {
      const variant = rawVariants[key];
      const images = files
        .filter(file => file.fieldname.includes(`variants[${key}][images]`))
        .map(file => "/uploads/products/" + file.filename);

      return {
        color: variant.color,
        price: Number(variant.price),
        stock: Number(variant.stock),
        images
      };
    });

   
   const product = new Product({
  name: data.name,
  description: data.description,
  category: data.category,
  variants,
  isActive: true,
  isDeleted: false
});

 
    return await product.save();

  } catch (error) {
    console.log("Error creating product:", error);
    throw new Error("Failed to create product");
  }
};


export const getProductById = async (id) => {
  try {
    const product = await Product.findById(id);
    if (!product) throw new Error("Product not found");
    return product;
  } catch (error) {
    console.log("Error fetching product:", error);
    throw new Error("Failed to fetch product");
  }
};


export const updateProduct = async (id, data, files) => {
  try {
    const product = await Product.findById(id);
    if (!product) throw new Error("Product not found");
  
  const existingImages = product.variants.flatMap(v => v.images);

    product.name = data.name;
    product.description = data.description;
    product.category = data.category;

    const rawVariants = data.variants || {};
    const updatedVariants = Object.values(rawVariants).map((variant, index) => {
      
      const newImages = files
        .filter(file => file.fieldname.startsWith(`variants[${index}][images]`))
        .map(file => "/uploads/products/" + file.filename);

      return {
        color: variant.color,
        price: Number(variant.price),
        stock: Number(variant.stock),
        images: newImages.length ? newImages : product.variants[index]?.images || []
      };
    });

    product.variants = updatedVariants;

    return await product.save();

  } catch (error) {
    console.log("Error updating product:", error);
    throw new Error("Failed to update product");
  }
};

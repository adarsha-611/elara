import { productsPage,createProduct,getProductById,updateProduct} from "../../services/admin/productService.js";
import { validateProduct } from "../../utils/validators/joi_product.js";
import Product from "../../model/productSchema.js";
 
export const getProductPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const { products, totalPages, currentPage } =
      await productsPage(page, 5);

   return res.render("admin/product", {
      products,
      totalPages,
      currentPage,
      sidebarPage: "product"
  });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};


  const getAddProductPage = async(req,res)=>{
    try {
  return res.render("admin/addProduct", {
    sidebarPage: "product"
});    } catch (error) {
        console.log("Add product page error",error);
        return res.status(500).send("Server Error")
    }
}

const postAddProduct = async (req, res) => {
  try {
    const { error } = validateProduct(req.body, req.files, []); 

    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    await createProduct(req.body, req.files);
    return res.status(201).json({ success: true, message: "Product added successfully" });
  } catch (err) {
    console.log("Add product Error", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};


const getEditProductPage = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    return res.render("admin/editProduct", { product });
  } catch (error) {
    console.log("Edit product page error", error);
    return res.status(500).send("Server Error");
  }
};



const postEditProduct = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

   
   if (!req.body.variants || req.body.variants === "") {
  req.body.variants = [];
}

    const existingImages = product.variants.flatMap(v => v.images || []);

    const { error } = validateProduct(
      req.body,
      req.files || [],
      existingImages
    );
    console.log("FILES RECEIVED:", req.files);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    await updateProduct(req.params.id, req.body, req.files || []);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully"
    });

  } catch (err) {
    console.error("Update product error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update product"
    });
  }
};


const productStatus = async(req,res)=>{
  try {
    const {id} = req.params;
    const{isActive} = req.body;

    await Product.findByIdAndUpdate(id,{
      isActive:isActive
    })
    return res.json({success:true});
  } catch (error) {
    console.log("Status error",error);
    return res.status(500).json({success:false});
  }
}





export default {
    getProductPage,
    getAddProductPage,
    postAddProduct,
    getEditProductPage,
    postEditProduct,
    productStatus
}
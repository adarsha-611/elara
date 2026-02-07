import { getAllProducts, getProductById, getRelatedProducts } from "../../services/user/shopProductService.js";

const getShopPage = async (req, res) => {
  try {

    
    const filters = {
      search: req.query.search || "",
      category: req.query.category || "",
      sort: req.query.sort || "",
      price: req.query.price || ""
    };

 
    const products = await getAllProducts(filters);

    return res.render("user/shop", {
      products,
      filters
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


export default {
  getShopPage,
  getProductDetailPage
};

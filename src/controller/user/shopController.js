import { getAllProducts, getProductById, getRelatedProducts } from "../../services/user/shopProductService.js";

const getShopPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1;
    const limit =3;
    const skip = (page-1)*limit;
    
    const filters = {
      search: req.query.search || "",
      category: req.query.category || "",
      sort: req.query.sort || "",
      price: req.query.price || ""
    };
    
 
    const products = await getAllProducts(filters);

    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts/limit);

    const paginatedProducts = products.slice(skip,skip+limit);

    return res.render("user/shop", {
      products:paginatedProducts,
      filters,
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


export default {
  getShopPage,
  getProductDetailPage
};

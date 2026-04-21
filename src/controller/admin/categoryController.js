import { createCategory, updateCategory,categoryStatus } from "../../services/admin/categoryServices.js";
import Category from "../../model/categorySchema.js";


const getCategoryPage = async (req, res) => {
  try {
    const { search, page } = req.query;

    const limit = 6;
    const paginationPage = parseInt(page) || 1;
    const skip = (paginationPage - 1) * limit;

    let query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const totalCategories = await Category.countDocuments(query);

    const categories = await Category.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalCategories / limit);

    res.render("admin/category", {
      categories,
      sidebarPage: "category",   
      currentPage: paginationPage, 
      totalPages,
      search,
      success: req.flash("success"),
      error: req.flash("error")
    });

  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
}; 

const getAddCategory = (req, res) => {
    try {
        return res.render("admin/category", {  
            sidebarPage: "category",  
            currentPage: 1,           
            categories: [],
            totalPages: 0,
            search: "",
            error: req.flash("error"),
            success: req.flash("success")
        });
    } catch (error) {
        return res.status(500).send("Server Error");
    }
};

const  postAddCategory = async (req,res)=>{
    try {
        const {name,description} = req.body;
        console.log("hii")

       await createCategory({name,description});

      req.flash("success","Category added successfully");
      console.log(req.body);

      return res.redirect("/admin/category");
    } catch (error) {
        req.flash("error",error.message)
      return res.redirect("/admin/add-category");    }
};

const postEditCategory = async(req,res)=>{
    try {
        const {id,name,description} = req.body;
       await updateCategory(id,{name,description});

       req.flash("success","category updated successfully");
       return res.redirect('/admin/category')
    
    } catch (error) {
        console.log(error.message);
        req.flash("error",error.message);
        return res.redirect("/admin/category")
    }
}

const postCategoryStatus = async(req,res)=>{
    try {
        const {id} =req.params;
        await categoryStatus(id);

  return res.redirect("/admin/category");

   } catch (error) {
         console.log(error.message);
         req.flash("error",error.message)
       return res.status(500).send("Server Error");
    }
}
export const getActiveCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .select('_id name')
            .sort({ name: 1 })
            .lean();

       
        if (!categories || categories.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                categories: [],
                message: 'No active categories found'
            });
        }

        return res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });

    } catch (error) {
        console.error('Error fetching active categories:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch active categories'
        });
    }
};





export default  {
    getCategoryPage,
    getAddCategory,
    postAddCategory,
    postEditCategory,
    postCategoryStatus,
    getActiveCategories
};


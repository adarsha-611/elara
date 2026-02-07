import { createCategory, updateCategory,categoryStatus } from "../../services/admin/categoryServices.js";
import Category from "../../model/categorySchema.js";


const getCategoryPage = async (req, res) => {
  try {
    const { search, page } = req.query;

    const limit = 2;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * limit;

    let query = {};

    const totalCategories = await Category.countDocuments(query);

    const categories = await Category.find(query)
      .sort({ createdAt: -1 })  
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalCategories / limit);

    console.log("Found users:", users.map(u => ({
            id: u._id,
            fullName: u.fullName,
            email: u.email,
            authType: u.authType,
            isBlocked: u.isBlocked
        })));

    res.render("admin/category", {
      categories,
      currentPage,
      totalPages,
      search,
      success: req.flash("success"),
      error: req.flash("error")
    });

     if (search) {
      query.name = { $regex: search, $options: "i" };
    }

  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
};

const getAddCategory =(req,res)=>{
    try {
        return res.render("admin/add-Category",{
            error:req.flash("error"),
            success:req.flash("success")
        });
    } catch (error) {
        console.log("get addCategory error :",error);
        return res.status(500).send("Server Error");
    }
};


const  postAddCategory = async (req,res)=>{
    try {
        const {name,description} = req.body;
        console.log("hii")

       await createCategory({name,description});

      req.flash("success","Category added successfully");

      return res.redirect("/admin/category");
    } catch (error) {
        console.log("Post add category error:",error.message);
        req.flash("error",error.message)
        return res.redirect("/admin/add-Category");
    }
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


import { createCategory, updateCategory,categoryStatus } from "../../services/admin/categoryServices.js";
import Category from "../../model/categorySchema.js";


const getCategoryPage = async (req, res) => {
  try {
    const { search, page, modal, id, name, description } = req.query;  

    const limit = 6;
    const paginationPage = parseInt(page) || 1;
    const skip = (paginationPage - 1) * limit;

    let query = {};
    if (search) query.name = { $regex: search, $options: "i" };

    const totalCategories = await Category.countDocuments(query);
    const categories = await Category.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalPages = Math.ceil(totalCategories / limit);

    // Get fresh flash messages
    const flashError = req.flash('error');
    const flashSuccess = req.flash('success');

    console.log("✅ Flash Error Passed:", flashError); // For debugging

    res.render("admin/category", {
      categories,
      sidebarPage: "category",
      currentPage: paginationPage,
      totalPages,
      search: search || "",
      modal: modal || null,
      
      error: flashError,
      success: flashSuccess,

      editData: modal === 'edit' ? {
        id: id || "",
        name: name || "",
        description: description || ""
      } : null
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

const postAddCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            req.flash("error", "Category name is required");
            return res.redirect("/admin/category?modal=add");  
        }
        if (name.trim().length < 3) {
            req.flash("error", "Category name must be at least 3 characters");
            return res.redirect("/admin/category?modal=add");
        }
        if (name.trim().length > 50) {
            req.flash("error", "Category name must be at most 50 characters");
            return res.redirect("/admin/category?modal=add");
        }
        if (!/[a-zA-Z]/.test(name)) {
            req.flash("error", "Category name must contain letters");
            return res.redirect("/admin/category?modal=add");
        }

        await createCategory({ name: name.trim(), description: description?.trim() });
        req.flash("success", "Category added successfully");
        return res.redirect("/admin/category");

    } catch (error) {
        req.flash("error", error.message);
        return res.redirect("/admin/category?modal=add");
    }
};

const postEditCategory = async (req, res) => {
    console.log("📝 POST EDIT called with body:", req.body);
    try {
        const { id, name, description } = req.body;

        if (!name || !name.trim()) {
            req.flash("error", "Category name is required");
            return res.redirect(`/admin/category?modal=edit&id=${id || ''}&name=${encodeURIComponent(name || '')}&description=${encodeURIComponent(description || '')}`);
        }

        if (name.trim().length < 3) {
            req.flash("error", "Category name must be at least 3 characters");
            return res.redirect(`/admin/category?modal=edit&id=${id || ''}&name=${encodeURIComponent(name || '')}&description=${encodeURIComponent(description || '')}`);
        }

        if (!/[a-zA-Z]/.test(name)) {
            req.flash("error", "Category name must contain letters");
            return res.redirect(`/admin/category?modal=edit&id=${id || ''}&name=${encodeURIComponent(name || '')}&description=${encodeURIComponent(description || '')}`);
        }

        await updateCategory(id, { name: name.trim(), description: description?.trim() || "" });
        req.flash("success", "Category updated successfully");
        return res.redirect('/admin/category');

    } catch (error) {
        req.flash("error", error.message || "Something went wrong");
        return res.redirect(`/admin/category?modal=edit&id=${req.body.id || ''}&name=${encodeURIComponent(req.body.name || '')}&description=${encodeURIComponent(req.body.description || '')}`);
    }
};
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


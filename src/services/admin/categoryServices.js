import Category from "../../model/categorySchema.js";

export async function createCategory(data) {
    const {name,description} = data;


    const existingCategory = await Category.findOne({name});
    if(existingCategory) throw new Error("category is already exisit");

    const category = new Category({
        name,
        description
    });
    return await category.save();
}


export async function updateCategory(id,data){
    const{name,description} = data;

const existing = await Category.findOne({
        name,
        _id: { $ne: id }
    });
    if(existing)throw new Error("Category already exists");

    return await Category.findByIdAndUpdate(
        id,
        {name,description},
        {new:true}
    )

    
}

export async function categoryStatus(id) {
     const category = await Category.findById(id);
     if(!category){
         throw new Error("category not found");
     }
     category.isActive = !category.isActive;
     return await category.save();
}

export const getActiveCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .select('_id name')           
            .sort({ name: 1 });           

        res.json({
            success: true,
            categories
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch categories"
        });
    }
};
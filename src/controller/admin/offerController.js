import Category from "../../model/categorySchema.js";
import Offer from "../../model/offerSchema.js";
import Product from "../../model/productSchema.js";
import { getOfferPageData, addOfferService, updateOfferService, toggleOfferStatus } from "../../services/admin/offerService.js";
import { validateOffer } from "../../utils/validators/joi_offers.js";

const getOfferPage = async(req,res)=>{
   try {
    const page = parseInt(req.query.page)||1;

    const{offers,totalPages,currentPage} = await getOfferPageData(page,5);

    const products = await Product.find({
        isDeleted:false,
        isActive:true

    });
    const categories = await Category.find({
        isActive:true
    });

    return res.render("admin/offerManagement",{
        offers,
        currentMenu :"offers",
        totalPages,
        products,
        categories,
        sidebarPage:"offers",
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg')
    })
   } catch (error) {
     console.log(error);
     res.status(500).send("Server error")
   }
}


const addOffer = async (req, res) => {
    try {
        const { error, value } = validateOffer(req.body);

        if (error) {
            const errors = error.details.map(err => ({
                field: err.path[0] || null,
                message: err.message
            }));
            return res.status(400).json({ success: false, errors });
        }

        await addOfferService(value);
        return res.status(200).json({ success: true, message: 'Offer created successfully!' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create offer.' });
    }
};

const updateOffer = async (req, res) => {
    try {
        const { error, value } = validateOffer(req.body);

        if (error) {
            const errors = error.details.map(err => ({
                field: err.path[0] || null,
                message: err.message
            }));
            return res.status(400).json({ success: false, errors });
        }

        await updateOfferService(req.params.id, value);
        return res.status(200).json({ success: true, message: 'Offer updated successfully!' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to update offer.' });
    }
};

const toggleStatus = async(req,res)=>{
    try {
        const { id } = req.params;
        const updatedOffer = await toggleOfferStatus(id);
        req.flash('success_msg', `Offer ${updatedOffer.isActive ? 'activated' : 'deactivated'} successfully!`);
        res.redirect("/admin/offers");
    } catch (error) {
        console.log(error);
        req.flash('error_msg', 'Failed to toggle offer status.');
        res.redirect("/admin/offers");
    }
}

export default{
    getOfferPage,
    addOffer,
    updateOffer,
    toggleStatus
}
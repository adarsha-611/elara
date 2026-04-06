// controllers/user/wishlistController.js
import Wishlist from "../../model/wishlistSchema.js";
import { toggleWishlist, moveToCartFromWishlist } from "../../services/user/wishlistService.js";

const getWishlist = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 8;                    
        const skip = (page - 1) * limit;
        const search = (req.query.search || "").trim();

        
        const wishlistDoc = await Wishlist.findOne({ userId }).populate({
            path: "products.productId",
            match: search ? { name: { $regex: search, $options: "i" } } : {},
            select: "name price variants images"  
        });

        let wishlistItems = [];

        if (wishlistDoc && wishlistDoc.products) {
            wishlistItems = wishlistDoc.products
                .filter(item => item.productId)          
                .map(item => item.productId);
        }

        const totalItems = wishlistItems.length;
        const totalPages = Math.ceil(totalItems / limit);

       
        wishlistItems = wishlistItems.slice(skip, skip + limit);

        const successMessage = req.session.successMessage || null;
        if (req.session.successMessage) delete req.session.successMessage;

        res.render("user/wishlist", {
            wishlistItems,
            currentPage: page,
            totalPages,
            search,
            successMessage
        });

    } catch (error) {
        res.status(500).send("Server Error");
    }
};

const addOrRemoveWishlist = async (req, res) => {
    try {
        const userId = req.session.userId;
        const productId = req.params.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Please login first" });
        }

        const result = await toggleWishlist(userId, productId);
        return res.json(result);        

    }  catch (error) {
    return res.status(500).json({ 
        success: false, 
        message: "Server error while updating wishlist" 
    });
}
};

const addToCartFromWishlist = async (req, res) => {
    try {
        const userId = req.session.userId;
        const productId = req.params.productId;

        await moveToCartFromWishlist(userId, productId);

        return res.json({
            success: true,
            message: "Product added to cart"
        });

    } catch (error) {

        return res.json({
            success: false,
            message: error.message   
        });
    }
};

export default {
    getWishlist,
    addOrRemoveWishlist,
    addToCartFromWishlist
};
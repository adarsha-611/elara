import Wishlist from "../../model/wishlistSchema.js";
import { toggleWishlist, moveToCartFromWishlist } from "../../services/user/wishlistService.js";

const getWishlist = async (req, res) => {
    console.log("🔥 getWishlist controller called");
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;
        const search = (req.query.search || "").trim();

        const wishlistDoc = await Wishlist.findOne({ userId })
            .populate({
                path: "products.productId",
                select: "name price variants images",   // removed match filter (causes issues)
            });

        let wishlistItems = [];

        if (wishlistDoc && wishlistDoc.products) {
            wishlistItems = wishlistDoc.products
                .filter(item => item.productId !== null)   // remove deleted products
                .map(item => {
                    const product = item.productId;

                    let variantData = null;
                    if (product && item.variantId) {
                        variantData = product.variants.id(item.variantId);
                    }

                    return {
                        product,
                        variantId: item.variantId,
                        variantData
                    };
                });
        }

        // Apply search in memory (safer than match in populate)
        if (search) {
            wishlistItems = wishlistItems.filter(item => 
                item.product && 
                item.product.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        const totalItems = wishlistItems.length;
        const totalPages = Math.ceil(totalItems / limit);
        const paginatedItems = wishlistItems.slice(skip, skip + limit);

        const successMessage = req.session.successMessage || null;
        if (req.session.successMessage) delete req.session.successMessage;

        res.render("user/wishlist", {
            wishlistItems: paginatedItems,
            currentPage: page,
            totalPages,
            search,
            successMessage
        });

    } catch (error) {
        console.error("Wishlist error:", error);
        res.status(500).send("Server Error");
    }
};

const addOrRemoveWishlist = async (req, res) => {
    try {
        const userId = req.session.userId;
        const productId = req.params.id;
         const {variantId} = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Please login first" });
        }

        const result = await toggleWishlist(userId, productId,variantId);
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
        const { variantId } = req.body;

        console.log("CONTROLLER addToCartFromWishlist:", { productId, variantId });

        if (!userId) {
            return res.status(401).json({ success: false, message: "Please login" });
        }

        await moveToCartFromWishlist(userId, productId, variantId);

        return res.json({
            success: true,
            message: "Product added to cart"
        });

    } catch (error) {
        console.error("addToCartFromWishlist error:", error);
        return res.json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
};

export default {
    getWishlist,
    addOrRemoveWishlist,
    addToCartFromWishlist
};
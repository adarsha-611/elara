
import mongoose from "mongoose";
import Wishlist from "../../model/wishlistSchema.js";
import Product from "../../model/productSchema.js";
import { addToCart } from "./cartService.js";

export const toggleWishlist = async (userId, productId, variantId) => {
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new Error("Product not found");
    }

    // variantId is optional but should be valid ObjectId if provided
    let validVariantId = null;
    if (variantId) {
        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            throw new Error("Invalid variant ID");
        }
        validVariantId = variantId;
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        wishlist = new Wishlist({
            userId,
            products: [{ 
                productId: productId, 
                variantId: validVariantId 
            }]
        });
        await wishlist.save();
        return { success: true, status: "added", message: "Added to wishlist" };
    }

    // Find if this exact (product + variant) combination exists
    const index = wishlist.products.findIndex(item => 
        item.productId.toString() === productId.toString() &&
        String(item.variantId) === String(validVariantId)   // handles null/undefined safely
    );

    if (index !== -1) {
        // Remove from wishlist
        wishlist.products.splice(index, 1);
        await wishlist.save();
        return { success: true, status: "removed", message: "Removed from wishlist" };
    } else {
        // Add to wishlist
        wishlist.products.push({ 
            productId: productId, 
            variantId: validVariantId 
        });
        await wishlist.save();
        return { success: true, status: "added", message: "Added to wishlist" };
    }
};

export const moveToCartFromWishlist = async (userId, productId, variantId) => {

//     console.log("SERVICE:", {
//     productId,
//     variantId,
//     variants: product.variants.map(v => v._id.toString())
// });
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    const variant = product.variants.id(variantId);
    if (!variant) throw new Error("Variant not found");

    if (variant.stock <= 0) {
        throw new Error("Out of stock"); 
    }

    await addToCart(userId, productId, 1, variantId);

    const wishlist = await Wishlist.findOne({ userId });

    if (wishlist) {
        wishlist.products = wishlist.products.filter(item =>
            !(item.productId.toString() === productId &&
              item.variantId && item.variantId.toString() === variantId)
        );
        await wishlist.save();
    }

    return { success: true };
};
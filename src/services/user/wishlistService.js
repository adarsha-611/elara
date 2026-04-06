import mongoose from "mongoose";
import Wishlist from "../../model/wishlistSchema.js";
import Product from "../../model/productSchema.js";
import { addToCart } from "./cartService.js";

export const toggleWishlist = async (userId, productId) => {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return { success: false, message: "Product not found" };
        }

        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                userId,
                products: [{ productId }]
            });
            await wishlist.save();
            return { 
                success: true, 
                status: "added", 
                message: "Added to wishlist" 
            };
        }

        if (!Array.isArray(wishlist.products)) {
            wishlist.products = [];
        }

        const existingIndex = wishlist.products.findIndex(item => 
            item && item.productId && item.productId.toString() === productId.toString()
        );

        if (existingIndex !== -1) {
         
            wishlist.products.splice(existingIndex, 1);
            await wishlist.save();
            return { 
                success: true, 
                status: "removed", 
                message: "Removed from wishlist" 
            };
        } else {
          
            wishlist.products.push({ productId });
            await wishlist.save();
            return { 
                success: true, 
                status: "added", 
                message: "Added to wishlist" 
            };
        }
    } catch (error) {
        console.error("Toggle Wishlist Error:", error);
        return { 
            success: false, 
            message: "Server error while updating wishlist" 
        };
    }
};

export const moveToCartFromWishlist = async (userId, productId) => {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error("Product not found");
        }

        if (!product.variants || product.variants.length === 0) {
            throw new Error("No variants available for this product");
        }

        
        let selectedVariant = product.variants.find(v => v && v.stock > 0);
        
        if (!selectedVariant) {
            selectedVariant = product.variants[0];   
        }

        if (!selectedVariant || !selectedVariant._id) {
            throw new Error("Invalid variant");
        }


       await addToCart(userId, productId, 1, selectedVariant._id);;

        const wishlist = await Wishlist.findOne({ userId });
        if (wishlist && Array.isArray(wishlist.products)) {
            wishlist.products = wishlist.products.filter(item => 
                item && item.productId && item.productId.toString() !== productId.toString()
            );
            await wishlist.save();
        }

        return { success: true, message: "Product moved to cart successfully" };

    } catch (error) {
        console.error("Move to Cart From Wishlist Error:", error.message);
        throw error;
    }
};
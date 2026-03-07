import Wishlist from "../../model/wishlistSchema.js";
import Product from "../../model/productSchema.js";
import { addToCart } from "./cartService.js";

export const wishlistIcon = async (userId, productId) => {

    const product = await Product.findById(productId);
    if (!product) {
        throw new Error("Product not found");
    }

    let wishlist = await Wishlist.findOne({ userId: userId });

    
    if (!wishlist) {
        wishlist = new Wishlist({
            userId: userId,
            products: [productId]
        });
        await wishlist.save();
        return { status: "added" };
    }

    const productIndex = wishlist.products.indexOf(productId);

    if (productIndex > -1) {
        
        wishlist.products.splice(productIndex, 1);
        await wishlist.save();
        return { status: "removed" };
    } else {

        wishlist.products.push(productId);
        await wishlist.save();
        return { status: "added" };
    }
};


export const wishlistToCart = async(userId,productId)=>{
    await addToCart(userId,productId,1);

    const wishlist = await Wishlist.findOne({userId});

    if(!wishlist){
        throw new Error("Wishlist is not found");
    }
    wishlist.products = wishlist.products.filter(
        id=>id.toString() !== productId.toString()
    );
    await wishlist.save();
    return {success:true};

}
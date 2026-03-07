import { wishlistIcon,wishlistToCart } from "../../services/user/wishlistService.js";
import Wishlist from "../../model/wishlistSchema.js"
const getWishlist = async(req,res)=>{
    try {  
        const userId = req.session.userId;

        if(!userId){
            return res.redirect('/login');
        }
       const wishlist = await Wishlist.findOne({ userId })
         .populate("products");

        const wishlistItems = wishlist ? wishlist.products : [];
        const successMessage = req.session.successMessage || null;

        if (req.session.successMessage) {
             delete req.session.successMessage;
            }
        return res.render("user/wishlist",{
            wishlistItems,
            successMessage,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).send("server error")
    }
}

const addWishlist = async(req,res)=>{
    try {
          console.log("Session:", req.session);
    console.log("User:", req.user);
    console.log("UserId from session:", req.session.userId);
        const userId = req.session.userId;
        const productId = req.params.id;

        if(!userId){
            return res.status(401).json({error:"Login required"});

        }
        const result = await wishlistIcon(userId,productId);
        return res.json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Error");
    }
}

const addToCartFromWishlist = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { productId } = req.params;

        await wishlistToCart(userId, productId);

      
        req.session.successMessage = "Product added to cart ";

        return res.redirect('/wishlist');
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Error");
    }
};

export default{
    getWishlist,
    addWishlist,
    addToCartFromWishlist,
}
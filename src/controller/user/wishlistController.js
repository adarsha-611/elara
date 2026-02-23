
const getWishlist = async(req,res)=>{
    try {
        return res.render("user/wishlist")
    } catch (error) {
        console.log(error);
        return res.status(500).send("server error")
    }
}


export default{
    getWishlist,
}
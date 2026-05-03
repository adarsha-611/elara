import Product from "../../model/productSchema.js";


const getHome = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/login');
        }

        const newArrivals = await Product.find({
            isActive: true,
            isDeleted: false
        })
        .sort({ createdAt: -1 })
        .limit(4);

        
        const trendingProducts = await Product.find({
            isActive: true,
            isDeleted: false
        })
        .sort({ soldCount: -1 })  
        .limit(4);

       

        return res.render('user/homePage', {
            newArrivals,
            trendingProducts
        });

    } catch (error) {
        console.log('home page loading error', error);
        res.status(500).send("Server Error");
    }
};
const getLanding = async (req, res) => {
    try {
        if (req.session.userId) {
            return res.redirect('/home');
        }

        const newArrivals = await Product.find({
            isActive: true,
            isDeleted: false
        })
        .sort({ createdAt: -1 })
        .limit(4);

        const trendingProducts = await Product.find({
            isActive: true,
            isDeleted: false
        })
        .sort({ soldCount: -1 })
        .limit(4);

        res.render('user/landingPage', {
            newArrivals,
            trendingProducts   
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};

const getAboutPage = async(req,res)=>{
    try {
        return res.render('user/about');
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server Error");
    }
}



export default {
    getHome,
    getLanding,
    getAboutPage,
};
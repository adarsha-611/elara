
const getHome = async(req,res)=>{
    try{
        if(!req.session.userId){
            return res.redirect('/login');
        }

        res.render('user/homePage');

    }catch(error){
        console.log('home page loading error',error);
    }
};


const getLanding = async(req,res)=>{
    if(req.session.userId){
        res.redirect('/home')
    }
    res.render('user/landingPage')
}




export default {getHome,getLanding};
const getLogin = async(req,res)=>{
    try {
       return res.render("user/auth/login") 
    } catch (error) {
        console.log("error rendering login page:", error);
        res.status(500).send("server error: " + error.message);
    }
}

const postLogin = async(req,res)=>{
    try {
        const { email, password } = req.body;
        
       
        if (!email || !password) {
            return res.status(400).render("user/auth/login", {
                error: "Email and password are required"
            });
        }
        
       
        req.session.user = { email };
        return res.redirect("/home");
        
    } catch (error) {
        console.log("Error during login:", error);
        res.status(500).render("user/auth/login", {
            error: "An error occurred during login"
        });
    }
}

export default {
    getLogin,
    postLogin
}
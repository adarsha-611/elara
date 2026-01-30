const logoutUser = async (req, res) => {
    try {
      
        req.session.destroy((err) => {
            if (err) {
                console.log("Logout error:", err);
                return res.redirect('/');
            }

          
            res.clearCookie('connect.sid');

            
            return res.redirect('/login');
        });
    } catch (error) {
        console.log("User logout error:", error);
        return res.redirect('/');
    }
};

export default {
    logoutUser
};

const logoutUser = async (req, res) => {
    try {
        req.session.userId = null;
        req.session.user = null;
      

        req.session.save((err) => {
            if (err) {
                console.log("Session save error:", err);
            }
            
            res.clearCookie('elara.sid');   
            return res.redirect('/login');
        });

    } catch (error) {
        console.log("User logout error:", error);
        return res.redirect('/login');
    }
};
export default{logoutUser}
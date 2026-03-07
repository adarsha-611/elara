const adminAuth = (req, res, next) => {


    res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
    );

    if (!req.session.adminId) {
        return res.redirect("/admin/login");
    }

    next();
};

export default adminAuth;
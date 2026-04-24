
export function isLoggedIn(req, res, next) {

   

    res.set("Cache-Control", "no-store");

    if (req.session.userId) {
        req.user = req.session.userId;
        return next();
    }

    return res.redirect("/login");
}


export function redirectIfAuthenticated(req, res, next) {

    res.set("Cache-Control", "no-store");

    if (req.session.userId) {
        return res.redirect("/home");
    }

    next();
}


export function isLoggedIn(req,res,next){
    if(req.session.userId){
        req.user = req.session.userId
        return next();
    }
    return res.redirect('/login');
}

export function redirectIfAuthenticated(req,res,next){
    if(req.session.userId){
        console.log(req.session.userId)
        return res.redirect("/home")
    }
    next()
}
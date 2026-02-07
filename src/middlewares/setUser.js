
export const setUser = (req, res, next) => {
    
    if (req.session.userId) {
        res.locals.user = req.session.userId; 
    } else {
        res.locals.user = null;
    }
    next();
};

// src/middleware/setUser.js
export const setUser = (req, res, next) => {
    // Example: if you store user ID in session
    if (req.session.userId) {
        res.locals.user = req.session.userId; // you can also fetch full user if needed
    } else {
        res.locals.user = null;
    }
    next();
};


import User from "../model/userSchema.js";

export async function isLoggedIn(req, res, next) {
    res.set("Cache-Control", "no-store");

    if (!req.session.userId) {
        return res.redirect("/login");
    }

    try {
        const user = await User.findById(req.session.userId);

        if (!user || user.isBlocked) {
            req.session.destroy((err) => {
                if (err) console.error("Session destroy error:", err);
                return res.redirect("/login");
            });
            return; 
        }

        req.user = user; 
        return next();

    } catch (err) {
        console.error(err);
        return res.redirect("/login");
    }
}

export function redirectIfAuthenticated(req, res, next) {
    res.set("Cache-Control", "no-store");

    if (req.session.userId) {
        return res.redirect("/home");
    }

    next();
}
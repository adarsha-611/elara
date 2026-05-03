import User from "../../model/userSchema.js";

const getUsers = async (req, res) => {
    try {
        const { search, page } = req.query;

        const limit = 5;
        const currentPage = parseInt(page) || 1;
        const skip = (currentPage - 1) * limit;

        let query = { role: { $ne: "admin" } };

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const totalUsers = await User.countDocuments(query);

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalUsers / limit);

        res.render("admin/users", {
            users,
            currentPage,
            totalPages,
            search,
            currentMenu:"users",
            success: req.flash("success"),
            error: req.flash("error"),
            sidebarPage: "users"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send("Server Error");
    }
};

const blockUser = async (req, res) => {
    try {

        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/admin/users");
        }

        user.isBlocked = !user.isBlocked;

        await user.save();

        const message = user.isBlocked
            ? "User blocked successfully"
            : "User unblocked successfully";

        req.flash("success", message);

        return res.redirect("/admin/users");

    } catch (error) {
        console.error(error);
        req.flash("error", "Error updating user status");
        return res.redirect("/admin/users");
    }
};

export default {
    getUsers,
    blockUser
};
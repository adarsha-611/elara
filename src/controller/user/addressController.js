import User from "../../model/userSchema.js";
import { validateAddress } from "../../utils/validators/joi_address.js";

const getAddresses = async (req, res) => {
  try {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1; 
    const limit = 3; 
    const skip = (page - 1) * limit;

    const user = await User.findById(userId).lean();
   
   
    const totalAddresses = user.addresses.length;
    const totalPages = Math.ceil(totalAddresses / limit);

   
    const paginatedAddresses = user.addresses.slice(skip, skip + limit);

    return res.render("user/address", {
      user,
      addresses: paginatedAddresses,
      currentPage: page,
      totalPages,
      success: req.flash('success'),
      error: req.flash('error'),
      validationErrors: req.flash('validationErrors'),
      oldInput: req.flash('oldInput'),
      showModalAfterError: req.flash('showModalAfterError'),
      formMode: req.flash('formMode')
    });

  } catch (error) {
    console.error("Error fetching addresses:", error);
    return res.status(500).send("Server Error");
  }
};


const addAddress = async (req, res) => {
    try {
        console.log("Add Address - req.body:", req.body);  

        const userId = req.session.userId;
        req.body.isDefault = req.body.isDefault === "on" || req.body.isDefault === true;

        
        const value = req.body;  

        const user = await User.findById(userId);

        let makeDefault = user.addresses.length === 0 || value.isDefault;
        if (makeDefault) {
            user.addresses.forEach(a => a.isDefault = false);
        }

        user.addresses.push({
            ...value,
            isDefault: makeDefault
        });

        await user.save();

        req.flash("success", "Address added successfully");
        res.redirect("/profile/address");

    } catch (error) {
        console.error("Error adding address:", error);
        req.flash("error", "Failed to add address");
        res.redirect("/profile/address");
    }
};


const editAddress = async (req, res) => {
    try {
        console.log("Edit Address - req.body:", req.body);  

        const userId = req.session.userId;
        const addressId = req.body.addressId;

        if (!addressId) {
            req.flash("error", "No address ID provided");
            return res.redirect("/profile/address");
        }

        req.body.isDefault = req.body.isDefault === "on" || req.body.isDefault === true;

       
        const value = req.body;  

        const user = await User.findById(userId);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/profile/address");
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            req.flash("error", "Address not found or already deleted");
            return res.redirect("/profile/address");
        }

      
        Object.assign(address, {
            fullName: value.fullName,
            phoneNumber: value.phoneNumber,
            street: value.street,
            city: value.city,
            state: value.state,
            pincode: value.pincode,
            addressType: value.addressType,
        });

        
        if (value.isDefault) {
            user.addresses.forEach(a => { a.isDefault = false; });
            address.isDefault = true;
        } else if (address.isDefault && user.addresses.length > 1) {
            address.isDefault = false;
        
            if (user.addresses.length > 0) {
                user.addresses[0].isDefault = true;
            }
        }

        await user.save();

        req.flash("success", "Address updated successfully");
        res.redirect("/profile/address");

    } catch (error) {
        console.error("Edit address error:", error);
        req.flash("error", "Failed to update address");
        res.redirect("/profile/address");
    }
};

const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId } = req.params;

        await User.updateOne(
            { _id: userId },
            { $pull: { addresses: { _id: addressId } } }
        );

        req.flash("success", "Address deleted successfully");
        res.redirect("/profile/address");
    } catch (error) {
        console.error("Error deleting address:", error);
        req.flash("error", "Failed to delete address");
        res.redirect("/profile/address");
    }
};

const setDefaultAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId } = req.params;

        const user = await User.findById(userId);

        user.addresses.forEach((addr) => {
            addr.isDefault = addr._id.toString() === addressId;
        });

        await user.save();

        req.flash("success", "Default address updated");
        res.redirect("/profile/address");
    } catch (error) {
        console.error("Error setting default address:", error);
        req.flash("error", "Failed to set default address");
        res.redirect("/profile/address");
    }
};

export default {
    getAddresses,
    addAddress,
    editAddress,
    deleteAddress,
    setDefaultAddress,
};
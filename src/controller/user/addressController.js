import User from "../../model/userSchema.js";
import { validateAddress } from "../../utils/validators/joi_address.js";

/* ===========================
   GET ADDRESSES WITH PAGINATION
=========================== */
const getAddresses = async (req, res) => {
  try {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    const userDoc = await User.findById(userId);
    if (!userDoc) {
      req.flash("error", "User not found");
      return res.redirect("/profile");
    }

    const totalAddresses = userDoc.addresses.length;
    const totalPages = Math.max(1, Math.ceil(totalAddresses / limit));

    const paginatedAddresses = userDoc.addresses
      .slice(skip, skip + limit)
      .map(addr => addr.toObject ? addr.toObject() : addr);

    res.render("user/address", {
      user: userDoc.toObject(),
      addresses: paginatedAddresses,
      currentPage: page,
      totalPages,
      success: req.flash("success"),
      error: req.flash("error"),
      validationErrors: req.flash("validationErrors"),
      oldInput: req.flash("oldInput"),
      showModalAfterError: req.flash("showModalAfterError"),
      formMode: req.flash("formMode"),
    });

  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).send("Server Error");
  }
};


/* ===========================
   ADD ADDRESS
=========================== */
const addAddress = async (req, res) => {
  try {
    req.body.isDefault = req.body.isDefault === "on" || req.body.isDefault === true;

    const { error, value } = validateAddress(req.body);

    if (error) {
      const errors = error.details.map(err => ({
        field: err.path[0],
        message: err.message
      }));

      const userDoc = await User.findById(req.session.userId);

      return res.render("user/address", {
        user: userDoc.toObject(),
        addresses: userDoc.addresses,
        currentPage: 1,
        totalPages: 1,
        validationErrors: JSON.stringify(errors),
        oldInput: JSON.stringify(req.body),
        showModalAfterError: "add",
        formMode: "add",
        success: null,
        error: null
      });
    }

    req.body = value;

    const user = await User.findById(req.session.userId);

    const makeDefault = user.addresses.length === 0 || req.body.isDefault;

    if (makeDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      addressType: req.body.addressType,
      isDefault: makeDefault
    });

    user.markModified("addresses");
    await user.save();

    req.flash("success", "Address added successfully");
    res.redirect("/profile/address");

  } catch (error) {
    console.error("Error adding address:", error);
    req.flash("error", "Failed to add address");
    res.redirect("/profile/address");
  }
};


/* ===========================
   EDIT ADDRESS
=========================== */
const editAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const addressId = req.body.addressId;

    if (!addressId) {
      req.flash("error", "No address ID provided");
      return res.redirect("/profile/address");
    }

    req.body.isDefault = req.body.isDefault === "on" || req.body.isDefault === true;

    const user = await User.findById(userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/profile/address");
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      req.flash("error", "Address not found");
      return res.redirect("/profile/address");
    }

    Object.assign(address, {
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      addressType: req.body.addressType,
    });

    if (req.body.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
      address.isDefault = true;
    } 
    else if (address.isDefault && user.addresses.length > 1) {
      address.isDefault = false;
      user.addresses[0].isDefault = true;
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


/* ===========================
   DELETE ADDRESS
=========================== */
const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const { addressId } = req.params;

    const address = user.addresses.id(addressId);
    const wasDefault = address.isDefault;

    address.deleteOne();

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    req.flash("success", "Address deleted successfully");
    res.redirect("/profile/address");

  } catch (error) {
    console.error("Error deleting address:", error);
    req.flash("error", "Failed to delete address");
    res.redirect("/profile/address");
  }
};


/* ===========================
   SET DEFAULT ADDRESS
=========================== */
const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const { addressId } = req.params;

    user.addresses.forEach(addr => {
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
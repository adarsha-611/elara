import User from "../../model/userSchema.js";
import { validateAddress } from "../../utils/validators/joi_address.js";

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
    const totalPages = Math.ceil(totalAddresses / limit);

    const addressesSorted = userDoc.addresses.sort((a, b) => b._id - a._id);
    const paginatedAddresses = addressesSorted.slice(skip, skip + limit);

    res.render("user/address", {
      user: userDoc.toObject(),
      addresses: paginatedAddresses,
      currentPage: page,
      totalPages,
      success: req.flash("success"),
      error: req.flash("error"),
    });

  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).send("Server Error");
  }
};;

const addAddress = async (req, res) => {
  try {
    const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    
    const addressData = {
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      addressType: req.body.addressType,
      isDefault: req.body.isDefault === "on" || req.body.isDefault === true
    };
    
    
    const { error, value } = validateAddress(addressData);
    
    if (error) {
      const errors = error.details.map(err => ({
        field: err.path[0],
        message: err.message
      }));
      
      if (isAjax) {
        return res.status(400).json({ success: false, errors });
      }
      
    
      const userDoc = await User.findById(req.session.userId);
      return res.render("user/address", {
        user: userDoc.toObject(),
        addresses: userDoc.addresses,
        currentPage: 1,
        totalPages: 1,
        validationErrors: JSON.stringify(errors),
        oldInput: JSON.stringify(req.body),
        showModalAfterError: "add",
        formMode: "add"
      });
    }
    
 
    const user = await User.findById(req.session.userId);
    if (!user) {
      if (isAjax) return res.status(404).json({ success: false, message: "User not found" });
      req.flash("error", "User not found");
      return res.redirect("/profile/address");
    }
    
    const makeDefault = user.addresses.length === 0 || value.isDefault;
    
    if (makeDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    
    user.addresses.push({
      fullName: value.fullName,
      phoneNumber: value.phoneNumber,
      street: value.street,
      city: value.city,
      state: value.state,
      pincode: value.pincode,
      addressType: value.addressType,
      isDefault: makeDefault
    });
    
    user.markModified("addresses");
    await user.save();
    
    if (isAjax) {
      return res.json({ success: true, message: "Address added successfully" });
    }
    
    req.flash("success", "Address added successfully");
    res.redirect("/profile/address");
    
  } catch (error) {
    console.error("Error adding address:", error);
    const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    if (isAjax) {
      return res.status(500).json({ success: false, message: "Failed to add address" });
    }
    
    req.flash("error", "Failed to add address");
    res.redirect("/profile/address");
  }
};


const editAddress = async (req, res) => {
  try {
    const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';
    const addressId = req.body.addressId;
    
    if (!addressId) {
      if (isAjax) return res.status(400).json({ success: false, message: "No address ID" });
      req.flash("error", "No address ID");
      return res.redirect("/profile/address");
    }
    
    
    const addressData = {
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      addressType: req.body.addressType,
      isDefault: req.body.isDefault === "on" || req.body.isDefault === true
    };
    
   
    const { error, value } = validateAddress(addressData);
    
    if (error) {
      const errors = error.details.map(err => ({
        field: err.path[0],
        message: err.message
      }));
      
      if (isAjax) {
        return res.status(400).json({ success: false, errors });
      }
      
      const userDoc = await User.findById(req.session.userId);
      return res.render("user/address", {
        user: userDoc.toObject(),
        addresses: userDoc.addresses,
        currentPage: 1,
        totalPages: 1,
        validationErrors: JSON.stringify(errors),
        oldInput: JSON.stringify({ ...req.body, addressId }),
        showModalAfterError: "edit",
        formMode: "edit"
      });
    }
    
   
    const user = await User.findById(req.session.userId);
    if (!user) {
      if (isAjax) return res.status(404).json({ success: false, message: "User not found" });
      req.flash("error", "User not found");
      return res.redirect("/profile/address");
    }
    
    const address = user.addresses.id(addressId);
    if (!address) {
      if (isAjax) return res.status(404).json({ success: false, message: "Address not found" });
      req.flash("error", "Address not found");
      return res.redirect("/profile/address");
    }
    
   
    address.fullName = value.fullName;
    address.phoneNumber = value.phoneNumber;
    address.street = value.street;
    address.city = value.city;
    address.state = value.state;
    address.pincode = value.pincode;
    address.addressType = value.addressType;
    
   
    if (value.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
      address.isDefault = true;
    } else if (address.isDefault && user.addresses.length > 1) {
      address.isDefault = false;
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    
    if (isAjax) {
      return res.json({ success: true, message: "Address updated successfully" });
    }
    
    req.flash("success", "Address updated successfully");
    res.redirect("/profile/address");
    
  } catch (error) {
    console.error("Edit address error:", error);
    const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    if (isAjax) {
      return res.status(500).json({ success: false, message: "Failed to update address" });
    }
    
    req.flash("error", "Failed to update address");
    res.redirect("/profile/address");
  }
};


const deleteAddress = async (req, res) => {
  try {
    const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';
    const { addressId } = req.params;
    
    // console.log("Delete address - ID:", addressId); 
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      if (isAjax) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      req.flash("error", "User not found");
      return res.redirect("/profile/address");
    }
    
    const address = user.addresses.id(addressId);
    if (!address) {
      if (isAjax) {
        return res.status(404).json({ success: false, message: "Address not found" });
      }
      req.flash("error", "Address not found");
      return res.redirect("/profile/address");
    }
    
    const wasDefault = address.isDefault;
    address.deleteOne();
    
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    
    if (isAjax) {
      return res.json({ success: true, message: "Address deleted successfully" });
    }
    
    req.flash("success", "Address deleted successfully");
    res.redirect("/profile/address");
    
  } catch (error) {
    console.error("Error deleting address:", error);
    const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    if (isAjax) {
      return res.status(500).json({ success: false, message: error.message || "Failed to delete address" });
    }
    
    req.flash("error", "Failed to delete address");
    res.redirect("/profile/address");
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';
    const { addressId } = req.params;
    
    console.log("Setting default address:", addressId); // Debug
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      if (isAjax) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      req.flash("error", "User not found");
      return res.redirect("/profile/address");
    }
    
   
    const address = user.addresses.id(addressId);
    if (!address) {
      if (isAjax) {
        return res.status(404).json({ success: false, message: "Address not found" });
      }
      req.flash("error", "Address not found");
      return res.redirect("/profile/address");
    }
    
    
    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === addressId;
    });
    
    await user.save();
    
    if (isAjax) {
      return res.json({ success: true, message: "Default address updated successfully" });
    }
    
    req.flash("success", "Default address updated successfully");
    res.redirect("/profile/address");
    
  } catch (error) {
    console.error("Error setting default address:", error);
    const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    if (isAjax) {
      return res.status(500).json({ success: false, message: error.message || "Failed to set default address" });
    }
    
    req.flash("error", "Failed to set default address");
    res.redirect("/profile/address");
  }
};


const getAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }
    
    return res.json({ success: true, address });
    
  } catch (error) {
    console.error("Get address error:", error);
    return res.status(500).json({ success: false, message: "Failed to get address" });
  }
};

export default {
  getAddresses,
  addAddress,
  editAddress,
  deleteAddress,
  setDefaultAddress,
  getAddress
};

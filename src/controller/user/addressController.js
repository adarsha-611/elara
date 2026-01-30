import User from "../../model/userSchema.js";

const getAddresses = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        return res.render("user/address", { 
            user, 
            success: req.flash('success'), 
            error: req.flash('error') 
        });
    } catch (error) {
        console.error("Error fetching addresses:", error);
        return res.status(500).send("Server Error");
    }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { fullName, phoneNumber, street, city, state, pincode, addressType, isDefault } = req.body;

    const user = await User.findById(userId);
    
    let makeDefault = false;
    if (user.addresses.length === 0) {
        makeDefault = true;
    } else if (isDefault === 'on') { 
        makeDefault = true;
        
        user.addresses.forEach(a => a.isDefault = false);
    }

    user.addresses.push({ 
        fullName, 
        phoneNumber, 
        street, 
        city, 
        state, 
        pincode, 
        addressType, 
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
    const userId = req.session.userId;
    const { addressId, fullName, phoneNumber, street, city, state, pincode, addressType, isDefault } = req.body;

    const user = await User.findById(userId);
    const address = user.addresses.id(addressId);

    if (!address) {
        req.flash("error", "Address not found");
        return res.redirect("/profile/address");
    }

   
    address.fullName = fullName;
    address.phoneNumber = phoneNumber;
    address.street = street;
    address.city = city;
    address.state = state;
    address.pincode = pincode;
    address.addressType = addressType;
    
   
    if (isDefault === 'on') {
        user.addresses.forEach(a => a.isDefault = false);
        address.isDefault = true;
    } else if (address.isDefault && user.addresses.length > 1) {
         address.isDefault = false;
    }

    await user.save();

    req.flash("success", "Address updated successfully");
    res.redirect("/profile/address");
  } catch (error) {
    console.error("Error editing address:", error);
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

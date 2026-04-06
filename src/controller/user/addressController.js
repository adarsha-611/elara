import { validateAddress } from "../../utils/validators/joi_address.js";
import {
  getUserAddresses,
  addUserAddress,
  editUserAddress,
  deleteUserAddress,
  setDefaultAddressService,
  getSingleAddress
} from "../../services/user/addressService.js";



const getAddresses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const { user, addresses, totalPages, currentPage } =
      await getUserAddresses(req.session.userId, page);

    res.render("user/address", {
      user: user.toObject(),
      addresses,
      currentPage,
      totalPages,
      success: req.flash("success"),
      error: req.flash("error"),
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};



const addAddress = async (req, res) => {
  const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';

  try {
    const { error, value } = validateAddress({
      ...req.body,
      isDefault: req.body.isDefault === "on" || req.body.isDefault === true
    });

    if (error) {
      const errors = error.details.map(err => ({
        field: err.path[0],
        message: err.message
      }));

      return res.status(400).json({ success: false, errors });
    }

    await addUserAddress(req.session.userId, value);

    if (isAjax) {
      return res.json({ success: true, message: "Address added successfully" });
    }

    req.flash("success", "Address added successfully");
    res.redirect("/profile/address");

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};



const editAddress = async (req, res) => {
  const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';

  try {
    const { error, value } = validateAddress({
      ...req.body,
      isDefault: req.body.isDefault === "on" || req.body.isDefault === true
    });

    if (error) {
      const errors = error.details.map(err => ({
        field: err.path[0],
        message: err.message
      }));

      return res.status(400).json({ success: false, errors });
    }

    await editUserAddress(
      req.session.userId,
      req.body.addressId,
      value
    );

    res.json({ success: true, message: "Address updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};



const deleteAddress = async (req, res) => {
  try {
    await deleteUserAddress(
      req.session.userId,
      req.params.addressId
    );

    res.json({ success: true, message: "Address deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const setDefaultAddress = async (req, res) => {
  try {
    await setDefaultAddressService(
      req.session.userId,
      req.params.addressId
    );

    res.json({ success: true, message: "Default address updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const getAddress = async (req, res) => {
  try {
    const address = await getSingleAddress(
      req.session.userId,
      req.params.addressId
    );

    res.json({ success: true, address });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
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
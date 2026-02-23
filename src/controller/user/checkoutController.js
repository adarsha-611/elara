import Order from "../../model/orderSchema.js"; 
import Cart from "../../model/cartSchema.js";
import Product from "../../model/productSchema.js";
import Mongoose from "mongoose";
import User from '../../model/userSchema.js';




const getCheckoutPage = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.redirect("/login");
    }

    const user = await User.findById(userId);
    const cart = await Cart.findOne({ userId: userId });

    let cartItems = [];
    let subtotal = 0;

    if (cart && cart.items.length > 0) {
      const productIds = cart.items.map(item => item.productId);

      const products = await Product.find({
        _id: { $in: productIds }
      });

      cartItems = cart.items.map(item => {
        const product = products.find(
          p => p._id.toString() === item.productId.toString()
        );

        if (!product) return null;

        const variant = product.variants?.[0];

if (!variant) return null;

  const price = Number(variant.price || 0);
  const image = variant.images?.[0] || "placeholder.jpg";

  const itemTotal = price * item.quantity;
  subtotal += itemTotal;

  return {
      product: {
      name: product.name,
       image,
     price
   },
    quantity: item.quantity,
  itemTotal
};

      }).filter(Boolean);
    }

   
    return res.render("user/checkOut", {
      addresses: user.addresses || [],
      cartItems,
      subtotal,
      success: req.flash("success"),
      error: req.flash("error")
    });

  } catch (error) {
    console.log(error);
    return res.status(500).send("server error");
  }
};


const checkaddAddress = async (req, res) => {
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
        res.redirect("/checkout");

    } catch (error) {
        console.error("Error adding address:", error);
        req.flash("error", "Failed to add address");
        res.redirect("/checkout");
    }
};


const checkeditAddress = async (req, res) => {
    try {
        console.log("Edit Address - req.body:", req.body);  

        const userId = req.session.userId;
        const addressId = req.body.addressId;

        if (!addressId) {
            req.flash("error", "No address ID provided");
            return res.redirect("/checkout");
        }

        req.body.isDefault = req.body.isDefault === "on" || req.body.isDefault === true;

       
        const value = req.body;  

        const user = await User.findById(userId);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/checkout");
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            req.flash("error", "Address not found or already deleted");
            return res.redirect("/checkout");
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
        res.redirect("/checkout");

    } catch (error) {
        console.error("Edit address error:", error);
        req.flash("error", "Failed to update address");
        res.redirect("/checkout");
    }
};

const checkdeleteAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId } = req.params;

        await User.updateOne(
            { _id: userId },
            { $pull: { addresses: { _id: addressId } } }
        );

        req.flash("success", "Address deleted successfully");
        res.redirect("/checkout");
    } catch (error) {
        console.error("Error deleting address:", error);
        req.flash("error", "Failed to delete address");
        res.redirect("/checkout");
    }
};

const checksetDefaultAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId } = req.params;

        const user = await User.findById(userId);

        user.addresses.forEach((addr) => {
            addr.isDefault = addr._id.toString() === addressId;
        });

        await user.save();

        req.flash("success", "Default address updated");
        res.redirect("/checkout");
    } catch (error) {
        console.error("Error setting default address:", error);
        req.flash("error", "Failed to set default address");
        res.redirect("/checkout");
    }
};

const orderSuccess = async(req,res)=>{
    const {orderId} = req.params;
    res.render("user/orderSuccess",{orderId});
}
function generateOrderId() {
  return "ORD" + Date.now();
}



const placeOrder = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      req.flash("error", "Please login to continue");
      return res.redirect("/login");
    }

    const { addressId, paymentMethod } = req.body;

    if (!addressId || !paymentMethod) {
      req.flash("error", "Select address and payment method");
      return res.redirect("/checkout");
    }

    const user = await User.findById(userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }

   
const cart = await Cart.findOne({ userId: userId }).populate({
      path: "items.productId",
      select: "name variants isDeleted"
    });

    if (!cart || cart.items.length === 0) {
      req.flash("error", "Cart is empty");
      return res.redirect("/cart");
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = cartItem.productId;

      if (!product || product.isDeleted) {
        req.flash("error", `${product?.name || "Item"} unavailable`);
        return res.redirect("/checkout");
      }

      if (!product.variants || product.variants.length === 0) {
        req.flash("error", `No variants for ${product.name}`);
        return res.redirect("/checkout");
      }

      const selectedVariant = product.variants[0];

     if (!selectedVariant) {
    throw new Error(`No variants available for ${product.name}`);
  }


      if (selectedVariant.stock < cartItem.quantity) {
        req.flash(
          "error",
          `Only ${selectedVariant.stock} ${product.name} left`
        );
        return res.redirect("/checkout");
      }

      const itemTotal = selectedVariant.price * cartItem.quantity;

      orderItems.push({
        product: product._id,
        variantColor: selectedVariant.color,
        quantity: cartItem.quantity,
        price: selectedVariant.price,
        total: itemTotal
      });

      totalAmount += itemTotal;
    }

    const shippingAddressDoc = user.addresses.id(addressId);
    if (!shippingAddressDoc) {
      req.flash("error", "Address not found");
      return res.redirect("/checkout");
    }

    const shippingAddress = {
      fullName: shippingAddressDoc.fullName,
      phoneNumber: shippingAddressDoc.phoneNumber,
      street: shippingAddressDoc.street,
      city: shippingAddressDoc.city,
      state: shippingAddressDoc.state,
      pincode: shippingAddressDoc.pincode
    };

    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "pending",
      orderId: generateOrderId()
    });

   
   await Cart.updateOne(
  { userId: userId },
  { $set: { items: [] } }
 );



    for (const item of orderItems) {
      await Product.updateOne(
        {
          _id: item.product,
          "variants.color": item.variantColor
        },
        {
          $inc: { "variants.$.stock": -item.quantity }
        }
      );
    }

    req.flash("success", "Order placed successfully!");
    return res.redirect(`/order-success/${order._id}`);

  } catch (error) {
    console.error("Place Order Error:", error);
    req.flash("error", "Something went wrong");
    return res.redirect("/checkout");
  }
};




export default{
    getCheckoutPage,
    checkaddAddress,
    checkeditAddress,
    checkdeleteAddress,
    checksetDefaultAddress,
    orderSuccess,
    placeOrder,
}
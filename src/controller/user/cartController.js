import cartSchema from "../../model/cartSchema.js";
import Product from "../../model/productSchema.js";
import { addToCart,removeFromCart } from "../../services/user/cartService.js";
const getCartPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const cart = await cartSchema.findOne({ userId });

    let cartItems = [];
    const successMessage = req.session.successMessage || null;

    if (req.session.successMessage) {
      delete req.session.successMessage;
    }

    if (cart && cart.items && cart.items.length > 0) {

      const productIds = cart.items
        .filter(i => i.productId)
        .map(i => i.productId);

      const products = await Product.find({
        _id: { $in: productIds }
      });

      const productMap = {};
      products.forEach(p => {
        productMap[String(p._id)] = p;
      });

      cartItems = cart.items.map(item => {
        try {
          if (!item) return null;
          if (!item.productId) return null;
          console.log(JSON.stringify(cart, null, 2));

          const product = productMap[String(item.productId)];
          if (!product) return null;

          if (!product.variants || product.variants.length === 0) return null;

          let variant = null;

          if (item.variantId) {
            variant = product.variants.find(v =>
              String(v._id) === String(item.variantId)
            );
          }

          if (!variant) {
            variant = product.variants[0];
          }

          if (!variant) return null;

          const isBlocked = product.isBlocked||!product.isActive;
          return {
            productId: String(item.productId),
            variantId: String(variant._id),
            quantity: item.quantity || 1,
            price: variant.price || 0,
            stock: variant.stock || 0,
            name: product.name || "",
            image: variant.images?.[0] || "/images/default.png",
            isBlocked:isBlocked
          };

        } catch (err) {
          console.log("Cart item error:", err);
          return null;
        }

      }).filter(i => i !== null);
    }

    return res.render("user/cart", { cartItems, successMessage });

  } catch (error) {
    console.log("Cart page error FULL:", error);
    return res.status(500).send("server error");
  }
};

const addCartItem = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId, qty, variantId } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product not found"
      });
    }

    if (product.isBlocked || !product.isActive || product.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Product is unavailable"
      });
    }

    await addToCart(userId, productId, qty || 1, variantId);

    return res.json({
      success: true,
      message: "Product added to cart"
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const removeCartItem = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId, variantId } = req.params;

    await removeFromCart(userId, productId, variantId);
    req.session.successMessage = "Item removed from cart successfully!";

    return res.redirect("/cart");

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateQuantity = async (req, res) => {
  try {
        console.log("BODY:", req.body);

    const userId = req.session.userId;
    const { productId, variantId, quantity } = req.body;
        console.log("Updating quantity:", quantity);


    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false });
    }

   let variant;

if (variantId) {
  variant = product.variants.id(variantId);
} else {
  variant = product.variants[0];
}

if (!variant) {
  return res.status(404).json({
    success: false,
    message: "Variant not found"
  });
}

    const availableStock = variant.stock;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Minimum quantity is 1"
      });
    }

    if (quantity > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 items allowed"
      });
    }

    if (quantity > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} items available`
      });
    }

    const mongoose = (await import("mongoose")).default;

    await cartSchema.updateOne(
      {
        userId: new mongoose.Types.ObjectId(userId),
        items: {
          $elemMatch: {
            productId: new mongoose.Types.ObjectId(productId),
            variantId: new mongoose.Types.ObjectId(variantId)
          }
        }
      },
      {
        $set: { "items.$.quantity": Number(quantity) }
      }
    );

    return res.json({ success: true });

  } catch (error) {
    console.log("Update error:", error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
export default {
    getCartPage,
    addCartItem,
    removeCartItem,
    updateQuantity,
};
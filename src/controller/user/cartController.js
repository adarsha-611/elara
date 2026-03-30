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

      
      let cartUpdated = false;

      for (let item of cart.items) {
        const product = productMap[String(item.productId)];
        if (!product) continue;

        let variant = product.variants.find(v =>
          String(v._id) === String(item.variantId)
        );

        console.log("Product status:", {
          name: product.name,
          isBlocked: product.isBlocked,
          isActive: product.isActive
        });
        if (!variant) {
  console.log("Variant missing for cart item:", item.productId);
  continue;
}

        if (!variant) continue;

        let stockWarning = false;

        if (item.quantity > variant.stock) {
      stockWarning = true;
      }

        if (item.price !== variant.price) {
          item.price = variant.price;
          cartUpdated = true;
        }
      }

     
      if (cartUpdated) {
        await cart.save();
      }

     
      cartItems = cart.items.map(item => {
        try {
          if (!item || !item.productId) return null;

          const product = productMap[String(item.productId)];

          if (!product) {
            return {
              productId: String(item.productId),
              variantId: String(item.variantId),
              quantity: item.quantity || 1,
              price: item.price || 0,
              stock: 0,
              name: "Product unavailable",
              image: "/images/default.png",
              isBlocked: true,
              productMissing: true
            };
          }

          if (!product.variants || product.variants.length === 0) {
            return {
              productId: String(item.productId),
              variantId: String(item.variantId),
              quantity: item.quantity || 1,
              price: item.price || 0,
              stock: 0,
              name: product.name,
              image: "/images/default.png",
              isBlocked: true,
              variantMissing: true
            };
          }

          let variant = null;

          if (item.variantId) {
            variant = product.variants.find(v =>
              String(v._id) === String(item.variantId)
            );
          }
          let variantMissing = false;

          if (item.variantId) {
            variant = product.variants.find(v =>
          String(v._id) === String(item.variantId)
        );
    }

          if (!variant) {
              variantMissing = true;
      }

          const isBlocked = product.isBlocked || !product.isActive;

         return {
            productId: String(item.productId),
            variantId: String(item.variantId), 
            quantity: item.quantity || 1,
            price: variant ? variant.price : item.price || 0,
            stock: variant ? variant.stock : 0,
            name: product.name || "",
            image:
             item.image ||
             variant?.images?.[0] ||
             product?.images?.[0] ||
             "/images/default.png",
            isBlocked: product.isBlocked || !product.isActive,
             variantMissing: variantMissing
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


const validationCheckout = async (req, res) => {
  try {
    const userId = req.session.userId;

    const cart = await cartSchema.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.json({
        success: false,
        message: "Cart is empty"
      });
    }

    for (let item of cart.items) {
      const product = await Product.findById(item.productId);

      
      if (!product) {
        return res.json({
          success: false,
          message: "A product in your cart is no longer available"
        });
      }

    
      if (product.isBlocked || !product.isActive || product.isDeleted) {
        return res.json({
          success: false,
          message: `${product.name} is no longer available`
        });
      }

     
      const variant = product.variants.find(v =>
        String(v._id) === String(item.variantId)
      );

      if (!variant) {
        return res.json({
          success: false,
          message: `${product.name} option is no longer available`
        });
      }

      
      if (variant.stock === 0) {
        return res.json({
          success: false,
          message: `${product.name} is out of stock`
        });
      }

      if (item.quantity > variant.stock) {
        return res.json({
          success: false,
          message: `Only ${variant.stock} items available for ${product.name}`
        });
      }
    }

    return res.json({
      success: true
    });

  } catch (error) {
    console.log("VALIDATION ERROR:", error);
    return res.json({
      success: false,
      message: "Validation failed"
    });
  }
};

export default {
    getCartPage,
    addCartItem,
    removeCartItem,
    updateQuantity,
    validationCheckout,
};
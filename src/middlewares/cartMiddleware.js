import Cart from "../model/cartSchema.js";  

export const cartCount = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      res.locals.cartCount = 0;
      return next();
    }

    const cart = await Cart.findOne({ userId: req.session.userId });

    res.locals.cartCount = cart ? cart.items.length : 0;

    next();
  } catch (error) {
    console.log(error);
    res.locals.cartCount = 0;
    next();
  }
};
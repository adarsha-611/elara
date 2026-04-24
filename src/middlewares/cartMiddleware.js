import Cart from "../model/cartSchema.js";  

export const cartCount = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      res.locals.cartCount = 0;
      return next();
    }

    const cart = await Cart.findOne({ userId: req.session.userId });
  //  const sum = cart.items.reduce((acc,val)=>acc+=val.quantity,0)
    res.locals.cartCount = cart ? cart.items.length : 0;

    next();
  } catch (error) {
    console.log(error);
    res.locals.cartCount = 0;
    next();
  }
};
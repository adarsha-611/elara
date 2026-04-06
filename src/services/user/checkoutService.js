import Cart from "../../model/cartSchema.js"
import User from "../../model/userSchema.js"
import Order from "../../model/orderSchema.js"

const generateOrderId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${Date.now()}-${random}`;
};

export const getCheckoutData = async (userId) => {
  const user = await User.findById(userId);

  const cart = await Cart.findOne({ userId }).populate({
    path: "items.productId",
    select: "name variants isDeleted isBlocked isActive"
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart empty");
  }

  let cartItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = item.productId;

    const variant = product.variants.find(
      v => v._id.toString() === item.variantId.toString()
    );

    if (!variant) continue;

    const price = variant.price;

    const image = variant.images?.[0] || "/images/placeholder.png";

    const itemTotal = price * item.quantity;
    subtotal += itemTotal;

    cartItems.push({
      name: product.name,
      image: image,
      price: price,
      quantity: item.quantity,
      itemTotal: itemTotal
});
  }

  return {
    addresses: user.addresses,
    cartItems,
    subtotal
  };
};


export const placeOrderService = async (userId, addressId, paymentMethod) => {
  const user = await User.findById(userId);
  const cart = await Cart.findOne({ userId }).populate("items.productId");

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart empty");
  }

  const addressDoc = user.addresses.id(addressId);
  if (!addressDoc) {
    throw new Error("Address not found");
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const cartItem of cart.items) {
    const product = cartItem.productId;
     
    if(!product|| product.isDeleted || product.isBlocked|| product.isActive === false){
      throw new Error(`${product?.name || "item"} unavailable`);
    }
    let variant = product.variants.find(
      v => v._id.toString() === String(cartItem.variantId)
    );

    if (!variant) {
      throw new Error(`${product.name} variant not found`);
    }

    if (variant.stock < cartItem.quantity) {
      throw new Error(`${product.name} stock not available`);
    }

    const itemTotal = variant.price * cartItem.quantity;
    

    orderItems.push({
      product: product._id,
      productName: product.name,
      productImage: variant.images?.[0] || "",
      variantColor: variant.color,
      quantity: cartItem.quantity,
      price: variant.price,
      total: itemTotal
    });

    totalAmount += itemTotal;
  }

 
  const order = await Order.create({
    user: userId,
    items: orderItems,
    totalAmount,
    shippingAddress: addressDoc,
    paymentMethod,
    paymentStatus: "pending",
    orderStatus: "pending",
    orderId: generateOrderId()
  });

  for (const cartItem of cart.items) {
    const product = cartItem.productId;

    let variant = product.variants.find(
      v => v._id.toString() === String(cartItem.variantId)
    );

    variant.stock -= cartItem.quantity;
    await product.save();
  }

  cart.items = [];
  await cart.save();

  return order;
};
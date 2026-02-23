import Cart from "../../model/cartSchema.js"
import User from "../../model/userSchema.js"
import Order from "../../model/orderSchema.js"



export const createOrder = async(userId,addressId,payment)=>{

    const cart = await Cart.findOne({ userId });    
    const user = await User.findById(userId);
    const address = user.addresses.id(addressId);

    const orderItems = cart.items.map(item => ({
        productId:item.productId,
        quantity:item.quantity
    }));

    const order = await Order.create({
        userId,
        items:orderItems,
        address,
        paymentMethod:payment,
        status:"Placed"
    });
    await cart.deleteOne({userId});
    return order;
}
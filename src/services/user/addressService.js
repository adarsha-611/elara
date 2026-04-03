import User from "../../model/userSchema.js"

export const getUserAddresses = async(userId,page=1,limit=3)=>{
    const user = await User.findById(userId);
    if(!user){
        throw new Error ("User not found");
    }

    const totalAddresses = user.addresses.length;
    const totalPages = Math.ceil(totalAddresses/limit);
    const skip = (page-1) *limit;

    const addresses = user.addresses
        .sort((a,b)=>b._id - a._id)
        .slice(skip,skip+limit);

    return{
        user,
        addresses,
        totalPages,
        currentPage:page
    };
}


export const addUserAddress = async(userId,value)=>{
    const user = await User.findById(userId);
    if(!user){
        throw new Error("User not Found");
    }

    const makeDefault = user.addresses.length ===0||value.isDefault;

    if(makeDefault){
        user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
        ...value,
        isDefault:makeDefault
    });
    user.markModified("addresses");
    await user.save();

    return true;
}


export const editUserAddress = async(userId,addressId,value)=>{
    const user = await User.findById(userId);
    if(!user){
        throw new Error("User not found")
    }
    const address = user.addresses.id(addressId);
    if(!address){
        throw new Error("Address not found");
    }

    Object.assign(address,value);

    if(value.isDefault){
        user.addresses.forEach(addr => addr.isDefault = false);
        address.isDefault = true;
    }else if(address.isDefault && user.addresses.length >1){
        address.isDefault = false;
        user.addressess[0].isDefault = true;
    }

    await user.save();
    return true;
}

export const deleteUserAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const address = user.addresses.id(addressId);
  if (!address) throw new Error("Address not found");

  const wasDefault = address.isDefault;
  address.deleteOne();

  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return true;
};

export const setDefaultAddressService = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const address = user.addresses.id(addressId);
  if (!address) throw new Error("Address not found");

  user.addresses.forEach(addr => {
    addr.isDefault = addr._id.toString() === addressId;
  });

  await user.save();
  return true;
};

export const getSingleAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const address = user.addresses.id(addressId);
  if (!address) throw new Error("Address not found");

  return address;
};
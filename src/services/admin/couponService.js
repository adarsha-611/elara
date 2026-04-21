import Coupon from "../../model/couponSchema.js"

export const getCouponData = async(page=1,limit=5)=>{
    const skip = (page-1)*limit;
    const total = await Coupon.countDocuments();

    const coupons = await Coupon.find()
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)

      return{
        coupons,
        totalPages:Math.ceil(total/limit),
        currentPage:page
      };  
};

export const addCouponService = async(data)=>{
    const existing = await Coupon.findOne({code:data.code});
    if(existing){
        throw new Error("Coupon already exist");
    }

    const coupon = new Coupon({
        code:data.code,
        discountType:data.discountType,
        discountValue:Number(data.discountValue),
        maxDiscount:Number(data.maxDiscount)||0,
        minOrder:Number(data.minOrder)||0,
        usageLimit:Number(data.usageLimit),
        startDate:data.startDate,
        endDate:data.endDate,
        isActive:true
    });

    return await coupon.save();

};


export const updateCouponService = async(id,data)=>{
    const coupon = await Coupon.findById(id);
    if(!coupon){
        throw new Error("Coupon not found");
    }

    coupon.code = data.code,
    coupon.discountType = data.discountType,
    coupon.discountValue = Number(data.discountValue),
    coupon.maxDiscount = Number(data.maxDiscount)||0,
    coupon.minOrder = Number(data.minOrder)||0,
    coupon.usageLimit = Number(data.usageLimit),
    coupon.startDate = data.startDate,
    coupon.endDate = data.endDate;

    return await coupon.save();
}

export const toggleCouponStatusService = async(id)=>{
    const coupon = await Coupon.findById(id);
    if(!coupon){
        throw new Error("Coupon not found");
    }
    coupon.isActive = !coupon.isActive;

    return await coupon.save();
}
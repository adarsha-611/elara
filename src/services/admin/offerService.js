import Offer from "../../model/offerSchema.js";
import Product from "../../model/productSchema.js";
import Category from "../../model/categorySchema.js";

export const getOfferPageData = async(page=1,limit=5)=>{
    const skip = (page-1)*limit;

    const total = await Offer.countDocuments();

    const offers = await Offer.find()
        .populate("productId","name price")
        .populate("categoryId","name")
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)   
     
    return{
        offers,
        totalPages:Math.ceil(total/limit),
        currentPage:page
    }  
}

export const addOfferService = async(data)=>{
    const offer = new Offer({
        name:data.name,
        offerType:data.offerType,
        productId:data.offerType === "product" ? data.productId : null,
        categoryId:data.offerType === "category" ? data.categoryId : null,
        discountType:data.discountType,
        discountValue: Number(data.discountValue),
        startDate:data.startDate,
        endDate:data.endDate,
        isActive: data.isActive === true || data.isActive === "true"
    });

    return await offer.save();
}

export const updateOfferService = async(id,data)=>{
    const offer = await Offer.findById(id);
    if(!offer){
        throw new Error("Offer not found");
    }
    
    offer.name = data.name;
    offer.offerType = data.offerType;
    offer.productId = data.offerType === "product" ? data.productId : null;
    offer.categoryId = data.offerType === "category" ? data.categoryId : null;
    offer.discountType = data.discountType;
    offer.discountValue = Number(data.discountValue);
    offer.startDate = data.startDate;
    offer.endDate = data.endDate;
    offer.isActive = data.isActive === true || data.isActive === "true";

    return await offer.save();
}

export const toggleOfferStatus = async(id)=>{
    const offer = await Offer.findById(id);
    if(!offer){
        throw new Error("Offer not found");
    }
    
    offer.isActive = !offer.isActive;
    return await offer.save();
}
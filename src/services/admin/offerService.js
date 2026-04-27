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
    console.log("ADD OFFER SERVICE CALLED");
console.log("DATA:", data);
console.log("Discount:", data.discountValue);
    if(data.offerType === "product" && data.discountType === "fixed"){
        const product = await Product.findById(data.productId);
        console.log("SERVICE HIT", data);
        
        console.log("PRODUCT:", product);
console.log("VARIANT PRICE:", product?.variants?.[0]?.price);
        if(!product){
            throw new Error("Product not found");
        }

        const basePrice = product.variants?.[0]?.price;

if(!basePrice){
    throw new Error("Product price not found");
}

if(data.discountValue >= basePrice){
        console.log("VALIDATION TRIGGERED ❌");
    throw new Error("Offer amount cannot be greater than or equal to product price");
}
    }
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

    if(data.offerType === "product" && data.discountType === "fixed"){
        const product = await Product.findById(data.productId);

        if(!product){
            throw new Error("Product not found");
        }

        const basePrice = product.variants?.[0]?.price;

        if(!basePrice){
            throw new Error("Product price not found");
        }

        if(data.discountValue >= basePrice){
            throw new Error("Offer amount cannot be greater than or equal to product price");
        }
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
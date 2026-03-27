import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
    color: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        default: 0
    },
    images: [
        {
            type: String
        }
    ]
}); 

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    category: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

    variants: [variantSchema],  

    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

export default Product;




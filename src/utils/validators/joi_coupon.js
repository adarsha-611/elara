import Joi from "joi";

export const validateCoupon = (data) => {
    const schema = Joi.object({
        code: Joi.string().trim().uppercase().required()
            .messages({ 'string.empty': 'Coupon code is required' }),

        discountType: Joi.string()
            .valid("percentage", "fixed")
            .required(),

        discountValue: Joi.number().min(1).required()
            .messages({ 
                'number.min': 'Discount value must be at least 1',
                'number.base': 'Discount value is required'
            }),

        maxDiscount: Joi.alternatives()
            .try(Joi.number().min(0), Joi.string().allow('').default(0))
            .default(0),

        minOrder: Joi.alternatives()
            .try(Joi.number().min(0), Joi.string().allow('').default(0))
            .default(0),

        usageLimit: Joi.number().min(1).required()
            .messages({ 'number.base': 'Usage limit is required' }),

        startDate: Joi.date().required()
            .messages({ 'date.base': 'Start date is required' }),

        endDate: Joi.date().greater(Joi.ref("startDate")).required()
            .messages({ 
                'date.greater': 'End date must be after start date',
                'date.base': 'End date is required'
            }),

        editId: Joi.string().allow('').optional()  
    })
    .custom((value, helpers) => {
        const { discountType, discountValue, minOrder, maxDiscount } = value;

        const parsedMinOrder = Number(minOrder) || 0;
        const parsedDiscountValue = Number(discountValue) || 0;
        const parsedMaxDiscount = Number(maxDiscount) || 0;

        if (discountType === 'percentage') {
            // Rule 1: percentage cannot exceed 100
            if (parsedDiscountValue > 100) {
                return helpers.error('object.percentageTooHigh');
            }

            // Rule 2: maxDiscount (the cap) must be less than minOrder
            // e.g. if minOrder=400 and maxDiscount=1000, customer gets more off than they spent
            if (parsedMinOrder > 0 && parsedMaxDiscount >= parsedMinOrder) {
                return helpers.error('object.maxDiscountTooHigh');
            }
        }

        if (discountType === 'fixed') {
            // Rule 3: fixed discount must be less than minOrder
            if (parsedMinOrder > 0 && parsedDiscountValue >= parsedMinOrder) {
                return helpers.error('object.discountTooHigh');
            }
        }

        return value;
    })
    .messages({
        'object.percentageTooHigh':  'Percentage discount cannot exceed 100%',
        'object.maxDiscountTooHigh': 'Max discount amount must be less than the minimum order amount',
        'object.discountTooHigh':    'Discount value must be less than the minimum purchase amount'
    });

    return schema.validate(data, { abortEarly: false });
};
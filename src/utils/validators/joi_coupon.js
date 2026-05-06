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
    });

    return schema.validate(data, { abortEarly: false });
};
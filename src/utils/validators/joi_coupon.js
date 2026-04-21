import Joi from "joi";

export const validateCoupon = (data) => {
    const schema = Joi.object({
        code: Joi.string().required(),

        discountType: Joi.string()
            .valid("percentage", "fixed")
            .required(),

        discountValue: Joi.number().min(1).required(),

        maxDiscount: Joi.number().allow(0),

        minOrder: Joi.number().allow(0),

        usageLimit: Joi.number().min(1).required(),

        startDate: Joi.date().required(),

        endDate: Joi.date().greater(Joi.ref("startDate")).required()
    });

    return schema.validate(data, { 
        abortEarly: false,
        allowUnknown: true 
     });
};
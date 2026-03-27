import Joi from "joi";

export function validateAddress(data) {

  const schema = Joi.object({

    addressId: Joi.string().allow("").optional(),

    fullName: Joi.string().trim().min(3).required().messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 3 characters"
    }),

    phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
      "string.pattern.base": "Phone number must be 10 digits"
    }),

    street: Joi.string().trim().min(5).required().messages({
      "string.empty": "Street address is required"
    }),

    city: Joi.string().trim().min(2).required(),

    state: Joi.string().trim().min(2).required(),

    pincode: Joi.string().pattern(/^[0-9]{6}$/).required().messages({
      "string.pattern.base": "Pincode must be 6 digits"
    }),

    addressType: Joi.string().valid("Home", "Work").required(),

    isDefault: Joi.boolean().optional()

  }).unknown(true);   // ⭐ VERY IMPORTANT

  return schema.validate(data, { abortEarly: false });
}
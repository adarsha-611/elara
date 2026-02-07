import Joi from "joi";

export const validateAddress = (data) => {
  const schema = Joi.object({
    fullName: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
        "string.empty": "Full Name is required",
        "string.min": "Full Name must be at least 3 characters"
      }),

    phoneNumber: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone number must be 10 digits",
        "string.empty": "Phone number is required"
      }),

    street: Joi.string()
      .min(5)
      .max(150)
      .required()
      .messages({
        "string.empty": "Street address is required"
      }),

    city: Joi.string()
      .min(2)
      .required()
      .messages({
        "string.empty": "City is required"
      }),

    state: Joi.string()
      .min(2)
      .required()
      .messages({
        "string.empty": "State is required"
      }),

    pincode: Joi.string()
      .pattern(/^[0-9]{6}$/)
      .required()
      .messages({
        "string.pattern.base": "Pincode must be 6 digits",
        "string.empty": "Pincode is required"
      }),

    addressType: Joi.string()
      .valid("Home", "Work")
      .required(),

    isDefault: Joi.boolean().optional(),

    addressId: Joi.string()
    .allow('')
    .optional()
  });

  return schema.validate(data, { abortEarly: false });
};

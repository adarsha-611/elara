import Joi from "joi";

export function validateAddress(data) {
  const schema = Joi.object({
    addressId: Joi.string().allow("").optional(),
    paymentStatus: Joi.string().allow("").optional(),

    fullName: Joi.string()
      .trim()
      .min(3)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)  
      .required()
      .messages({
        "string.empty": "Full name is required",
        "string.min": "Full name must be at least 3 characters",
        "string.max": "Full name cannot exceed 50 characters",
        "string.pattern.base": "Full name can only contain letters and spaces",
        "any.required": "Full name is required"
      }),

   phoneNumber: Joi.string()
  .pattern(/^[6-9]\d{9}$/)
  .custom((value, helpers) => {
    if (/^(\d)\1{9}$/.test(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  })
  .required()
  .messages({
    "string.pattern.base": "Enter a valid 10-digit phone number",
    "any.invalid": "Invalid phone number",
    "string.empty": "Phone number is required"
  }),

    street: Joi.string()
      .trim()
      .min(5)
      .max(100)
      .required()
      .messages({
        "string.empty": "Street address is required",
        "string.min": "Street address must be at least 5 characters",
        "string.max": "Street address cannot exceed 100 characters",
        "any.required": "Street address is required"
      }),

    city: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s.'-]+$/) 
      .required()
      .messages({
        "string.empty": "City/Town is required",
        "string.min": "City must be at least 2 characters",
        "string.max": "City cannot exceed 50 characters",
        "string.pattern.base": "City can only contain letters and spaces",
        "any.required": "City is required"
      }),

    state: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s.'-]+$/)
      .required()
      .messages({
        "string.empty": "State is required",
        "string.min": "State must be at least 2 characters",
        "string.max": "State cannot exceed 50 characters",
        "string.pattern.base": "State can only contain letters and spaces",
        "any.required": "State is required"
      }),

    pincode: Joi.string()
      .pattern(/^[1-9][0-9]{5}$/)
      .custom((value, helpers) => {
       if (/^(\d)\1{5}$/.test(value)) {
          return helpers.error('any.invalid');
      }
      return value;
    })
    .required()
    .messages({
     "string.pattern.base": "Enter valid 6-digit pincode",
     "any.invalid": "Invalid pincode"
    }),


    addressType: Joi.string()
      .valid("Home", "Work")
      .required()
      .messages({
        "any.only": "Address type must be either Home or Work",
        "any.required": "Address type is required"
      }),

    isDefault: Joi.boolean().optional()

  });

  return schema.validate(data, { abortEarly: false });
}
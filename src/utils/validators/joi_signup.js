import Joi from "joi";

export const signupSchema = Joi.object({
 fullName: Joi.string()
  .trim()  
  .min(3)
  .max(50)
  .pattern(/^[A-Za-z\s]+$/)
  .required()
  .messages({
    "string.empty": "Full name is required",
    "string.min": "Full name must be at least 3 characters",
    "string.max": "Full name cannot exceed 50 characters",
    "string.pattern.base": "Full name must contain only letters and spaces",
    "any.required": "Full name is required"
  }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required"
    }),

password: Joi.string()
  .trim()
  .min(6)
  .pattern(/^\S+$/)
  .required()
  .messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
    "string.pattern.base": "Password cannot contain spaces",
    "any.required": "Password is required"
  }),

 confirmPassword: Joi.string()
  .trim()
  .valid(Joi.ref("password"))
  .required()
  .messages({
    "any.only": "Passwords do not match",
    "string.empty": "Please confirm your password",
    "any.required": "Please confirm your password"
  }),

  referralCode: Joi.string()
    .optional()
    .allow("")
});

export const validateSignup = (data) => {
  return signupSchema.validate(data, { abortEarly: false });
};
import Joi from "joi";

export const validateProduct = (data, files = [], existingImages = []) => {

  const variantItemSchema = Joi.object({
    color: Joi.string().trim()
  .pattern(/[a-zA-Z]/)  
  .required()
  .messages({
    "string.empty": "Variant color is required",
    "any.required": "Variant color is required",
    "string.pattern.base": "Color must contain letters, not just numbers"
  }),
   price: Joi.number().positive().max(999999).required().messages({
    "number.base": "Price must be a valid number",
    "number.positive": "Price must be greater than 0",
    "number.max": "Price cannot exceed ₹9,99,999",
    "any.required": "Price is required"
}),
stock: Joi.number().integer().min(0).max(9999).required().messages({
    "number.base": "Stock must be a valid number",
    "number.min": "Stock cannot be negative",
    "number.max": "Stock cannot exceed 9999",
    "any.required": "Stock is required"
}),
    _id: Joi.string().optional().allow(''),
    existingImages: Joi.any().optional()
  });

  const schema = Joi.object({
   name: Joi.string().trim().min(3).max(100)
  .pattern(/[a-zA-Z]/)  
  .required()
  .messages({
    "string.empty": "Product name is required",
    "string.min": "Product name should have at least 3 characters",
    "string.max": "Product name should have at most 100 characters",
    "string.pattern.base": "Product name must contain letters, not just numbers"
  }),

description: Joi.string().trim().min(10).max(1000)
  .pattern(/[a-zA-Z]/)  
  .required()
  .messages({
    "string.empty": "Description is required",
    "string.min": "Description should be at least 10 characters",
    "string.max": "Description should be at most 1000 characters",
    "string.pattern.base": "Description must contain letters, not just numbers"
  }),
    category: Joi.string().required().messages({
      "string.empty": "Category is required",
      "any.required": "Category is required"
    }),
    variants: Joi.array().items(variantItemSchema).min(1).required().messages({
      "any.required": "At least one variant is required",
      "array.min": "At least one variant is required"
    })
  });

  if (Array.isArray(data.variants)) {
    data.variants = data.variants.map(v => ({
      ...v,
      price: v.price === '' ? undefined : v.price,
      stock: v.stock === '' ? undefined : v.stock,
    }));
  }

  const { error } = schema.validate(data, {
    abortEarly: false,
    convert: true 
  });

  const errors = [];

  if (error) {
    error.details.forEach(err => {
      if (err.path.length >= 2 && err.path[0] === 'variants') {
        const variantIndex = err.path[1];
        const fieldName = err.path[2];
        if (fieldName) {
          errors.push({
            field: `variants[${variantIndex}][${fieldName}]`,
            message: err.message
          });
        } else {
          errors.push({ field: null, message: err.message });
        }
      } else {
        errors.push({
          field: err.path[0] || null,
          message: err.message
        });
      }
    });
  }

  if (Array.isArray(data.variants)) {
    const colors = data.variants
      .map(v => v.color?.trim().toLowerCase())
      .filter(Boolean);
    if (colors.length !== new Set(colors).size) {
      errors.push({ field: null, message: "Each variant must have a unique color" });
    }
  }

  if (existingImages.length === 0 && files.length < 3) {
    errors.push({ field: null, message: "At least 3 product images are required" });
  }

  if (errors.length > 0) {
    return { error: errors };
  }

  return { value: data };
};
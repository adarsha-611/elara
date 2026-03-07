import Joi from "joi";

export const validateProduct = (data, files = [], existingImages = []) => {

 const variantItemSchema = Joi.object({
  color: Joi.string().required().messages({
    "string.empty": "Variant color is required"
  }),
  price: Joi.number().positive().required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be greater than 0"
  }),
  stock: Joi.number().integer().min(0).required().messages({
    "number.base": "Stock must be a number",
    "number.min": "Stock cannot be negative"
  }),
  // metalType:Joi.string().required().messages({
  //   "string.empty":"Variant metal type is required"
  // })
}).unknown(true);


  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      "string.empty": "Product name is required",
      "string.min": "Product name should have at least 3 characters",
      "string.max": "Product name should have at most 100 characters"
    }),

    description: Joi.string().min(5).max(1000).required().messages({
      "string.empty": "Description is required",
      "string.min": "Description should be at least 5 characters",
      "string.max": "Description should be at most 1000 characters"
    }),

    category: Joi.string().required().messages({
      "string.empty": "Category is required"
    }),


    variants: Joi.alternatives().try(

      Joi.object().pattern(Joi.string(), variantItemSchema),

 
      Joi.array().items(variantItemSchema)

    ).required().messages({
      "any.required": "Variants are required"
    })
  });

  const { error } = schema.validate(data, { abortEarly: false });

 let imagesError = null;
  if (existingImages.length === 0 && files.length < 3) {
  imagesError = "At least 3 product images are required";
}


  if (error || imagesError) {
    const errors = error ? error.details.map(err => err.message) : [];
    if (imagesError) errors.push(imagesError);
    return { error: errors.join(", ") };
  }

  return { value: data };
};

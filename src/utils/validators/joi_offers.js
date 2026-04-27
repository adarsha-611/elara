import Joi from "joi";
export const validateOffer = (data) => {
  const schema = Joi.object({
    name: Joi.string().trim().required(),

    offerType: Joi.string()
      .valid("product", "category")
      .required(),

    productId: Joi.when("offerType", {
      is: "product",
      then: Joi.string().required().messages({
        "any.required": "Please select a product"
      }),
      otherwise: Joi.allow(null, "")
    }),

    categoryId: Joi.when("offerType", {
      is: "category",
      then: Joi.string().required().messages({
        "any.required": "Please select a category"
      }),
      otherwise: Joi.allow(null, "")
    }),

    discountType: Joi.string()
      .valid("percentage", "fixed")
      .required(),

    discountValue: Joi.number()
      .greater(0)
      .required()
      .when("discountType", {
        is: "percentage",
        then: Joi.number().max(100).messages({
          "number.max": "Percentage cannot exceed 100%"
        })
      })
      .messages({
        "number.base": "Discount must be a number",
        "number.greater": "Discount must be greater than 0",
        "any.required": "Discount value is required"
      }),

    startDate: Joi.date().required().messages({
      "any.required": "Start date is required"
    }),

    endDate: Joi.date()
      .greater(Joi.ref("startDate"))
      .required()
      .messages({
        "date.greater": "End date must be after start date",
        "any.required": "End date is required"
      }),

    isActive: Joi.boolean()
  });

  return schema.validate(data, { abortEarly: false });
};
import Joi from "joi";

export const validateOffer = (data) => {
  const schema = Joi.object({
    name: Joi.string().trim().required(),

    offerType: Joi.string()
      .valid("product", "category")
      .required(),

    productId: Joi.when("offerType", {
      is: "product",
      then: Joi.string().required(),
      otherwise: Joi.allow(null, "")
    }),

    categoryId: Joi.when("offerType", {
      is: "category",
      then: Joi.string().required(),
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
        then: Joi.number().max(100)
      }),

    startDate: Joi.date().required(),

    endDate: Joi.date()
      .greater(Joi.ref("startDate"))
      .required(),

    isActive: Joi.boolean()
  });

  return schema.validate(data, { abortEarly: false });
};
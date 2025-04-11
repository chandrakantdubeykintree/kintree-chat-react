import { z } from "zod";

export const verifyUserSchemas = {
  email: z.object({
    email: z.string().email("Please enter a valid email address"),
  }),

  phone_no: z.object({
    phone_no: z
      .string()
      .regex(/^\+[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  }),

  otp: z.object({
    otp: z
      .string()
      .refine(
        (val) => val.length === 4 || val.length === 6,
        "OTP must be 4 or 6 digits"
      )
      .refine((val) => /^\d+$/.test(val), "OTP must contain only numbers"),
  }),
};

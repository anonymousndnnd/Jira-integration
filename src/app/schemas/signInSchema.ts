import {z} from "zod";

export const signInSchema=z.object({
  email: z.email(),
  password:z.string()
            .min(8, { message: "Password must be at least 8 characters long" })
            .max(100, { message: "Password too long" }),
})
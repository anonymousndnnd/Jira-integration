import z from "zod";

export const signUpSchema=z.object({
  username:z.string().min(6,"Username must be atleast 6 charcters").max(20,"Usrename must be no more than 20 characters").regex(/^[a-zA-Z][a-zA-Z0-9_]+$/,"Username must not contain an special characters"),
  email:z.email(),
  password:z.string().min(8,{message:"password must be at least 8 characters"}),
  role: z.enum(["ORGANIZATION", "EMPLOYEE"])
    .refine((val) => val !== undefined, { message: "Role is required" }),
  organizationId: z.string().optional(),
})
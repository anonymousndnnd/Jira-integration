'use client'
/* eslint-disable */
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// validation schema
const signUpSchema = z.object({
  username: z.string().min(2, "Username is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ORGANIZATION", "EMPLOYEE"]),
  organizationId: z.string().optional()
}).refine(
  (data) => data.role !== "EMPLOYEE" || !!data.organizationId,
  {
    message: "Organization is required for employees",
    path: ["organizationId"]
  }
);

export default function SignUp() {
  const supabase = createClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<{ id: string; username: string }[]>([]);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      organizationId: ""
    }
  });

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await axios.get("/api/getAllOrganizations");
        setOrganizations(res.data.organizations);
      } catch (error) {
        console.error("Error fetching orgs", error);
      }
    };
    fetchOrgs();
  }, []);

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    try {
      const { data: supabaseData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { role: data.role } // store role in user metadata
        }
      });
      if (error) throw error;

      const supabaseId = supabaseData.user?.id;

      await axios.post("/api/syncData", { ...data, supabaseId });
      toast.success("Signup successful!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Signup failed!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-10 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Create Your Account
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Sign up to manage your organization or employee profile seamlessly.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <Input
                    {...field}
                    className="bg-gradient-to-r from-white to-gray-50 border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-100 rounded-xl transition-all"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    {...field}
                    className="bg-gradient-to-r from-white to-gray-50 border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-100 rounded-xl transition-all"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    {...field}
                    className="bg-gradient-to-r from-white to-gray-50 border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-100 rounded-xl transition-all"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      if (val === "ORGANIZATION") form.setValue("organizationId", "");
                    }}
                  >
                    <SelectTrigger className="bg-white border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-100 rounded-xl transition-all">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORGANIZATION">Organization</SelectItem>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Organization Selection */}
            {form.watch("role") === "EMPLOYEE" && (
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Organization</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="bg-white border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-100 rounded-xl transition-all">
                        <SelectValue placeholder="Choose organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl flex justify-center items-center transition-all"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Sign Up"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

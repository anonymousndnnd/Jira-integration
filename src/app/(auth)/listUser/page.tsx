'use client'
/* eslint-disable */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { createClient } from "@/app/utils/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
const completeUserSchema = z.object({
  username: z.string().min(2, "Username is required"),
  role: z.enum(["ORGANIZATION", "EMPLOYEE"]),
  organizationId: z.string().optional()
}).refine(
  (data) => data.role !== "EMPLOYEE" || !!data.organizationId,
  {
    message: "Organization is required for employees",
    path: ["organizationId"]
  }
);

export default function ListUser() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [supabaseId,setSupabaseId]= useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<{ id: string; username: string }[]>([]);

  const form = useForm<z.infer<typeof completeUserSchema>>({
    resolver: zodResolver(completeUserSchema),
    defaultValues: {
      username: "",
      role: "EMPLOYEE",
      organizationId: ""
    }
  });

  // fetch user email from supabase client
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user?.email || !user?.id) {
          toast.error("Failed to get user email");
          router.push("/sign-in");
          return;
        }
        setSupabaseId(user.id);
        setEmail(user.email);
      } catch (err) {
        console.error("Error fetching user:", err);
        toast.error("Something went wrong");
        router.push("/sign-in");
      }
    };

    fetchUser();
  }, [router, supabase]);

  // fetch organizations
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await axios.get("/api/getAllOrganizations");
        setOrganizations(res.data.organizations);
      } catch (err) {
        console.error("Error fetching organizations", err);
      }
    };
    fetchOrgs();
  }, []);

  const onSubmit = async (data: z.infer<typeof completeUserSchema>) => {
    if (!email) return;

    setIsSubmitting(true);
    try {
      await axios.post("/api/syncData", {
        supabaseId,
        email,
        ...data
      });

      toast.success("User registered successfully!");

      if (data.role === "ORGANIZATION") {
        router.push("/dashboard/org");
      } else {
        router.push("/dashboard/employee");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to register user");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!email) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-10 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Complete Your Registration
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          We could not find your account. Please provide additional details to complete registration.
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl flex justify-center items-center transition-all"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Complete Registration"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

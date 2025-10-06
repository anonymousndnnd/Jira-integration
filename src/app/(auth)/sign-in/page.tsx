'use client'
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { signInSchema } from "@/app/schemas/signInSchema";

export default function SignInPage() {
  const supabase = createClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onChange",
    reValidateMode: "onChange"
  });

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    setIsSubmitting(true);
    try {
      const { data: supabaseData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;

      toast.success("SignIn successful!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "SignIn failed!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 Google Sign-In handler
  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/checkGoogleSignIn`, // redirect after success
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Google Sign-In failed!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-10 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Welcome Back
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Log in to access your account and manage your profile.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl flex justify-center items-center transition-all"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Sign In"}
            </Button>
          </form>
        </Form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-500 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Google Login Button */}
        <Button
          onClick={handleGoogleSignIn}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold py-3 rounded-xl flex justify-center items-center gap-2 transition-all"
        >
          <img src="/google-icon.svg" alt="Google" className="h-5 w-5" />
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}

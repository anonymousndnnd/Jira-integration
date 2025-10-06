"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import axios from "axios";
import { toast } from "sonner";

export default function AuthCallback() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log("user is:",user)
        if (error || !user) {
          toast.error("Authentication failed");
          router.push("/sign-in");
          return;
        }

        const email = user.email;

        const res = await axios.get("/api/verifyUser");
        const existingUser = res.data?.user;

        if (existingUser) {
          if (existingUser.role === "organization") {
            router.replace("/dashboard/org");
          } else {
            router.replace("/dashboard/employee");
          }
        } 
      } catch (err: any) {

        if (err.response?.status === 404) {
          // User not found → redirect to form to store email/name/role
          console.log("error is right")
          router.replace(`/listUser`);
          console.log("success ho gaya")
        } else {
          toast.error("Something went wrong");
          router.push("/sign-in");
        }
      }
    };

    handleRedirect();
  }, [router, supabase]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">Completing sign-in...</p>
    </div>
  );
}

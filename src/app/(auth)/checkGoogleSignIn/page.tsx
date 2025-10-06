"use client";
/* eslint-disable */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import axios from "axios";
import { toast } from "sonner";

// generating prisma 

export default function AuthCallback() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
  const handleRedirect = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        toast.error("Authentication failed");
        router.push("/sign-in");
        return;
      }

      const token = session.access_token;

      const res = await axios.get("/api/verifyUser", {
        headers: { Authorization: `Bearer ${token}` },
      });

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
        router.replace(`/listUser`);
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

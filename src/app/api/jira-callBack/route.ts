/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@/app/utils/supabase/server";
import { PrismaClient } from "@prisma/client";

const prisma=new PrismaClient();
// regenerating .next
// fixing issues
// final fix applied

export async function GET(req: NextRequest) {
  try {
    const supabase =await createClient();
    const {data: { user },error} = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId=user?.id

    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

    const tokenResponse = await axios.post(
      "https://auth.atlassian.com/oauth/token",
      {
        grant_type: "authorization_code",
        client_id: process.env.JIRA_CLIENT_ID,
        client_secret: process.env.JIRA_CLIENT_SECRET,
        code,
        redirect_uri: process.env.ATLASSIAN_REDIRECT_URL,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    console.log("Access token is:",access_token)

    await prisma.organizationJiraConnection.create({
      data: {
        organizationId: orgId,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      },
    });

    return NextResponse.redirect("/organization/dashboard");
  } catch (err: any) {
    console.error("Jira OAuth error:", err.response?.data || err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@/app/utils/supabase/server";
import { PrismaClient } from "@prisma/client";

const prisma=new PrismaClient();


export async function GET(req: NextRequest) {
  try {
    const supabase =await createClient();
    const {data: { user },error} = await supabase.auth.getUser();

    if(error || !user){
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }
    // console.log("useris",user);
    const email=user.email
    const empId=user.id

    const employee = await prisma.employee.findUnique({
      where: { email: user.email }, 
    });

    if (!employee) {
      return NextResponse.json({ error: "Forbidden: Only employees allowed" }, { status: 403 });
    }

    const creds = await prisma.employeeJiraConnection.findUnique({
      where: { employeeId: user.id },
    });

  if (!creds) return NextResponse.json({ error: "No Jira credentials found" }, { status: 400 });

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });


    const tokenResponse = await axios.post(
      "https://auth.atlassian.com/oauth/token",
      {
        grant_type: "authorization_code",
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        code,
        redirect_uri: process.env.EMPLOYEE_REDIRECT_URL,
      },
      { headers: { "Content-Type": "application/json" } }
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    console.log("Access token is:",access_token)
    
    await prisma.employeeJiraConnection.update({
      where: { employeeId: empId },
      data: {
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      },
    });
    return NextResponse.redirect("http://localhost:3000/dashboard/organization");
  } catch (err: any) {
      if (err.response) {
    console.error("Jira OAuth error:", {
      status: err.response.status,
      data: err.response.data,
      config: {
        redirect_uri: process.env.ATLASSIAN_REDIRECT_URL,
        client_id: process.env.JIRA_CLIENT_ID,
      },
    });
    return NextResponse.json({ error: err.response.data }, { status: err.response.status });
  } else {
    console.error("General error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  }
}
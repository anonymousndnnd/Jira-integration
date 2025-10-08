import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@/app/utils/supabase/server";
import axios from "axios";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const supabase =await createClient();
    const {data: { user },error} = await supabase.auth.getUser();
    // console.log(user)
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employeeJiraConnection.findUnique({
      where: { employeeId: user.id },
    });

    if (!employee) {
      return NextResponse.json({success:false,message:"Employee not found"},{status:400});
    }

    if (!employee.accessToken || !employee.refreshToken || !employee.tokenExpiresAt) {
      return NextResponse.json({ success: false, message: "Incomplete Jira credentials" }, { status: 400 });
    }
    let accessToken = employee.accessToken;

    // Check if token is expired
    const now = new Date();
    if (employee.tokenExpiresAt <= now) {
      const refreshResponse = await axios.post(
        "https://auth.atlassian.com/oauth/token",
        {
          grant_type: "refresh_token",
          client_id: employee.clientId,
          client_secret: employee.clientSecret,
          refresh_token: employee.refreshToken,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      const { access_token, refresh_token, expires_in } = refreshResponse.data;
      accessToken = access_token;

      await prisma.employeeJiraConnection.update({
        where: { employeeId: user.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        },
      });
    } 
    const cloudResponse = await axios.get(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
    );
    console.log("Cloud id is:",cloudResponse);
    const cloudData = cloudResponse.data[0]; 
    const cloudId = cloudData?.id;

    if (!cloudId) {
      return NextResponse.json({ success: false, message: "Cloud ID not found" }, { status: 404 });
    }
    await prisma.employeeJiraConnection.update({
      where: { employeeId: user.id },
      data: { cloudId },
    });

    return NextResponse.json({
      success: true,
      cloudId,
      message: "Cloud ID fetched and saved successfully",
    },{status:200});
    
  }catch (err: any) {
    console.error("Error fetching Cloud ID:", err.response?.data || err.message);
    return NextResponse.json({ success: false, message: err.response?.data || err.message }, { status: 500 });
  }
}
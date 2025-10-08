import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@/app/utils/supabase/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organization = await prisma.organizationJiraConnection.findUnique({
      where: { organizationId: user.id },
    });

    if (!organization) {
      return NextResponse.json({
        status: "NO_CONNECTION",
        message: "No Jira connection found for this organization.",
        hasConnection: false,
        hasCloudId: false,
      });
    }
    const hasAccessToken = !!organization.accessToken;
    const hasCloudId = hasAccessToken && !!organization.cloudId;

    if (hasAccessToken && !hasCloudId) {
      return NextResponse.json({
        status: "CONNECTED_NO_CLOUD",
        message: "Jira connected but Cloud ID not fetched yet.",
        hasConnection: true,
        hasCloudId: false,
      });
    }

    if (hasAccessToken && hasCloudId) {
      return NextResponse.json({
        status: "FULLY_CONNECTED",
        message: "Jira connection is fully set up.",
        hasConnection: true,
        hasCloudId: true,
      });
    }

    return NextResponse.json({
      status: "PARTIAL",
      message: "Partial Jira data found, please reconnect.",
      hasConnection: true,
      hasCloudId: false,
    });

  } catch (err:any) {
      console.error("General error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
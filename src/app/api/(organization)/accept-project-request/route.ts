import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@/app/utils/supabase/server";
import { PrismaClient } from "@prisma/client";


const prisma=new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const supabase =await createClient();
    const {data: { user },error} = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organization = await prisma.organizationJiraConnection.findUnique({
      where: { organizationId: user.id },
    });
    console.log("Organization id",organization)
    if (!organization) {
      return NextResponse.json({success:false,message:"Employee not found"},{status:400});
    }

   const body = await req.json();
  console.log("Request body:", body);
  const { requestId, employeeId } = body;
    if (!requestId || !employeeId) {
      return NextResponse.json({ success: false, message: "Missing projectId or employeeId" }, { status: 400 });
    }
    const projectId=requestId
    const request = await prisma.projectAccessRequest.findFirst({
      where: {
        projectId,
        employeeId,
        status: "PENDING",
      }
    });
    if (!request) {
      return NextResponse.json({ success: false, message: "Pending request not found for this project" }, { status: 404 });
    }
    const updatedRequest = await prisma.projectAccessRequest.update({
      where: { id: request.id },
      data: { status: "ACCEPTED" },
    });
    return NextResponse.json({ success: true, updateRequest: updatedRequest });

  } catch (err:any) {
      console.error("Error fetching project requests:", err);
      return NextResponse.json(
        { success: false, message: "Server error", error: err.message },
        { status: 500 }
      );
  }
}
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@/app/utils/supabase/server";
import { PrismaClient } from "@prisma/client";


const prisma=new PrismaClient();

export async function GET(req: NextRequest) {
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
      
    const requests = await prisma.projectAccessRequest.findMany({
      where: {
        //Do review this part as for multiple organization it will create problem 

        // organizationProject: {
        //   organizationId: organization.organizationId,
        // },
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        employee: {
          select: {
            supabaseId: true,
            username: true,
            email: true,
          },
        },
        organizationProject: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
      }
    })
    console.log("Pending Requests are :",requests)
    return NextResponse.json({ success: true, requests });
  } catch (err: any) {
    console.error("Error fetching project requests:", err);
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
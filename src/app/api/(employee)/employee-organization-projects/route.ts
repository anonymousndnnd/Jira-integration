import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@/app/utils/supabase/server";
import { PrismaClient } from "@prisma/client";


const prisma=new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the employee record
    const employee = await prisma.employee.findUnique({
      where: { supabaseId: user.id },
    });

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 400 });
    }
    console.log("Employ name:",employee.username)
    console.log("Employ organozationId:",employee.organizationId)
    const organizationProjects = await prisma.organizationProject.findMany({
      where: { organizationId: employee.organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        projectId: true,
        key: true,
        name: true,
        description: true,
        avatarUrl: true,
        projectTypeKey: true,
        leadAccountId: true,
        id:true,
        projectAccessRequests: {
          where: { employeeId: employee.id },
          select: { status: true },
        },
      },
    });

    const projectsWithStatus = organizationProjects.map((proj) => ({
      ...proj,
      accessStatus:
        proj.projectAccessRequests.length > 0
          ? proj.projectAccessRequests[0].status.toLowerCase()
          : "idle",
    }));

    // console.log("Organization Projects are:",organizationProjects)
    return NextResponse.json({
      success: true,
      projects: projectsWithStatus,

    });

  } catch (err: any) {
    console.error("Error fetching organization projects:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
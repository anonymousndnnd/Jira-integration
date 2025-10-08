import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { PrismaClient } from "@prisma/client";


const prisma=new PrismaClient();

export async function POST(req: NextRequest) {
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
    const { id } =await req.json();

    const newRequest = await prisma.projectAccessRequest.create({
      data: {
        employeeId: employee.id,
        projectId:id,
        status: "PENDING",
      },
    });
    return NextResponse.json({
      success: true,
      message: "Access request sent successfully.",
      updateRequest: newRequest,
    });

  } catch (error) {
    console.error("Error requesting project access:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error },
      { status: 500 }
    );
  }
}
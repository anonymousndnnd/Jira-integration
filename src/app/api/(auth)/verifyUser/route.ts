import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";

const prisma=new PrismaClient();

export async function GET(request:NextRequest){
  try {
    const supabase =await createClient();
    const {data: { user },error} = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const email =user.email;
    console.log("Email is:",email)
    if (!email) {
      return NextResponse.json({ error: "Email missing in session" }, { status: 400 });
    }
    console.log("Part1")
    const employee = await prisma.employee.findUnique({ where: { email } });
    if (employee) {
      return NextResponse.json({
        message: "Employee found",
        role: "EMPLOYEE",
        user: employee,
      });
    }
    console.log("Part2")
    const organization = await prisma.organization.findUnique({ where: { email } });
    if (organization) {
      return NextResponse.json({
        message: "Organization found",
        role: "ORGANIZATION",
        user: organization,
      });
    }
    console.log("Part3")
     return NextResponse.json(
      { error: "User not found in Employee or Organization" },
      { status: 404 }
    );
  } catch (error) {
      console.error("User Not Foundr",error)
      return NextResponse.json({
        success:false,
        message:"Error registering user"
      },{
        status:500
      })
  }
}
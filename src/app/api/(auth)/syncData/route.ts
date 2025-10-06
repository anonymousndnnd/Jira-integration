/* eslint-disable */
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma=new PrismaClient()

export async function POST(request:NextRequest) {
  try {
    const { supabaseId, email, username, role, organizationId } = await request.json();
    if (role === "ORGANIZATION") {
      const org = await prisma.organization.create({
        data: {
          email,
          username,
          supabaseId,
          role: "ORGANIZATION",
        },
      });
      return NextResponse.json({ message: "Organization created", org });
    }
    if (role === "EMPLOYEE") {
      if (!organizationId) {
        return NextResponse.json(
          { error: "organizationId is required for Customer" },
          { status: 400 }
        );
      }

      // Create employee/customer
      const employee = await prisma.employee.create({
        data: {
          email,
          username,
          supabaseId,
          role: "EMPLOYEE",
          organizationId,
        },
      });
      return NextResponse.json({ message: "Employee created", employee });
    }
  } catch (error) {
      console.error("Error registering user",error)
      return NextResponse.json({
        success:false,
        message:"Error registering user"
      },{
        status:500
      })
  }
}
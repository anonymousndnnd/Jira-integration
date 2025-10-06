/* eslint-disable */
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma=new PrismaClient();

export async function GET(request:NextRequest){
  try {
    const organizations = await prisma.organization.findMany({
      select: { id: true, username: true },
    });
    return NextResponse.json({ success: true, organizations });
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
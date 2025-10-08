import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const supabase =await createClient();
    const {data: { user },error} = await supabase.auth.getUser();

    if (!user || error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { clientId, clientSecret } = await req.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Client ID and Secret required" }, { status: 400 });
    }
    await prisma.employeeJiraConnection.upsert({
      where: { employeeId: user.id },
      update: { clientId, clientSecret },
      create: { employeeId: user.id, clientId, clientSecret },
    });
    return NextResponse.json({ message: "Saved credentials", state: user.id });
  } catch (error) {
    return NextResponse.json({ message: "Server error"},{status:500});
  }
}
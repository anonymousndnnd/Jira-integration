import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma=new PrismaClient();

export async function GET(request:NextRequest){
  const supabase =await createClient();
  const {data: { user },error} = await supabase.auth.getUser();

  if (!user || error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const creds = await prisma.employeeJiraConnection.findUnique({
      where: { employeeId: user.id },
    });
  const redirect_uri=process.env.EMPLOYEE_REDIRECT_URL
  if (!creds) return NextResponse.json({ error: "No Jira credentials found" }, { status: 400 });

  const authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${creds.clientId}&scope=read:jira-user read:jira-work offline_access&redirect_uri=${redirect_uri}&response_type=code&prompt=consent`;
  return NextResponse.redirect(authUrl);
}
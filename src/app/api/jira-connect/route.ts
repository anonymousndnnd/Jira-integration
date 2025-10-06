import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import axios from "axios";

const prisma=new PrismaClient();

export async function GET(request:NextRequest){
  const clientId = process.env.JIRA_CLIENT_ID!;
  const redirectUri = process.env.ATLASSIAN_REDIRECT_URL!;

  const authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${clientId}&scope=read:jira-user read:jira-work offline_access&redirect_uri=${redirectUri}&response_type=code&prompt=consent`;
  return NextResponse.redirect(authUrl);
}
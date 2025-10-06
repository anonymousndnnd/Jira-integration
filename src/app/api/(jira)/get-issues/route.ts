/* eslint-disable */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma=new PrismaClient();
const username=process.env.ATLASSIAN_USERNAME
const password=process.env.JIRA_ACCESS_TOKEN
const domain = process.env.DOMAIN

const auth = {
  username: username,
  password: password
};
export async function GET(request:NextRequest){
  try {
    console.log("entered in try")
    const baseUrl = 'https://' + domain + '.atlassian.net';

    // Example: get all projects
    const authString = Buffer.from(`${username}:${password}`).toString("base64");
    console.log("AuthString is:",authString)

    // Direct request with Authorization header
    const jiraResponse = await axios.get(`${baseUrl}/rest/api/2/search`, {
      headers: {
        "Accept": "application/json",
        "Authorization": `Basic ${authString}`,
      },
    });

    return NextResponse.json({ projects: jiraResponse.data });
  } catch (error: any) {
    console.error("Error fetching Jira data:", error.message);

    return NextResponse.json(
      {
        error: error.response?.data || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
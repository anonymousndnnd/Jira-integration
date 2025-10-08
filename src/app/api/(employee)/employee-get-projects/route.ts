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
    const employee = await prisma.employeeJiraConnection.findUnique({
      where: { employeeId: user.id },
    });
    
    if (!employee) {
      return NextResponse.json({success:false,message:"Employee not found"},{status:400});
    }
    if (!employee.accessToken || !employee.refreshToken || !employee.tokenExpiresAt) {
      return NextResponse.json({ success: false, message: "Incomplete Jira credentials" }, { status: 400 });
    }
    let accessToken = employee.accessToken;

    // Check if token is expired
    const now = new Date();
    if (employee.tokenExpiresAt <= now) {
      const refreshResponse = await axios.post(
        "https://auth.atlassian.com/oauth/token",
        {
          grant_type: "refresh_token",
          client_id: employee.clientId,
          client_secret: employee.clientSecret,
          refresh_token: employee.refreshToken,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      const { access_token, refresh_token, expires_in } = refreshResponse.data;
      accessToken = access_token;

      await prisma.employeeJiraConnection.update({
        where: { employeeId: user.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        },
      });
    } 
    //get the projects through the api 
    const projectsResponse = await axios.get(
      `https://api.atlassian.com/ex/jira/${employee.cloudId}/rest/api/3/project/search?type=software`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const projects = projectsResponse.data.values || [];
        console.log("Projects are:",projects)
    
         for (const project of projects) {
          await prisma.employeeProject.upsert({
            where: { projectId: project.id },
            update: {
              key: project.key,
              name: project.name,
              description: project.description || null,
              leadAccountId: project.lead?.accountId || null,
              projectTypeKey: project.projectTypeKey || null,
              url: project.self || null,
              avatarUrl: project.avatarUrls?.["48x48"] || null,
              updatedAt: new Date(),
            },
            create: {
              projectId: project.id,
              key: project.key,
              name: project.name,
              description: project.description || null,
              leadAccountId: project.lead?.accountId || null,
              projectTypeKey: project.projectTypeKey || null,
              url: project.self || null,
              avatarUrl: project.avatarUrls?.["48x48"] || null,
              employeeId: employee.employeeId,
            },
          });
        }
    
        const storedProjects = await prisma.employeeProject.findMany({
          where: { employeeId: employee.employeeId },
          orderBy: { createdAt: "desc" },
        });
    
        return NextResponse.json({
          success: true,
          message: "Projects synced successfully",
          projects: storedProjects,
        });

  } catch (err: any) {
    console.error("Error fetching Jira projects:", err.response?.data || err.message);
    return NextResponse.json({ error: err.response?.data || err.message }, { status: 500 });
  }
}
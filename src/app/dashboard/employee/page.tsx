'use client'
/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from 'next/navigation';
import axios from "axios";
import { toast } from "sonner";

interface Project {
  id: string;
  key: string;
  name: string;
}

function EmployeeDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJiraProjects = async () => {
      try {
        // Call your Next.js API route
        const response = await axios.get('/api/get-issues'); // adjust if your API path is different
        const data = response.data;

        if (data.projects) {
          setProjects(data.projects.issues || data.projects); // depends on your API response
        } else {
          setError('No projects found');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message);
        toast.error(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJiraProjects();
  }, []);

  if (loading) return <p>Loading Jira projects...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Jira Projects</h1>
      {projects.length === 0 && <p>No projects available</p>}
      <ul className="space-y-2">
        {projects.map((project) => (
          <li key={project.id} className="p-2 border rounded-md">
            <p><strong>{project.name}</strong> ({project.key})</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default EmployeeDashboard

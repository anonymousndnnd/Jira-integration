'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface Project {
  id: string
  key: string
  name: string
  description?: string
  avatarUrl?: string
  projectTypeKey?: string
  leadAccountId?: string
}

interface Request {
  id: string
  status: string
  employeeId:string
  employee: {
    id: string
    username: string
    email: string
  }
  organizationProject: {
    id: string
    projectId:string
    name: string
    key: string
  }
}

function OrganizationDashboard() {
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [hasConnection, setHasConnection] = useState(false)
  const [hasCloudId, setHasCloudId] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [accepting, setAccepting] = useState<string | null>(null)

  // ✅ Connection status
  useEffect(() => {
    const fetchConnectionStatus = async () => {
      try {
        const { data } = await axios.get('/api/organization-connection-status')
        setHasConnection(data.hasConnection)
        setHasCloudId(data.hasCloudId)
      } catch (err) {
        console.error('Error checking Jira connection:', err)
      } finally {
        setCheckingStatus(false)
      }
    }
    fetchConnectionStatus()
  }, [])

  const handleConnectJira = () => {
    window.location.href = '/api/organization-jira-connect'
  }

  const handleGetCloudId = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/get-organization-cloudId')
      if (response.status === 200) setHasCloudId(true)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (hasConnection && hasCloudId) {
        setLoading(true)
        try {
          const response = await axios.get('/api/get-organization-projects')
          setProjects(response.data.projects || [])
        } catch (error) {
          console.error(error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchProjects()
  }, [hasConnection, hasCloudId])

  // ✅ Fetch pending project requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (hasConnection && hasCloudId) {
        try {
          const response = await axios.get('/api/pending-project-request')
          console.log("Respone is",response.data)
          setRequests(response.data.requests || [])
        } catch (error) {
          console.error('Error fetching requests:', error)
        }
      }
    }
    fetchRequests()
  }, [hasConnection, hasCloudId])

 const handleAcceptRequest = async (requestId: string, employeeId: string) => {
  setAccepting(requestId);

  // ✅ Instant visual update: Filter out the accepted request
  // We'll keep a copy of the request just in case we need to roll back.
  let acceptedRequest: Request | undefined;
  setRequests(prev => {
    acceptedRequest = prev.find(r => r.id === requestId);
    return prev.filter(r => r.organizationProject.id !== requestId); // <-- Change is here: filter it out
  });

  try {
    const res = await axios.post('/api/accept-project-request', {
      requestId,
      employeeId
    });

    if (!res.data.success) {
      // rollback if backend failed: add the request back to the array
      setRequests(prev => [
        ...prev,
        acceptedRequest!, // Re-insert the original request.
      ].sort((a, b) => (a.id > b.id ? 1 : -1))); // Optional: Re-sort to maintain order
      alert(res.data.message || 'Failed to accept request.');
    }
  } catch (err) {
    console.error(err);
    alert('Error accepting request.');
    // rollback: add the request back to the array
    setRequests(prev => [
      ...prev,
      acceptedRequest!, // Re-insert the original request.
    ].sort((a, b) => (a.id > b.id ? 1 : -1))); // Optional: Re-sort to maintain order
  } finally {
    setAccepting(null);
  }
};


  if (checkingStatus) {
    return (
      <div className="max-w-md mx-auto mt-24 p-6 text-center border rounded-xl shadow-md bg-gray-50">
        <p className="text-gray-600 font-medium text-lg">Checking connection status...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800">
        Organization Jira Setup
      </h1>

      {/* --- Case 1: Not connected --- */}
      {!hasConnection && (
        <div className="text-center bg-red-50 p-6 rounded-lg border border-red-200 shadow-sm mb-6">
          <p className="mb-4 text-red-700 font-medium">No Jira connection found.</p>
          <button
            onClick={handleConnectJira}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? 'Connecting...' : 'Connect Jira'}
          </button>
        </div>
      )}

      {/* --- Case 2: Connected but Cloud ID missing --- */}
      {hasConnection && !hasCloudId && (
        <div className="text-center bg-yellow-50 p-6 rounded-lg border border-yellow-200 shadow-sm mb-6">
          <p className="mb-4 text-yellow-800 font-semibold">✅ Jira connected successfully</p>
          <button
            onClick={handleGetCloudId}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            {loading ? 'Fetching Cloud ID...' : 'Get Cloud ID'}
          </button>
        </div>
      )}

      {/* --- Case 3: Fully connected --- */}
      {hasConnection && hasCloudId && (
        <div>
          <p className="text-green-700 font-semibold mb-6 text-center">
            ✅ Jira & Cloud ID are fully connected!
          </p>

          {/* --- Projects Section --- */}
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Projects</h2>
          {loading ? (
            <p className="text-gray-600 text-center">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-gray-500 text-center">No projects found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-start gap-4 p-5 bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition"
                >
                  {proj.avatarUrl ? (
                    <img src={proj.avatarUrl} alt={proj.name} className="w-14 h-14 rounded-lg" />
                  ) : (
                    <div className="w-14 h-14 bg-gray-300 rounded-lg flex items-center justify-center text-gray-700 font-bold text-lg">
                      {proj.key?.[0] || 'P'}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{proj.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">{proj.key}</p>
                    {proj.description && <p className="text-sm text-gray-700 mb-1">{proj.description}</p>}
                    {proj.projectTypeKey && (
                      <span className="inline-block text-xs text-gray-500 mt-1 px-2 py-1 bg-gray-100 rounded-full">
                        {proj.projectTypeKey}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- Pending Requests Section --- */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Pending Project Requests</h2>
            {requests.length === 0 ? (
              <p className="text-gray-500 text-center">No pending requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex justify-between items-center p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition"
                  >
                    <div>
                      <p className="text-gray-700 font-semibold">{req.employee.username}</p>
                      <p className="text-gray-500 text-sm">{req.employee.email}</p>
                      <p className="text-gray-600 mt-1">
                        Project: <span className="font-medium">{req.organizationProject.name}</span> 
                      </p>
                    </div>
                    <button
                      disabled={accepting === req.id}
                      onClick={() => handleAcceptRequest(req.organizationProject.id,req.employeeId)}
                      className={`px-4 py-2 rounded-lg font-medium text-white ${
                        accepting === req.id ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {accepting === req.id ? 'Processing...' : 'Accept'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default OrganizationDashboard

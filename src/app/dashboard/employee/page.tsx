'use client'
/* eslint-disable */
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

function JiraRegisterPage() {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasConnection, setHasConnection] = useState(false)
  const [hasCloudId, setHasCloudId] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])

  // ✅ Step 1: Check Jira connection status
  useEffect(() => {
    const fetchConnectionStatus = async () => {
      try {
        const { data } = await axios.get('/api/employee-connection-status')

        setClientId(data.clientId || '')
        setClientSecret(data.clientSecret || '')

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

  // ✅ Step 2: Handle Jira client credentials submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await axios.post('/api/employeeJiraRegister', {
        clientId,
        clientSecret,
      })

      if (response.status === 200) {
        window.location.href = '/api/employee-jira-connect'
      } else {
        alert(response.data.error || 'Something went wrong during registration.')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      alert(error.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Step 3: Handle Cloud ID retrieval
  const handleGetCloudId = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/get-employee-cloudId')
      if (response.status === 200) {
        alert('✅ Cloud ID fetched and saved successfully!')
        setHasCloudId(true)
      } else {
        alert(response.data.error || 'Failed to fetch Cloud ID.')
      }
    } catch (error: any) {
      console.error('Error fetching Cloud ID:', error)
      alert(error.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Step 4: Fetch Jira projects if fully connected
  useEffect(() => {
    const fetchProjects = async () => {
      if (hasConnection && hasCloudId) {
        setLoading(true)
        try {
          const response = await axios.get('/api/employee-get-projects')
          setProjects(response.data.projects || [])
        } catch (error: any) {
          console.error('Error fetching Jira projects:', error)
          alert(error.response?.data?.error || 'Failed to fetch projects.')
        } finally {
          setLoading(false)
        }
      }
    }

    fetchProjects()
  }, [hasConnection, hasCloudId])

  if (checkingStatus) {
    return (
      <div className="max-w-md mx-auto mt-20 p-5 text-center border rounded shadow">
        Checking connection status...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 border rounded-lg shadow bg-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Employee Jira Setup</h1>

      {/* --- Case 1: Need credentials --- */}
      {!hasConnection && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Atlassian Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Atlassian Client Secret"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            required
            className="border p-2 rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            {loading ? 'Submitting...' : 'Connect Jira'}
          </button>
        </form>
      )}

      {/* --- Case 2: Connected but Cloud ID missing --- */}
      {hasConnection && !hasCloudId && (
        <div className="text-center">
          <p className="mb-4 text-gray-700">✅ Jira connected successfully</p>
          <button
            onClick={handleGetCloudId}
            disabled={loading}
            className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
          >
            {loading ? 'Fetching Cloud ID...' : 'Get Cloud ID'}
          </button>
        </div>
      )}

      {/* --- Case 3: Fully connected --- */}
      {hasConnection && hasCloudId && (
        <div>
          <p className="text-green-700 font-semibold mb-4">
            ✅ Jira & Cloud ID are already connected!
          </p>
          <h2 className="text-2xl font-bold mb-3">Your Projects:</h2>

          {loading ? (
            <p>Loading projects...</p>
          ) : projects.length === 0 ? (
            <p>No projects found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="border rounded-lg p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {proj.avatarUrl ? (
                    <img
                      src={proj.avatarUrl}
                      alt={proj.name}
                      className="w-12 h-12 rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center text-gray-700 font-semibold">
                      {proj.key?.[0] || 'P'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{proj.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{proj.key}</p>
                    {proj.description && (
                      <p className="text-sm text-gray-700">{proj.description}</p>
                    )}
                    {proj.projectTypeKey && (
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {proj.projectTypeKey}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default JiraRegisterPage

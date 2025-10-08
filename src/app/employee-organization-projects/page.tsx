'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { FiCheckCircle, FiClock, FiUserPlus } from 'react-icons/fi'

interface Project {
  projectId: string
  name: string
  avatarUrl?: string
  accessStatus?: 'idle' | 'pending' | 'accepted'
  id: string
  key: string
}

function EmployeeOrganizationProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchOrganizationProjects = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/employee-organization-projects')
      console.log("organization:", response.data.projects)
      setProjects(response.data.projects || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizationProjects()
  }, [])

  const handleRequestAccess = async (id: string) => {
    setUpdating(id)
    try {
      const res = await axios.post('/api/project-access-request', { id })
      if (res.data.success) {
        const { projectId, status } = res.data.updateRequest
        setProjects(prev =>
          prev.map(p =>
            p.id === projectId ? { ...p, accessStatus: status.toLowerCase() } : p
          )
        )
      } else {
        alert(res.data.message || 'Request failed.')
      }
    } catch (err) {
      console.error('Error requesting access:', err)
      alert('Failed to request access.')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-24 p-6 text-center border rounded-xl shadow-md bg-white">
        <p className="text-gray-600 font-medium text-lg">Loading projects...</p>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-24 p-6 text-center border rounded-xl shadow-md bg-white">
        <p className="text-gray-500 text-lg">No projects available.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto mt-12 p-8 bg-white rounded-2xl shadow-xl">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-10 text-center text-gray-800">
        Organization Projects
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map(project => (
          <div
            key={project.projectId}
            className="flex flex-col md:flex-row items-center justify-between p-6 bg-gray-50 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-center gap-5 w-full md:w-auto">
              {project.avatarUrl ? (
                <img
                  src={project.avatarUrl}
                  alt={project.name}
                  className="w-16 h-16 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-xl">
                  {project.name?.[0] || 'P'}
                </div>
              )}

              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-semibold text-gray-800">{project.name}</span>

                {/* Show project key if accepted */}
                {project.accessStatus === 'accepted' && project.key && (
                  <div className="mt-2">
                    <p className="text-sm md:text-base text-gray-700 mb-1">
                      Enter this key to access the project:
                    </p>
                    <span className="inline-block bg-green-50 border border-green-400 text-green-800 px-3 py-1 rounded-lg font-mono font-medium shadow-sm">
                      {project.key}
                    </span>
                  </div>
                )}

                {project.accessStatus && project.accessStatus !== 'idle' && (
                  <span
                    className={`inline-flex items-center text-sm md:text-base font-medium mt-2 px-3 py-1 rounded-full ${
                      project.accessStatus === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {project.accessStatus === 'accepted' && <FiCheckCircle className="mr-1" />}
                    {project.accessStatus === 'pending' && <FiClock className="mr-1" />}
                    {project.accessStatus.charAt(0).toUpperCase() + project.accessStatus.slice(1)}
                  </span>
                )}
              </div>
            </div>

            <button
              disabled={
                updating === project.projectId ||
                project.accessStatus === 'pending' ||
                project.accessStatus === 'accepted'
              }
              onClick={() => handleRequestAccess(project.id)}
              className={`mt-4 md:mt-0 flex items-center gap-2 px-5 py-3 rounded-xl text-white font-medium text-sm md:text-base transition-colors duration-200 ${
                updating === project.projectId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : project.accessStatus === 'accepted'
                  ? 'bg-green-600 cursor-default'
                  : project.accessStatus === 'pending'
                  ? 'bg-yellow-500 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {updating === project.projectId ? (
                'Processing...'
              ) : project.accessStatus === 'accepted' ? (
                <>
                  <FiCheckCircle /> Access Granted
                </>
              ) : project.accessStatus === 'pending' ? (
                <>
                  <FiClock /> Pending
                </>
              ) : (
                <>
                  <FiUserPlus /> Request Access
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EmployeeOrganizationProjects

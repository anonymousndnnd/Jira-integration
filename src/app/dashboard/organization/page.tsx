'use client'
/* eslint-disable */
import React from "react";

function EmployeeDashboard() {

  const handleConnectJira = () => {
    // Redirect user to your Next.js API route that starts OAuth
    window.location.href = "/api/jira-connect";
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Employee Dashboard</h1>
      <button 
        onClick={handleConnectJira} 
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Connect Jira
      </button>
    </div>
  );
}

export default EmployeeDashboard;

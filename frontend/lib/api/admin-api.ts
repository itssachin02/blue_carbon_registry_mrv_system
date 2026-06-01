// Admin API Service - Fetch real data from backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
  : "http://localhost:5000/api";

// Get admin token from localStorage
const getAdminToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminToken") || localStorage.getItem("token");
  }
  return null;
};

// ============= PROJECTS =============
export async function getAllProjects() {
  try {
    const token = getAdminToken();
    console.log("🔑 Admin token for projects:", token?.substring(0, 20) + "...");
    
    const response = await fetch(`${API_BASE}/admin/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    console.log("📡 Projects API status:", response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Projects API error:", error);
      throw new Error("Failed to fetch projects");
    }
    
    const data = await response.json();
    console.log("✅ Projects API response:", data);
    
    // Handle both { projects: [...] } and direct array responses
    const result = Array.isArray(data) ? data : data.projects || [];
    console.log("✅ Projects array to return:", result);
    return result;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function getPendingProjects() {
  try {
    const token = getAdminToken();
    const response = await fetch(`${API_BASE}/admin/projects/pending`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch pending projects");
    const data = await response.json();
    // Handle both { projects: [...] } and direct array responses
    return Array.isArray(data) ? data : data.projects || [];
  } catch (error) {
    console.error("Error fetching pending projects:", error);
    return [];
  }
}

export async function getProjectById(projectId: string) {
  try {
    const token = getAdminToken();
    const response = await fetch(`${API_BASE}/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch project");
    return await response.json();
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

export async function approveProject(projectId: string, notes?: string) {
  try {
    const token = getAdminToken();
    const response = await fetch(`${API_BASE}/admin/projects/${projectId}/approve`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) throw new Error("Failed to approve project");
    return await response.json();
  } catch (error) {
    console.error("Error approving project:", error);
    throw error;
  }
}

export async function rejectProject(projectId: string, reason: string) {
  try {
    const token = getAdminToken();
    const response = await fetch(`${API_BASE}/admin/projects/${projectId}/reject`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error("Failed to reject project");
    return await response.json();
  } catch (error) {
    console.error("Error rejecting project:", error);
    throw error;
  }
}

// ============= USERS =============
export async function getAllUsers() {
  try {
    const token = getAdminToken();
    const response = await fetch(`${API_BASE}/auth/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch users");
    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function getUserById(userId: string) {
  try {
    const token = getAdminToken();
    const response = await fetch(`${API_BASE}/admin/developers/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch user");
    return await response.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

// ============= MRV DATA =============
export async function getAllMRVReports() {
  try {
    const token = getAdminToken();
    const response = await fetch(`${API_BASE}/mrv`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch MRV reports");
    return await response.json();
  } catch (error) {
    console.error("Error fetching MRV reports:", error);
    return [];
  }
}

export async function getMRVReportById(reportId: string) {
  try {
    const token = getAdminToken();
    const response = await fetch(`${API_BASE}/mrv/${reportId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch MRV report");
    return await response.json();
  } catch (error) {
    console.error("Error fetching MRV report:", error);
    return null;
  }
}

export async function verifyMRVReport(projectId: string) {
  try {
    const token = getAdminToken();
    const response = await fetch(`${API_BASE}/mrv/project/${projectId}/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch MRV summary");
    return await response.json();
  } catch (error) {
    console.error("Error fetching MRV summary:", error);
    return null;
  }
}

// ============= DASHBOARD STATS =============
export async function getAdminStats() {
  try {
    const token = getAdminToken();
    const response = await fetch(`${API_BASE}/admin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch admin stats");
    return await response.json();
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      totalProjects: 0,
      pendingApprovals: 0,
      totalCO2: 0,
      creditsIssued: 0,
    };
  }
}

// ============= TRANSACTIONS =============
export async function getAllTransactions() {
  try {
    const token = getAdminToken();
    // This endpoint might need to be created on backend
    // For now, returning empty array as fallback
    const response = await fetch(`${API_BASE}/admin/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

// ============= ACTIVITY LOGS =============
export async function getActivityLogs() {
  try {
    const token = getAdminToken();
    // This endpoint might need to be created on backend
    // For now, returning empty array as fallback
    const response = await fetch(`${API_BASE}/admin/logs`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }
}

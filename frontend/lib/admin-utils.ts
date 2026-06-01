// Mock data and utilities for the admin panel

export interface Project {
  id: string;
  name: string;
  owner: string;
  location: string;
  area: number; // hectares
  co2Captured: number; // tons
  credits: number;
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  proofImages: string[];
  methodology?: string;
  notes?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  projectsCount: number;
  creditsEarned: number;
  status: "active" | "blocked";
  joinedDate: string;
}

export interface Transaction {
  id: string;
  type: "mint" | "transfer" | "burn";
  projectId: string;
  projectName: string;
  credits: number;
  amount: number;
  hash: string;
  timestamp: string;
  status: "confirmed" | "pending";
}

export interface ActivityLog {
  id: string;
  action: string;
  admin: string;
  projectName?: string;
  timestamp: string;
  details: string;
}

// Mock Projects Data
export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj_001",
    name: "Mangrove Restoration - Kerala",
    owner: "Rajesh Kumar",
    location: "Kerala, India",
    area: 50,
    co2Captured: 12500,
    credits: 0,
    status: "pending",
    submittedDate: "2024-03-20",
    proofImages: ["image1.jpg", "image2.jpg", "image3.jpg"],
    methodology: "VCS Standard",
  },
  {
    id: "proj_002",
    name: "Seagrass Beds - Goa",
    owner: "Priya Sharma",
    location: "Goa, India",
    area: 35,
    co2Captured: 8750,
    credits: 0,
    status: "pending",
    submittedDate: "2024-03-18",
    proofImages: ["img_a.jpg", "img_b.jpg"],
    methodology: "Gold Standard",
  },
  {
    id: "proj_003",
    name: "Kelp Farm - California",
    owner: "John Smith",
    location: "California, USA",
    area: 75,
    co2Captured: 18750,
    credits: 18750,
    status: "approved",
    submittedDate: "2024-03-10",
    proofImages: ["ca_1.jpg", "ca_2.jpg"],
    methodology: "VCS Standard",
    approvedBy: "Admin User",
    approvedDate: "2024-03-15",
  },
];

// Mock Users
export const MOCK_USERS: User[] = [
  {
    id: "user_001",
    name: "Rajesh Kumar",
    email: "rajesh@example.com",
    role: "Project Owner",
    projectsCount: 2,
    creditsEarned: 25000,
    status: "active",
    joinedDate: "2024-01-15",
  },
  {
    id: "user_002",
    name: "Priya Sharma",
    email: "priya@example.com",
    role: "Verifier",
    projectsCount: 1,
    creditsEarned: 8750,
    status: "active",
    joinedDate: "2024-02-10",
  },
  {
    id: "user_003",
    name: "John Smith",
    email: "john@example.com",
    role: "Project Owner",
    projectsCount: 3,
    creditsEarned: 45000,
    status: "active",
    joinedDate: "2024-01-01",
  },
];

// Mock Transactions
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_001",
    type: "mint",
    projectId: "proj_003",
    projectName: "Kelp Farm - California",
    credits: 18750,
    amount: 18750,
    hash: "0x1a2b3c4d5e6f7g8h9i0j",
    timestamp: "2024-03-15 14:30:00",
    status: "confirmed",
  },
];

// Mock Activity Logs
export const MOCK_LOGS: ActivityLog[] = [
  {
    id: "log_001",
    action: "Project Approved",
    admin: "Admin User",
    projectName: "Kelp Farm - California",
    timestamp: "2024-03-15 14:30:00",
    details: "Approved with 18,750 credits issued",
  },
];

// Utility: Validate CO2 vs Area
export const validateCO2Data = (area: number, co2: number) => {
  // Realistic average: 150-300 tons CO2 per hectare for blue carbon ecosystems
  const minCO2 = area * 150;
  const maxCO2 = area * 350;

  if (co2 < minCO2) {
    return { valid: false, error: `CO₂ seems too low for ${area} hectares` };
  }
  if (co2 > maxCO2) {
    return { valid: false, error: `CO₂ seems unrealistically high for ${area} hectares` };
  }
  return { valid: true, error: null };
};

// Utility: Generate Blockchain Hash
export const generateBlockchainHash = (): string => {
  return "0x" + Array(64)
    .fill(0)
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
};

// Utility: Format timestamp
export const formatTimestamp = (date: Date = new Date()): string => {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

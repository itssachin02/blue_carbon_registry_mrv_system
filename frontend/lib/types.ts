export interface Project {
  id: string;
  name: string;
  location: string;
  area: number;
  carbonCredits: number;
  description: string;
  status: "verified" | "pending" | "rejected";
  approvalStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  verifiedAt?: string;
  transactionHash?: string;
  ecosystemType: "mangrove" | "seagrass" | "saltmarsh" | "kelp";
  coordinates?: {
    lat: number;
    lng: number;
  };
  proofIpfsHash?: string;
  proofUrl?: string;
  proofFileName?: string;
}

export interface MRVReport {
  id: string;
  projectId: string;
  projectName: string;
  reportType: "monitoring" | "verification" | "baseline";
  status: "submitted" | "under-review" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  fileUrl?: string;
  fileName?: string;
  carbonSequestered: number;
  methodology: string;
  notes?: string;
}

export interface BlockchainTransaction {
  id: string;
  projectId: string;
  transactionHash: string;
  blockNumber: number;
  status: "pending" | "confirmed" | "failed";
  timestamp: string;
  type: "registration" | "verification" | "credit-issuance" | "transfer";
  gasUsed?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "verifier" | "project-owner" | "auditor";
  organization?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalCarbonCredits: number;
  verifiedProjects: number;
  pendingVerifications: number;
  totalArea: number;
  recentTransactions: number;
}

export interface CarbonCredit {
  id: string;
  projectId: string;
  amount: number;
  vintage: string;
  status: "active" | "retired" | "transferred";
  issuedAt: string;
  retiredAt?: string;
  transferredTo?: string;
}

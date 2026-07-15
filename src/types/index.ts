import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    employeeId: string;
    zoneId: string | null;
    zoneName: string | null;
  }

  interface Session {
    user: User;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    employeeId: string;
    zoneId: string | null;
    zoneName: string | null;
    accessToken?: string;
  }
}

export type UserRole = "SALES_MARKETING" | "MANAGEMENT_ADMIN" | "PRODUCTION_LOGISTICS";

export type DealerStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "INACTIVE";

export type OrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "PROCESSING"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export type DispatchStatus =
  | "PENDING"
  | "ALLOCATED"
  | "PACKED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED_DELIVERY";

export type InvoiceStatus =
  | "DRAFT"
  | "GENERATED"
  | "SENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type IssueType = "TECHNICAL" | "NUTRITIONAL" | "PEST_DISEASE" | "GENERAL";

export type CreditPeriod = "DAYS_45" | "DAYS_60";

export type PaymentMode = "CASH" | "CHEQUE" | "NEFT" | "RTGS" | "UPI" | "OTHER";

export interface DashboardStats {
  totalDealers: number;
  pendingApprovals: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  overduePayments: number;
}

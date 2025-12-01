/**
 * Dashboard service - Business logic for dashboard data
 */

import { api } from '../../services/apiClient';
import { API_ROUTES } from '../../services/api.config';

/**
 * Overview Dashboard Response Types
 */
export interface OverviewDashboardResponse {
  success: boolean;
  data: {
    summaryCards: SummaryCard[];
    overview: {
      occupancy: OccupancyData;
      monthlyRevenue: RevenueData;
      activeTenants: CountData;
      activeVendors: CountData;
      openAlerts: CountData;
      pendingPayments: CountData;
    };
    profitLoss: {
      totalNetIncome: number;
      series: ProfitLossSeries[];
    };
    employeeActivityLog: {
      total: number;
      items: ActivityLogItem[];
    };
    transactions: {
      payable: TransactionGroup;
      receivable: TransactionGroup;
    };
    recentBills: Bill[];
    recentMaintenance: MaintenanceRequest[];
    unpaidRent: {
      totalAmount: number;
      totalFormatted: string;
      aging: AgingBucket[];
      tenants: UnpaidRentTenant[];
      summary: {
        paidCount: number;
        unpaidCount: number;
      };
    };
    checkInCheckOut: {
      checkIns: {
        count: number;
        period: string;
      };
      checkOuts: {
        count: number;
        period: string;
      };
      total: number;
    };
    meta: {
      hostelId: number | null;
      currency: string;
      generatedAt: string;
    };
  };
  message: string;
  statusCode: number;
}

export interface SummaryCard {
  key: string;
  title: string;
  value: number;
  valueFormatted: string;
  changePercent: number;
  changeFormatted: string;
  direction: 'up' | 'down' | 'flat';
  caption: string;
  meta?: {
    totalUnits?: number;
    occupiedUnits?: number;
    previous?: number;
    previousFormatted?: string;
  };
}

export interface OccupancyData {
  occupied: number;
  vacant: number;
  occupiedPercent: number;
  vacantPercent: number;
  growth: string;
  totalUnits: number;
  occupiedUnits: number;
}

export interface RevenueData {
  current: number;
  growth: string;
  formatted: string;
}

export interface CountData {
  count: number;
  growth: string;
}

export interface ProfitLossSeries {
  month: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

export interface ActivityLogItem {
  id: number;
  employeeName: string;
  employeeRole: string;
  action: string;
  description: string;
  hostelName: string;
  timestamp: string;
}

export interface TransactionGroup {
  totalAmount: number;
  totalFormatted: string;
  count: number;
  items: Transaction[];
}

export interface Transaction {
  id: number;
  date: string;
  ref: string;
  type: string;
  amount: number;
  status: string;
  tenantName: string | null;
  hostelName: string;
  description: string | null;
  property: string | null;
}

export interface Bill {
  id: number;
  date: string;
  ref: string;
  type: string;
  amount: number;
  status: string;
  tenantName: string | null;
  hostelName: string;
  description: string;
}

export interface MaintenanceRequest {
  id: number;
  description: string;
  property: string;
  unit: string;
  status: string;
  createdAt: string;
  tenantName: string | null;
  hostelName: string;
}

export interface AgingBucket {
  category: string;
  amount: number;
}

export interface UnpaidRentTenant {
  tenantName: string;
  room: string;
  amount: number;
  daysOld: number;
  category: string;
  status: string;
  hostelName: string;
}

/**
 * Get overview dashboard data
 * @returns Overview dashboard data
 */
export const getOverviewDashboard = async (): Promise<OverviewDashboardResponse['data']> => {
  try {
    const response = await api.get<OverviewDashboardResponse>(API_ROUTES.DASHBOARD.OVERVIEW);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch dashboard data');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching overview dashboard:', error);
    throw error;
  }
};


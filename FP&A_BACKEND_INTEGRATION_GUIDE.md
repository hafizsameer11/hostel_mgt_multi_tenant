# FP&A Backend Integration Guide

This document explains the JSON response structure, API endpoints, and calculations required for the Financial Planning & Analysis (FP&A) dashboard.

## Table of Contents
1. [API Endpoints](#api-endpoints)
2. [Response Structures](#response-structures)
3. [Calculations & Transformations](#calculations--transformations)
4. [Frontend Integration](#frontend-integration)

---

## API Endpoints

### 1. Get Monthly Financial Data
**Endpoint:** `GET /api/fpa/monthly`

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "month": "Jan",
      "year": 2025,
      "income": 48500,
      "expenses": 22300,
      "rent": 40000,
      "deposits": 8500,
      "maintenance": 8000,
      "supplies": 5000,
      "utilities": 4500,
      "hvac": 2800,
      "security": 2000
    },
    {
      "month": "Feb",
      "year": 2025,
      "income": 51200,
      "expenses": 24100,
      "rent": 42000,
      "deposits": 9200,
      "maintenance": 8500,
      "supplies": 5200,
      "utilities": 4800,
      "hvac": 3100,
      "security": 2500
    }
    // ... more months
  ],
  "message": "Monthly financial data retrieved successfully"
}
```

### 2. Get Yearly Financial Data
**Endpoint:** `GET /api/fpa/yearly`

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "year": 2020,
      "income": 512000,
      "expenses": 245000,
      "netIncome": 267000
    },
    {
      "year": 2021,
      "income": 548000,
      "expenses": 268000,
      "netIncome": 280000
    }
    // ... more years
  ],
  "message": "Yearly financial data retrieved successfully"
}
```

### 3. Get Category Breakdown
**Endpoint:** `GET /api/fpa/categories?period=monthly&year=2025`

**Query Parameters:**
- `period`: `monthly` or `yearly`
- `year`: Year for filtering (optional)
- `month`: Month for filtering (optional, for monthly period)

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "income": {
      "Rent": 480000,
      "Deposit": 85000,
      "LateFees": 5000,
      "Other": 2000
    },
    "expenses": {
      "Maintenance": 45000,
      "Supplies": 30000,
      "HVAC": 28000,
      "Utilities": 25000,
      "Security": 20000,
      "Furniture": 15000,
      "Other": 5000
    },
    "period": "yearly",
    "year": 2025
  },
  "message": "Category breakdown retrieved successfully"
}
```

### 4. Get Accounts/Transactions Data
**Endpoint:** `GET /api/accounts?type=all&startDate=2025-01-01&endDate=2025-12-31`

**Query Parameters:**
- `type`: `all`, `income`, `expense`, `rent`, `deposit`, etc.
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2025-10-01",
      "ref": "RENT-1001",
      "type": "Rent",
      "category": "Rent",
      "amount": 800,
      "status": "Paid",
      "tenantName": "Sarah Johnson",
      "description": null
    },
    {
      "id": 6,
      "date": "2025-09-28",
      "ref": "EXP-3001",
      "type": "Expense",
      "category": "Maintenance",
      "amount": 350,
      "status": "Paid",
      "tenantName": null,
      "description": "Plumbing repair - Room 305"
    }
    // ... more transactions
  ],
  "total": 150,
  "page": 1,
  "pageSize": 50,
  "message": "Accounts data retrieved successfully"
}
```

### 5. Get Financial KPIs
**Endpoint:** `GET /api/fpa/kpis?period=monthly&year=2025`

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "netIncome": 348300,
    "totalIncome": 648400,
    "totalExpenses": 300100,
    "avgMonthlyIncome": 54033.33,
    "avgMonthlyExpenses": 25008.33,
    "yoyGrowth": -4.4,
    "profitMargin": 53.7,
    "expenseRatio": 46.3,
    "currentRatio": 2.16
  },
  "message": "KPIs retrieved successfully"
}
```

### 6. Get Break Even Analysis
**Endpoint:** `GET /api/fpa/breakeven?year=2025`

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "fixedCosts": 150000,
    "variableCosts": 100000,
    "contributionMargin": 398333.33,
    "breakEvenRevenue": 375000,
    "breakEvenUnits": 6.94,
    "marginOfSafety": 273400,
    "marginOfSafetyPercent": 42.2,
    "avgMonthlyIncome": 54033.33,
    "avgMonthlyExpenses": 25008.33
  },
  "message": "Break even analysis retrieved successfully"
}
```

### 7. Get Cash Flow Analysis
**Endpoint:** `GET /api/fpa/cashflow?year=2025`

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "month": "Jan",
      "income": 48500,
      "expenses": 22300,
      "netCashFlow": 26200,
      "cumulative": 26200
    },
    {
      "month": "Feb",
      "income": 51200,
      "expenses": 24100,
      "netCashFlow": 27100,
      "cumulative": 53300
    }
    // ... more months with cumulative calculated
  ],
  "message": "Cash flow analysis retrieved successfully"
}
```

### 8. Get Financial Ratios
**Endpoint:** `GET /api/fpa/ratios?year=2025`

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "profitMargin": 53.7,
    "expenseRatio": 46.3,
    "currentRatio": 2.16,
    "debtToIncome": 46.3,
    "returnOnRevenue": 53.7,
    "quickRatio": 1.85,
    "debtToEquity": 0.65,
    "grossMargin": 85.2
  },
  "message": "Financial ratios retrieved successfully"
}
```

---

## Backend Calculations

### 1. Monthly Financial Data Calculation

**SQL Query Example (PostgreSQL):**
```sql
SELECT 
  TO_CHAR(date_trunc('month', date), 'Mon') as month,
  EXTRACT(YEAR FROM date) as year,
  SUM(CASE WHEN type IN ('Rent', 'Deposit', 'LateFees', 'Refund') THEN amount ELSE 0 END) as income,
  SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) as expenses,
  SUM(CASE WHEN type = 'Rent' THEN amount ELSE 0 END) as rent,
  SUM(CASE WHEN type = 'Deposit' THEN amount ELSE 0 END) as deposits,
  SUM(CASE WHEN type = 'Expense' AND category = 'Maintenance' THEN amount ELSE 0 END) as maintenance,
  SUM(CASE WHEN type = 'Expense' AND category = 'Supplies' THEN amount ELSE 0 END) as supplies,
  SUM(CASE WHEN type = 'Expense' AND category = 'Utilities' THEN amount ELSE 0 END) as utilities,
  SUM(CASE WHEN type = 'Expense' AND category = 'HVAC' THEN amount ELSE 0 END) as hvac,
  SUM(CASE WHEN type = 'Expense' AND category = 'Security' THEN amount ELSE 0 END) as security
FROM accounts
WHERE date >= '2025-01-01' AND date < '2026-01-01'
GROUP BY date_trunc('month', date), EXTRACT(YEAR FROM date)
ORDER BY date_trunc('month', date);
```

**Node.js Calculation:**
```javascript
// Calculate monthly data
const monthlyData = await Account.aggregate([
  {
    $match: {
      date: {
        $gte: new Date('2025-01-01'),
        $lt: new Date('2026-01-01')
      }
    }
  },
  {
    $group: {
      _id: {
        month: { $month: '$date' },
        year: { $year: '$date' }
      },
      income: {
        $sum: {
          $cond: [
            { $in: ['$type', ['Rent', 'Deposit', 'LateFees', 'Refund']] },
            '$amount',
            0
          ]
        }
      },
      expenses: {
        $sum: {
          $cond: [
            { $eq: ['$type', 'Expense'] },
            '$amount',
            0
          ]
        }
      },
      rent: {
        $sum: {
          $cond: [{ $eq: ['$type', 'Rent'] }, '$amount', 0]
        }
      },
      deposits: {
        $sum: {
          $cond: [{ $eq: ['$type', 'Deposit'] }, '$amount', 0]
        }
      },
      maintenance: {
        $sum: {
          $cond: [
            { $and: [
              { $eq: ['$type', 'Expense'] },
              { $eq: ['$category', 'Maintenance'] }
            ]},
            '$amount',
            0
          ]
        }
      }
      // ... more categories
    }
  },
  {
    $sort: { '_id.year': 1, '_id.month': 1 }
  }
]);

// Format month names
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formattedData = monthlyData.map(item => ({
  month: monthNames[item._id.month - 1],
  year: item._id.year,
  income: item.income,
  expenses: item.expenses,
  // ... other fields
}));
```

### 2. Yearly Financial Data Calculation

**Node.js Calculation:**
```javascript
const yearlyData = await Account.aggregate([
  {
    $group: {
      _id: { $year: '$date' },
      income: {
        $sum: {
          $cond: [
            { $in: ['$type', ['Rent', 'Deposit', 'LateFees', 'Refund']] },
            '$amount',
            0
          ]
        }
      },
      expenses: {
        $sum: {
          $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0]
        }
      }
    }
  },
  {
    $project: {
      year: '$_id',
      income: 1,
      expenses: 1,
      netIncome: { $subtract: ['$income', '$expenses'] }
    }
  },
  {
    $sort: { year: 1 }
  }
]);
```

### 3. Category Breakdown Calculation

**Node.js Calculation:**
```javascript
// Income categories
const incomeCategories = await Account.aggregate([
  {
    $match: {
      type: { $in: ['Rent', 'Deposit', 'LateFees', 'Refund'] },
      date: { $gte: startDate, $lt: endDate }
    }
  },
  {
    $group: {
      _id: '$type',
      total: { $sum: '$amount' }
    }
  }
]);

// Expense categories
const expenseCategories = await Account.aggregate([
  {
    $match: {
      type: 'Expense',
      date: { $gte: startDate, $lt: endDate }
    }
  },
  {
    $group: {
      _id: '$category',
      total: { $sum: '$amount' }
    }
  }
]);

// Format response
const categoryBreakdown = {
  income: incomeCategories.reduce((acc, item) => {
    acc[item._id] = item.total;
    return acc;
  }, {}),
  expenses: expenseCategories.reduce((acc, item) => {
    acc[item._id || 'Other'] = item.total;
    return acc;
  }, {})
};
```

### 4. Month-to-Month Comparison Calculation

**Node.js Calculation:**
```javascript
const monthlyComparison = monthlyData.map((month, index) => {
  const prevMonth = index > 0 ? monthlyData[index - 1] : null;
  
  return {
    ...month,
    net: month.income - month.expenses,
    incomeChange: prevMonth ? month.income - prevMonth.income : 0,
    expenseChange: prevMonth ? month.expenses - prevMonth.expenses : 0,
    netChange: prevMonth 
      ? (month.income - month.expenses) - (prevMonth.income - prevMonth.expenses)
      : 0,
    incomeChangePercent: prevMonth
      ? ((month.income - prevMonth.income) / prevMonth.income) * 100
      : 0,
    expenseChangePercent: prevMonth
      ? ((month.expenses - prevMonth.expenses) / prevMonth.expenses) * 100
      : 0
  };
});
```

### 5. Year-to-Year Comparison Calculation

**Node.js Calculation:**
```javascript
const yearlyComparison = yearlyData.map((year, index) => {
  const prevYear = index > 0 ? yearlyData[index - 1] : null;
  
  return {
    ...year,
    net: year.income - year.expenses,
    incomeChange: prevYear ? year.income - prevYear.income : 0,
    expenseChange: prevYear ? year.expenses - prevYear.expenses : 0,
    netChange: prevYear
      ? (year.income - year.expenses) - (prevYear.income - prevYear.expenses)
      : 0,
    incomeGrowth: prevYear
      ? ((year.income - prevYear.income) / prevYear.income) * 100
      : 0,
    expenseGrowth: prevYear
      ? ((year.expenses - prevYear.expenses) / prevYear.expenses) * 100
      : 0
  };
});
```

### 6. KPI Calculations

**Node.js Calculation:**
```javascript
const calculateKPIs = async (period = 'yearly', year = new Date().getFullYear()) => {
  let data;
  
  if (period === 'monthly') {
    data = await getMonthlyData(year);
  } else {
    data = await getYearlyData();
  }
  
  const current = period === 'monthly' 
    ? data[data.length - 1]
    : data.find(d => d.year === year);
  
  const previous = period === 'monthly'
    ? data[data.length - 2]
    : data.find(d => d.year === year - 1);
  
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const netIncome = current.income - current.expenses;
  
  const avgMonthlyIncome = data.reduce((sum, item) => sum + item.income, 0) / data.length;
  const avgMonthlyExpenses = data.reduce((sum, item) => sum + item.expenses, 0) / data.length;
  
  const yoyGrowth = previous
    ? ((current.income - previous.income) / previous.income) * 100
    : 0;
  
  const profitMargin = (netIncome / current.income) * 100;
  const expenseRatio = (current.expenses / current.income) * 100;
  const currentRatio = current.income / current.expenses;
  
  return {
    netIncome,
    totalIncome,
    totalExpenses,
    avgMonthlyIncome,
    avgMonthlyExpenses,
    yoyGrowth,
    profitMargin,
    expenseRatio,
    currentRatio
  };
};
```

### 7. Break Even Analysis Calculation

**Node.js Calculation:**
```javascript
const calculateBreakEven = async (year = new Date().getFullYear()) => {
  const monthlyData = await getMonthlyData(year);
  
  const avgMonthlyIncome = monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length;
  const avgMonthlyExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length;
  
  // Assume 60% fixed costs, 40% variable costs
  const fixedCosts = avgMonthlyExpenses * 0.6;
  const variableCosts = avgMonthlyExpenses * 0.4;
  
  // Contribution margin per unit (assuming income is the price per unit)
  const contributionMargin = avgMonthlyIncome - variableCosts;
  
  // Break even point (in units - assuming 1 unit = 1 month of operations)
  const breakEvenUnits = contributionMargin > 0 
    ? fixedCosts / contributionMargin 
    : 0;
  
  // Break even revenue
  const breakEvenRevenue = breakEvenUnits * avgMonthlyIncome;
  
  // Margin of safety
  const marginOfSafety = avgMonthlyIncome - breakEvenRevenue;
  const marginOfSafetyPercent = ((avgMonthlyIncome - breakEvenRevenue) / avgMonthlyIncome) * 100;
  
  return {
    fixedCosts,
    variableCosts,
    contributionMargin,
    breakEvenRevenue,
    breakEvenUnits,
    marginOfSafety,
    marginOfSafetyPercent,
    avgMonthlyIncome,
    avgMonthlyExpenses
  };
};
```

### 8. Cash Flow Analysis Calculation

**Node.js Calculation:**
```javascript
const calculateCashFlow = async (year = new Date().getFullYear()) => {
  const monthlyData = await getMonthlyData(year);
  
  let cumulative = 0;
  const cashFlow = monthlyData.map((month) => {
    const netCashFlow = month.income - month.expenses;
    cumulative += netCashFlow;
    
    return {
      month: month.month,
      income: month.income,
      expenses: month.expenses,
      netCashFlow,
      cumulative
    };
  });
  
  return cashFlow;
};
```

### 9. Financial Ratios Calculation

**Node.js Calculation:**
```javascript
const calculateRatios = async (year = new Date().getFullYear()) => {
  const yearlyData = await getYearlyData();
  const currentYear = yearlyData.find(d => d.year === year);
  
  if (!currentYear) return null;
  
  const netIncome = currentYear.income - currentYear.expenses;
  
  // Profit Margin = (Net Income / Revenue) × 100
  const profitMargin = (netIncome / currentYear.income) * 100;
  
  // Expense Ratio = (Total Expenses / Total Revenue) × 100
  const expenseRatio = (currentYear.expenses / currentYear.income) * 100;
  
  // Current Ratio = Current Assets / Current Liabilities
  // Using income as proxy for assets and expenses as proxy for liabilities
  const currentRatio = currentYear.income / currentYear.expenses;
  
  // Debt to Income Ratio = (Total Debt / Total Income) × 100
  const debtToIncome = (currentYear.expenses / currentYear.income) * 100;
  
  // Return on Revenue = (Net Income / Revenue) × 100
  const returnOnRevenue = (netIncome / currentYear.income) * 100;
  
  return {
    profitMargin,
    expenseRatio,
    currentRatio,
    debtToIncome,
    returnOnRevenue
  };
};
```

---

## Frontend Integration

### 1. API Service Setup

**File: `src/admin/services/fpaService.ts`**

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const fpaService = {
  // Get monthly financial data
  getMonthlyData: async (year?: number) => {
    const response = await axios.get(`${API_BASE_URL}/fpa/monthly`, {
      params: { year }
    });
    return response.data.data;
  },

  // Get yearly financial data
  getYearlyData: async () => {
    const response = await axios.get(`${API_BASE_URL}/fpa/yearly`);
    return response.data.data;
  },

  // Get category breakdown
  getCategoryBreakdown: async (period: 'monthly' | 'yearly', year?: number) => {
    const response = await axios.get(`${API_BASE_URL}/fpa/categories`, {
      params: { period, year }
    });
    return response.data.data;
  },

  // Get accounts/transactions
  getAccounts: async (filters?: {
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await axios.get(`${API_BASE_URL}/accounts`, {
      params: filters
    });
    return response.data.data;
  },

  // Get KPIs
  getKPIs: async (period: 'monthly' | 'yearly', year?: number) => {
    const response = await axios.get(`${API_BASE_URL}/fpa/kpis`, {
      params: { period, year }
    });
    return response.data.data;
  },

  // Get break even analysis
  getBreakEven: async (year?: number) => {
    const response = await axios.get(`${API_BASE_URL}/fpa/breakeven`, {
      params: { year }
    });
    return response.data.data;
  },

  // Get cash flow analysis
  getCashFlow: async (year?: number) => {
    const response = await axios.get(`${API_BASE_URL}/fpa/cashflow`, {
      params: { year }
    });
    return response.data.data;
  },

  // Get financial ratios
  getRatios: async (year?: number) => {
    const response = await axios.get(`${API_BASE_URL}/fpa/ratios`, {
      params: { year }
    });
    return response.data.data;
  }
};
```

### 2. Update Frontend Component

**File: `src/admin/pages/FPA/FinanceDashboard.tsx`**

Replace mock data imports with API calls:

```typescript
import { fpaService } from '../../services/fpaService';
import { useEffect } from 'react';

const FinanceDashboard: React.FC = () => {
  const [viewType, setViewType] = useState<ViewType>('monthly');
  const [monthlyData, setMonthlyData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState({ income: [], expenses: [] });
  const [kpis, setKpis] = useState(null);
  const [breakEven, setBreakEven] = useState(null);
  const [cashFlow, setCashFlow] = useState([]);
  const [ratios, setRatios] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        
        const [monthly, yearly, categories, kpiData, breakEvenData, cashFlowData, ratiosData] = 
          await Promise.all([
            fpaService.getMonthlyData(currentYear),
            fpaService.getYearlyData(),
            fpaService.getCategoryBreakdown(viewType, currentYear),
            fpaService.getKPIs(viewType, currentYear),
            fpaService.getBreakEven(currentYear),
            fpaService.getCashFlow(currentYear),
            fpaService.getRatios(currentYear)
          ]);

        setMonthlyData(monthly);
        setYearlyData(yearly);
        setCategoryBreakdown(categories);
        setKpis(kpiData);
        setBreakEven(breakEvenData);
        setCashFlow(cashFlowData);
        setRatios(ratiosData);
      } catch (error) {
        console.error('Error fetching FP&A data:', error);
        // Handle error - show toast or fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [viewType]);

  // Update calculations to use fetched data
  const monthlyDataWithComparison = useMemo(() => {
    return monthlyData.map((month, index) => {
      const prevMonth = index > 0 ? monthlyData[index - 1] : null;
      return {
        ...month,
        net: month.income - month.expenses,
        incomeChange: prevMonth ? month.income - prevMonth.income : 0,
        expenseChange: prevMonth ? month.expenses - prevMonth.expenses : 0,
        netChange: prevMonth 
          ? (month.income - month.expenses) - (prevMonth.income - prevMonth.expenses)
          : 0,
      };
    });
  }, [monthlyData]);

  // ... rest of component
};
```

---

## Data Transformation Examples

### 1. Category Breakdown Format

**Backend Response:**
```json
{
  "income": {
    "Rent": 480000,
    "Deposit": 85000
  },
  "expenses": {
    "Maintenance": 45000,
    "Supplies": 30000
  }
}
```

**Frontend Transformation:**
```typescript
const categoryBreakdown = {
  income: Object.entries(apiResponse.income).map(([name, value]) => ({
    name,
    value
  })),
  expenses: Object.entries(apiResponse.expenses).map(([name, value]) => ({
    name,
    value
  }))
};
```

### 2. Monthly Comparison Format

**Backend Response:**
```json
[
  {
    "month": "Jan",
    "income": 48500,
    "expenses": 22300,
    "incomeChange": 0,
    "expenseChange": 0
  },
  {
    "month": "Feb",
    "income": 51200,
    "expenses": 24100,
    "incomeChange": 2700,
    "expenseChange": 1800
  }
]
```

**Frontend Usage:**
Directly use in charts - no transformation needed if backend provides change calculations.

---

## Error Handling

### Backend Error Response Format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Frontend Error Handling:
```typescript
try {
  const data = await fpaService.getMonthlyData();
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Server error:', error.response.data.error);
  } else if (error.request) {
    // Request made but no response
    console.error('Network error:', error.request);
  } else {
    // Something else happened
    console.error('Error:', error.message);
  }
  // Fallback to mock data or show error message
}
```

---

## Summary

1. **Backend provides calculated data** - All calculations should be done on the backend
2. **Frontend focuses on visualization** - Minimal calculations, mostly data transformation
3. **Consistent response format** - All endpoints follow the same structure
4. **Error handling** - Both backend and frontend handle errors gracefully
5. **Performance** - Use aggregation queries on the backend for better performance
6. **Caching** - Consider caching frequently accessed data on the backend

This structure ensures:
- Separation of concerns (business logic on backend, presentation on frontend)
- Better performance (calculations done once on backend)
- Easier testing and debugging
- Scalability for future features





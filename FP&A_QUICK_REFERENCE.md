# FP&A Quick Reference Guide

## 📊 Data Flow Overview

```
Frontend (React) → API Service → Backend (Node.js) → Database (MongoDB)
                                            ↓
                                    Calculations & Aggregations
                                            ↓
                                    JSON Response → Frontend
```

## 🔗 API Endpoints Summary

| Endpoint | Method | Purpose | Key Response Fields |
|----------|--------|---------|-------------------|
| `/api/fpa/monthly` | GET | Monthly financial data | `month`, `income`, `expenses`, categories |
| `/api/fpa/yearly` | GET | Yearly financial data | `year`, `income`, `expenses`, `netIncome` |
| `/api/fpa/categories` | GET | Category breakdown | `income`, `expenses` objects |
| `/api/fpa/kpis` | GET | Key performance indicators | `netIncome`, `yoyGrowth`, `profitMargin` |
| `/api/fpa/breakeven` | GET | Break even analysis | `breakEvenRevenue`, `marginOfSafety` |
| `/api/fpa/cashflow` | GET | Cash flow analysis | `netCashFlow`, `cumulative` |
| `/api/fpa/ratios` | GET | Financial ratios | `profitMargin`, `expenseRatio`, `currentRatio` |

## 📈 Calculations Explained

### 1. **Net Income**
```
Net Income = Total Income - Total Expenses
```

### 2. **Profit Margin**
```
Profit Margin (%) = (Net Income / Total Income) × 100
```
- **Interpretation**: Percentage of revenue that becomes profit
- **Good**: > 50% (for property management)
- **Calculation Location**: Backend in `/api/fpa/kpis` and `/api/fpa/ratios`

### 3. **Year-over-Year (YoY) Growth**
```
YoY Growth (%) = ((Current Year Income - Previous Year Income) / Previous Year Income) × 100
```
- **Calculation Location**: Backend in `/api/fpa/kpis`
- **Frontend Use**: Trend indicator in KPI cards

### 4. **Break Even Revenue**
```
Contribution Margin = Average Monthly Income - Variable Costs
Break Even Units = Fixed Costs / Contribution Margin
Break Even Revenue = Break Even Units × Average Monthly Income
```
- **Assumptions**: 
  - Fixed Costs = 60% of average monthly expenses
  - Variable Costs = 40% of average monthly expenses
- **Calculation Location**: Backend in `/api/fpa/breakeven`

### 5. **Margin of Safety**
```
Margin of Safety = Average Monthly Income - Break Even Revenue
Margin of Safety (%) = (Margin of Safety / Average Monthly Income) × 100
```
- **Interpretation**: How much revenue can drop before breaking even
- **Calculation Location**: Backend in `/api/fpa/breakeven`

### 6. **Cash Flow**
```
Monthly Cash Flow = Monthly Income - Monthly Expenses
Cumulative Cash Flow = Sum of all previous monthly cash flows
```
- **Calculation Location**: Backend in `/api/fpa/cashflow`
- **Frontend Use**: Line chart showing cumulative trend

### 7. **Month-to-Month Change**
```
Income Change = Current Month Income - Previous Month Income
Expense Change = Current Month Expenses - Previous Month Expenses
Net Change = Current Net - Previous Net
```
- **Calculation Location**: Can be done in backend or frontend
- **Frontend Use**: Comparison indicators in monthly view

### 8. **Category Breakdown**
```
Income Categories: Rent, Deposit, LateFees, Refund
Expense Categories: Maintenance, Supplies, HVAC, Utilities, Security, Furniture, Other
```
- **Calculation Location**: Backend aggregates by `type` and `category` fields
- **Frontend Use**: Pie charts for income and expenses

## 📋 Account Model Structure

Your Account collection should have:
```javascript
{
  _id: ObjectId,
  date: Date,           // Transaction date
  ref: String,          // Reference number (e.g., "RENT-1001")
  type: String,         // "Rent", "Deposit", "Expense", "Refund"
  category: String,     // "Maintenance", "Supplies", etc. (for expenses)
  amount: Number,       // Transaction amount
  status: String,       // "Paid", "Pending", "Overdue"
  tenantName: String,   // For rent/deposit transactions
  description: String   // For expense transactions
}
```

## 🔄 Frontend Data Transformation

### Monthly Data with Comparison
```typescript
// Backend provides: { month, income, expenses }
// Frontend adds: { net, incomeChange, expenseChange, netChange }

const monthlyDataWithComparison = monthlyData.map((month, index) => {
  const prevMonth = index > 0 ? monthlyData[index - 1] : null;
  return {
    ...month,
    net: month.income - month.expenses,
    incomeChange: prevMonth ? month.income - prevMonth.income : 0,
    expenseChange: prevMonth ? month.expenses - prevMonth.expenses : 0,
    netChange: prevMonth 
      ? (month.income - month.expenses) - (prevMonth.income - prevMonth.expenses)
      : 0
  };
});
```

### Category Breakdown Format
```typescript
// Backend provides: { income: { Rent: 480000, Deposit: 85000 }, expenses: {...} }
// Frontend transforms to: [{ name: "Rent", value: 480000 }, ...]

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

## 📊 Graph Data Requirements

### 1. **Month-to-Month Comparison Chart**
**Data Needed:**
- `month`: Month name (Jan, Feb, etc.)
- `income`: Monthly income
- `expenses`: Monthly expenses
- `net`: Calculated as `income - expenses`

### 2. **Year-to-Year Comparison Chart**
**Data Needed:**
- `year`: Year (2020, 2021, etc.)
- `income`: Yearly income
- `expenses`: Yearly expenses
- `net`: Calculated as `income - expenses`

### 3. **Category Pie Charts**
**Data Needed:**
- Income: `[{ name: "Rent", value: 480000 }, ...]`
- Expenses: `[{ name: "Maintenance", value: 45000 }, ...]`

### 4. **Cash Flow Chart**
**Data Needed:**
- `month`: Month name
- `income`: Monthly income
- `expenses`: Monthly expenses
- `cumulative`: Running total of net cash flow

## 🎯 Key Metrics Interpretation

| Metric | What It Means | Good Value | Calculation |
|--------|---------------|------------|-------------|
| **Profit Margin** | % of revenue that's profit | > 50% | `(Net Income / Revenue) × 100` |
| **Expense Ratio** | % of revenue spent | < 50% | `(Expenses / Revenue) × 100` |
| **Current Ratio** | Income vs Expenses | > 1.5 | `Income / Expenses` |
| **YoY Growth** | Year-over-year growth | Positive | `((Current - Previous) / Previous) × 100` |
| **Margin of Safety** | Buffer before break even | > 20% | `(Revenue - Break Even) / Revenue × 100` |

## 🔧 Implementation Checklist

### Backend (Node.js)
- [ ] Create `/api/fpa/monthly` endpoint
- [ ] Create `/api/fpa/yearly` endpoint
- [ ] Create `/api/fpa/categories` endpoint
- [ ] Create `/api/fpa/kpis` endpoint
- [ ] Create `/api/fpa/breakeven` endpoint
- [ ] Create `/api/fpa/cashflow` endpoint
- [ ] Create `/api/fpa/ratios` endpoint
- [ ] Implement MongoDB aggregation queries
- [ ] Add error handling
- [ ] Add input validation

### Frontend (React)
- [ ] Create `fpaService.ts` API service
- [ ] Update `FinanceDashboard.tsx` to use API calls
- [ ] Replace mock data imports with API calls
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test with real backend data

## 📝 Example Response Formats

### Monthly Data Response
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
      "deposits": 8500
    }
  ]
}
```

### KPIs Response
```json
{
  "success": true,
  "data": {
    "netIncome": 348300,
    "totalIncome": 648400,
    "totalExpenses": 300100,
    "yoyGrowth": -4.4,
    "profitMargin": 53.7
  }
}
```

### Break Even Response
```json
{
  "success": true,
  "data": {
    "breakEvenRevenue": 375000,
    "marginOfSafety": 273400,
    "marginOfSafetyPercent": 42.2
  }
}
```

## 🚀 Quick Start

1. **Backend**: Implement endpoints using `BACKEND_EXAMPLE_IMPLEMENTATION.js`
2. **Frontend**: Create API service using `FP&A_BACKEND_INTEGRATION_GUIDE.md`
3. **Test**: Use Postman/Thunder Client to test endpoints
4. **Integrate**: Update frontend to use real API calls
5. **Deploy**: Test in production environment

## 💡 Tips

- **Performance**: Use MongoDB aggregation for calculations (faster than JavaScript loops)
- **Caching**: Consider caching monthly/yearly data (changes infrequently)
- **Validation**: Always validate dates and year parameters
- **Error Handling**: Return consistent error format from all endpoints
- **Testing**: Test with empty data, single month/year, and edge cases





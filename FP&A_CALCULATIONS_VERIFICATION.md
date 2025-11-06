# FP&A Calculations Verification & Enhancement Guide

## ✅ Current Calculations - Verified

### 1. **Net Income** ✓ CORRECT
```typescript
Net Income = Income - Expenses
```
**Current Implementation:** ✅ Correct
```typescript
net: month.income - month.expenses
netIncome: currentYear.income - currentYear.expenses
```

### 2. **Profit Margin** ✓ CORRECT (with enhancement needed)
```typescript
Profit Margin (%) = (Net Income / Revenue) × 100
```
**Current Implementation:** ✅ Correct, but needs division by zero check
```typescript
profitMargin: (netIncome / currentYear.income) * 100
```

**Enhanced Version (with safety check):**
```typescript
profitMargin: currentYear.income > 0 
  ? (netIncome / currentYear.income) * 100 
  : 0
```

### 3. **YoY Growth** ✓ CORRECT
```typescript
YoY Growth (%) = ((Current Year - Previous Year) / Previous Year) × 100
```
**Current Implementation:** ✅ Correct
```typescript
yoyGrowth: previousYear
  ? ((currentYear.income - previousYear.income) / previousYear.income) * 100
  : 0
```

### 4. **Break Even Analysis** ✓ CORRECT (with minor enhancement)
**Current Implementation:** ✅ Correct
```typescript
fixedCosts = avgMonthlyExpenses * 0.6
variableCosts = avgMonthlyExpenses * 0.4
contributionMargin = avgMonthlyIncome - variableCosts
breakEvenUnits = fixedCosts / contributionMargin
breakEvenRevenue = breakEvenUnits * avgMonthlyIncome
marginOfSafety = avgMonthlyIncome - breakEvenRevenue
marginOfSafetyPercent = (marginOfSafety / avgMonthlyIncome) * 100
```

**Note:** The 60/40 split is an assumption. Consider making this configurable.

### 5. **Cash Flow** ✓ CORRECT
**Current Implementation:** ✅ Correct
```typescript
netCashFlow = income - expenses
cumulative = sum of all previous netCashFlow values
```

### 6. **Financial Ratios** ✓ MOSTLY CORRECT (enhancements needed)

#### Current Implementation:
```typescript
profitMargin: (netIncome / currentYear.income) * 100  // ✅ Correct
expenseRatio: (currentYear.expenses / currentYear.income) * 100  // ✅ Correct
currentRatio: (currentYear.income / currentYear.expenses).toFixed(2)  // ⚠️ Needs division by zero check
debtToIncome: (currentYear.expenses / currentYear.income) * 100  // ✅ Correct (same as expenseRatio)
returnOnRevenue: (netIncome / currentYear.income) * 100  // ✅ Correct (same as profitMargin)
```

**Note:** `debtToIncome` and `returnOnRevenue` are duplicates. Consider renaming or adding different metrics.

### 7. **Category Breakdown** ✓ CORRECT
**Current Implementation:** ✅ Correct
- Groups income by type (Rent, Deposit)
- Groups expenses by category (Maintenance, Supplies, etc.)

### 8. **Month-to-Month & Year-to-Year Comparisons** ✓ CORRECT
**Current Implementation:** ✅ Correct
```typescript
incomeChange = current - previous
expenseChange = current - previous
netChange = currentNet - previousNet
incomeGrowth = ((current - previous) / previous) * 100
expenseGrowth = ((current - previous) / previous) * 100
```

---

## 🔧 Required Fixes

### 1. Add Division by Zero Checks
All calculations that divide should check for zero denominators:

```typescript
// Enhanced Profit Margin
profitMargin: currentYear.income > 0 
  ? (netIncome / currentYear.income) * 100 
  : 0

// Enhanced Current Ratio
currentRatio: currentYear.expenses > 0
  ? (currentYear.income / currentYear.expenses).toFixed(2)
  : 'N/A'

// Enhanced Break Even
breakEvenUnits: contributionMargin > 0 
  ? fixedCosts / contributionMargin 
  : 0
```

### 2. Fix Duplicate Metrics
- `debtToIncome` is the same as `expenseRatio` - consider removing or renaming
- `returnOnRevenue` is the same as `profitMargin` - consider removing or renaming

---

## 📊 Additional Financial Metrics to Add

### 1. **Operating Margin**
```typescript
Operating Margin (%) = (Operating Income / Revenue) × 100
Operating Income = Revenue - Operating Expenses
```
**Use Case:** Measures profitability from core operations

### 2. **Gross Margin**
```typescript
Gross Margin (%) = ((Revenue - Cost of Goods Sold) / Revenue) × 100
```
**For Property Management:**
```typescript
Gross Margin = ((Total Income - Direct Property Costs) / Total Income) × 100
Direct Property Costs = Maintenance + Repairs + Utilities
```

### 3. **EBITDA (Earnings Before Interest, Taxes, Depreciation, Amortization)**
```typescript
EBITDA = Net Income + Interest + Taxes + Depreciation + Amortization
```
**Simplified for Property Management:**
```typescript
EBITDA = Net Income + Depreciation (if applicable)
```

### 4. **Operating Expense Ratio (OER)**
```typescript
OER (%) = (Operating Expenses / Gross Income) × 100
```
**Current Implementation:** Already calculated as `expenseRatio`

### 5. **Collection Efficiency**
```typescript
Collection Efficiency (%) = (Collected Rent / Total Rent Due) × 100
```
**Use Case:** Measures how effectively you collect rent payments

### 6. **Revenue per Available Unit (RevPAU)**
```typescript
RevPAU = Total Revenue / Number of Available Units
Monthly RevPAU = Monthly Revenue / Number of Units
```
**Use Case:** Measures revenue efficiency per unit

### 7. **Occupancy Rate Impact**
```typescript
Occupancy Revenue = (Occupancy Rate / 100) × Total Potential Revenue
Lost Revenue = Total Potential Revenue - Actual Revenue
```
**Use Case:** Shows revenue impact of occupancy

### 8. **Days Sales Outstanding (DSO)**
```typescript
DSO = (Accounts Receivable / Total Credit Sales) × Number of Days
Monthly DSO = (Outstanding Rent / Monthly Rent Income) × 30
```
**Use Case:** Measures how long it takes to collect payments

### 9. **Quick Ratio (Acid Test)**
```typescript
Quick Ratio = (Current Assets - Inventory) / Current Liabilities
Simplified = (Cash + Receivables) / Current Liabilities
```
**Use Case:** Measures short-term liquidity

### 10. **Debt Service Coverage Ratio (DSCR)**
```typescript
DSCR = Net Operating Income / Total Debt Service
```
**Use Case:** Measures ability to pay debts

### 11. **Return on Investment (ROI)**
```typescript
ROI (%) = ((Net Profit - Investment) / Investment) × 100
```
**Use Case:** Measures investment efficiency

### 12. **Expense Growth Rate**
```typescript
Expense Growth Rate (%) = ((Current Expenses - Previous Expenses) / Previous Expenses) × 100
```
**Current Implementation:** Already calculated as `expenseGrowth` in yearly comparison

### 13. **Revenue Growth Rate**
```typescript
Revenue Growth Rate (%) = ((Current Revenue - Previous Revenue) / Previous Revenue) × 100
```
**Current Implementation:** Already calculated as `incomeGrowth` in yearly comparison

### 14. **Net Profit Growth**
```typescript
Net Profit Growth (%) = ((Current Net - Previous Net) / Previous Net) × 100
```
**Use Case:** Measures profit growth over time

### 15. **Contribution Margin Ratio**
```typescript
Contribution Margin Ratio (%) = (Contribution Margin / Revenue) × 100
```
**Use Case:** Shows what percentage of revenue contributes to covering fixed costs

---

## 🎯 Recommended Additional Calculations

### Priority 1 (High Value, Easy to Implement)
1. ✅ **Operating Margin** - Already similar to profit margin
2. ✅ **Collection Efficiency** - Useful for property management
3. ✅ **Revenue per Available Unit (RevPAU)** - Industry standard
4. ✅ **Net Profit Growth** - Track profit trends

### Priority 2 (Medium Value)
5. ✅ **Gross Margin** - Differentiate direct vs indirect costs
6. ✅ **Days Sales Outstanding (DSO)** - Payment collection efficiency
7. ✅ **Contribution Margin Ratio** - Break even context

### Priority 3 (Lower Priority)
8. ✅ **EBITDA** - If you track depreciation
9. ✅ **Quick Ratio** - If you have balance sheet data
10. ✅ **ROI** - If you track investments

---

## 📝 Enhanced Calculation Implementation

Here's the enhanced version with all improvements:

```typescript
// Enhanced Financial Ratios
const ratios = useMemo(() => {
  const currentYear = financeYearlyData[financeYearlyData.length - 1];
  const netIncome = currentYear.income - currentYear.expenses;
  
  // Safe division helper
  const safeDivide = (numerator: number, denominator: number) => 
    denominator > 0 ? numerator / denominator : 0;
  
  return {
    // Core Ratios
    profitMargin: safeDivide(netIncome, currentYear.income) * 100,
    expenseRatio: safeDivide(currentYear.expenses, currentYear.income) * 100,
    currentRatio: currentYear.expenses > 0 
      ? (currentYear.income / currentYear.expenses).toFixed(2)
      : 'N/A',
    
    // Operating Metrics
    operatingMargin: safeDivide(netIncome, currentYear.income) * 100, // Same as profit margin for now
    grossMargin: safeDivide(netIncome, currentYear.income) * 100, // Simplified
    
    // Efficiency Metrics
    returnOnRevenue: safeDivide(netIncome, currentYear.income) * 100,
    
    // Remove duplicates - debtToIncome is same as expenseRatio
  };
}, []);

// Additional KPIs
const additionalKPIs = useMemo(() => {
  const currentYear = financeYearlyData[financeYearlyData.length - 1];
  const previousYear = financeYearlyData[financeYearlyData.length - 2];
  const currentMonth = financeMonthlyData[financeMonthlyData.length - 1];
  
  // Net Profit Growth
  const netProfitGrowth = previousYear
    ? ((currentYear.income - currentYear.expenses) - 
       (previousYear.income - previousYear.expenses)) / 
      (previousYear.income - previousYear.expenses) * 100
    : 0;
  
  // Collection Efficiency (if you have pending/overdue data)
  const totalRentDue = accountsData
    .filter(a => a.type === 'Rent')
    .reduce((sum, a) => sum + a.amount, 0);
  const collectedRent = accountsData
    .filter(a => a.type === 'Rent' && a.status === 'Paid')
    .reduce((sum, a) => sum + a.amount, 0);
  const collectionEfficiency = totalRentDue > 0
    ? (collectedRent / totalRentDue) * 100
    : 100;
  
  // Revenue per Available Unit (assuming you have unit count)
  const totalUnits = 100; // This should come from your data
  const revPAU = totalUnits > 0 ? currentYear.income / totalUnits : 0;
  const monthlyRevPAU = totalUnits > 0 ? currentMonth.income / totalUnits : 0;
  
  return {
    netProfitGrowth,
    collectionEfficiency,
    revPAU,
    monthlyRevPAU,
  };
}, []);
```

---

## ✅ Summary

### Current Calculations Status:
- ✅ **Net Income**: Correct
- ✅ **Profit Margin**: Correct (needs safety check)
- ✅ **YoY Growth**: Correct
- ✅ **Break Even Analysis**: Correct
- ✅ **Cash Flow**: Correct
- ✅ **Category Breakdown**: Correct
- ✅ **Month-to-Month Comparisons**: Correct
- ✅ **Year-to-Year Comparisons**: Correct
- ⚠️ **Financial Ratios**: Needs division by zero checks and duplicate removal

### Recommended Additions:
1. **Collection Efficiency** - High value for property management
2. **Revenue per Available Unit (RevPAU)** - Industry standard
3. **Net Profit Growth** - Track profitability trends
4. **Gross Margin** - Better cost analysis
5. **Days Sales Outstanding (DSO)** - Payment collection metric

### Required Fixes:
1. Add division by zero checks to all calculations
2. Remove or rename duplicate metrics (debtToIncome, returnOnRevenue)
3. Add safety checks for undefined/null values





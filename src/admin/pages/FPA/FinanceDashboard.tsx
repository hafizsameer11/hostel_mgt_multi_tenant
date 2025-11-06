/**
 * FinanceDashboard page
 * Financial Planning & Analysis with comprehensive reporting
 */

import React, { useState, useMemo } from 'react';
import { 
  ArrowDownTrayIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { StatCard } from '../../components/StatCard';
import { Tabs } from '../../components/Tabs';
import type { Tab } from '../../components/Tabs';
import { Button } from '../../components/Button';
import { formatCurrency } from '../../types/common';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import financeMonthlyData from '../../mock/finance-monthly.json';
import financeYearlyData from '../../mock/finance-yearly.json';
import accountsData from '../../mock/accounts.json';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ViewType = 'monthly' | 'yearly';

/**
 * Finance dashboard page
 */
const FinanceDashboard: React.FC = () => {
  const [viewType, setViewType] = useState<ViewType>('monthly');

  const tabs: Tab[] = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
  ];

  // Calculate category breakdowns from accounts data
  const categoryBreakdown = useMemo(() => {
    const incomeCategories: Record<string, number> = {};
    const expenseCategories: Record<string, number> = {};

    accountsData.forEach((account) => {
      if (account.type === 'Rent' || account.type === 'Deposit') {
        incomeCategories[account.type] = (incomeCategories[account.type] || 0) + account.amount;
      } else if (account.type === 'Expense') {
        // Categorize expenses by description keywords
        const desc = (account.description || '').toLowerCase();
        let category = 'Other';
        if (desc.includes('plumb') || desc.includes('repair')) category = 'Maintenance';
        else if (desc.includes('clean') || desc.includes('supplies')) category = 'Supplies';
        else if (desc.includes('hvac') || desc.includes('heating') || desc.includes('cooling')) category = 'HVAC';
        else if (desc.includes('internet') || desc.includes('utilities')) category = 'Utilities';
        else if (desc.includes('security')) category = 'Security';
        else if (desc.includes('furniture')) category = 'Furniture';
        
        expenseCategories[category] = (expenseCategories[category] || 0) + account.amount;
      }
    });

    return {
      income: Object.entries(incomeCategories).map(([name, value]) => ({ name, value })),
      expenses: Object.entries(expenseCategories).map(([name, value]) => ({ name, value })),
    };
  }, []);

  // Calculate monthly data with comparisons
  const monthlyDataWithComparison = useMemo(() => {
    return financeMonthlyData.map((month, index) => {
      const prevMonth = index > 0 ? financeMonthlyData[index - 1] : null;
      return {
        ...month,
        net: month.income - month.expenses,
        incomeChange: prevMonth ? month.income - prevMonth.income : 0,
        expenseChange: prevMonth ? month.expenses - prevMonth.expenses : 0,
        netChange: prevMonth ? (month.income - month.expenses) - (prevMonth.income - prevMonth.expenses) : 0,
      };
    });
  }, []);

  // Calculate yearly data with comparisons
  const yearlyDataWithComparison = useMemo(() => {
    return financeYearlyData.map((year, index) => {
      const prevYear = index > 0 ? financeYearlyData[index - 1] : null;
      return {
        ...year,
        net: year.income - year.expenses,
        incomeChange: prevYear ? year.income - prevYear.income : 0,
        expenseChange: prevYear ? year.expenses - prevYear.expenses : 0,
        netChange: prevYear ? (year.income - year.expenses) - (prevYear.income - prevYear.expenses) : 0,
        incomeGrowth: prevYear ? ((year.income - prevYear.income) / prevYear.income) * 100 : 0,
        expenseGrowth: prevYear ? ((year.expenses - prevYear.expenses) / prevYear.expenses) * 100 : 0,
      };
    });
  }, []);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const currentYear = financeYearlyData[financeYearlyData.length - 1];
    const currentMonth = financeMonthlyData[financeMonthlyData.length - 1];
    const netIncome = currentYear.income - currentYear.expenses;
    const monthlyNet = currentMonth.income - currentMonth.expenses;
    
    const totalIncome = viewType === 'monthly' 
      ? financeMonthlyData.reduce((sum, m) => sum + m.income, 0)
      : currentYear.income;
    const totalExpenses = viewType === 'monthly'
      ? financeMonthlyData.reduce((sum, m) => sum + m.expenses, 0)
      : currentYear.expenses;

    // Year-over-year growth
    const previousYear = financeYearlyData[financeYearlyData.length - 2];
    const yoyGrowth = previousYear
      ? ((currentYear.income - previousYear.income) / previousYear.income) * 100
      : 0;

    return {
      netIncome,
      monthlyNet,
      totalIncome,
      totalExpenses,
      yoyGrowth,
    };
  }, [viewType]);

  // Break even analysis
  const breakEven = useMemo(() => {
    const avgMonthlyIncome = financeMonthlyData.reduce((sum, m) => sum + m.income, 0) / financeMonthlyData.length;
    const avgMonthlyExpenses = financeMonthlyData.reduce((sum, m) => sum + m.expenses, 0) / financeMonthlyData.length;
    const fixedCosts = avgMonthlyExpenses * 0.6; // Assume 60% fixed
    const variableCosts = avgMonthlyExpenses * 0.4; // Assume 40% variable
    const contributionMargin = avgMonthlyIncome - variableCosts;
    const breakEvenUnits = contributionMargin > 0 ? fixedCosts / contributionMargin : 0;
    const breakEvenRevenue = breakEvenUnits * avgMonthlyIncome;
    const contributionMarginRatio = avgMonthlyIncome > 0
      ? (contributionMargin / avgMonthlyIncome) * 100
      : 0;

    return {
      fixedCosts,
      variableCosts,
      contributionMargin,
      breakEvenUnits: breakEvenUnits.toFixed(2),
      breakEvenRevenue,
      marginOfSafety: avgMonthlyIncome - breakEvenRevenue,
      marginOfSafetyPercent: avgMonthlyIncome > 0
        ? ((avgMonthlyIncome - breakEvenRevenue) / avgMonthlyIncome) * 100
        : 0,
      contributionMarginRatio,
    };
  }, []);

  // Cash flow analysis
  const cashFlow = useMemo(() => {
    const monthlyCashFlow = financeMonthlyData.map((month) => ({
      month: month.month,
      income: month.income,
      expenses: month.expenses,
      netCashFlow: month.income - month.expenses,
      cumulative: 0,
    }));

    let cumulative = 0;
    monthlyCashFlow.forEach((item) => {
      cumulative += item.netCashFlow;
      item.cumulative = cumulative;
    });

    return monthlyCashFlow;
  }, []);

  // Financial ratios with safety checks
  const ratios = useMemo(() => {
    const currentYear = financeYearlyData[financeYearlyData.length - 1];
    const netIncome = currentYear.income - currentYear.expenses;
    
    // Safe division helper to prevent division by zero
    const safeDivide = (numerator: number, denominator: number) => 
      denominator > 0 ? numerator / denominator : 0;
    
    return {
      profitMargin: safeDivide(netIncome, currentYear.income) * 100,
      expenseRatio: safeDivide(currentYear.expenses, currentYear.income) * 100,
      currentRatio: currentYear.expenses > 0 
        ? (currentYear.income / currentYear.expenses).toFixed(2)
        : 'N/A',
      operatingExpenseRatio: safeDivide(currentYear.expenses, currentYear.income) * 100,
      returnOnRevenue: safeDivide(netIncome, currentYear.income) * 100,
    };
  }, []);

  // Additional KPIs
  const additionalKPIs = useMemo(() => {
    const currentYear = financeYearlyData[financeYearlyData.length - 1];
    const previousYear = financeYearlyData[financeYearlyData.length - 2];
    const currentMonth = financeMonthlyData[financeMonthlyData.length - 1];
    
    // Net Profit Growth
    const currentNet = currentYear.income - currentYear.expenses;
    const previousNet = previousYear 
      ? previousYear.income - previousYear.expenses 
      : 0;
    const netProfitGrowth = previousNet > 0
      ? ((currentNet - previousNet) / previousNet) * 100
      : 0;
    
    // Collection Efficiency
    const totalRentDue = accountsData
      .filter(a => a.type === 'Rent')
      .reduce((sum, a) => sum + a.amount, 0);
    const collectedRent = accountsData
      .filter(a => a.type === 'Rent' && a.status === 'Paid')
      .reduce((sum, a) => sum + a.amount, 0);
    const collectionEfficiency = totalRentDue > 0
      ? (collectedRent / totalRentDue) * 100
      : 100;
    
    // Revenue per Available Unit (assuming 100 units)
    const totalUnits = 100;
    const revPAU = totalUnits > 0 ? currentYear.income / totalUnits : 0;
    const monthlyRevPAU = totalUnits > 0 ? currentMonth.income / totalUnits : 0;
    
    // Contribution Margin Ratio
    const avgMonthlyIncome = financeMonthlyData.reduce((sum, m) => sum + m.income, 0) / financeMonthlyData.length;
    const avgMonthlyExpenses = financeMonthlyData.reduce((sum, m) => sum + m.expenses, 0) / financeMonthlyData.length;
    const variableCosts = avgMonthlyExpenses * 0.4;
    const contributionMargin = avgMonthlyIncome - variableCosts;
    const contributionMarginRatio = avgMonthlyIncome > 0
      ? (contributionMargin / avgMonthlyIncome) * 100
      : 0;
    
    return {
      netProfitGrowth,
      collectionEfficiency,
      revPAU,
      monthlyRevPAU,
      contributionMarginRatio,
    };
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // PDF Export function
  const handleExportPDF = async () => {
    const element = document.getElementById('fpa-report');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Add watermark
      const totalPages = (pdf as any).internal.pages.length || 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setTextColor(200, 200, 200);
        pdf.setFontSize(50);
        pdf.text('CONFIDENTIAL', 105, 148, {
          align: 'center',
          angle: 45,
        });
      }

      // Add logo (you can add your logo image here)
      // For now, we'll add a text logo
      pdf.setPage(1);
      pdf.setTextColor(33, 118, 255);
      pdf.setFontSize(20);
      pdf.text('Hostel Manager', 15, 15);

      pdf.save(`FP&A-Report-${viewType}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="space-y-6" id="fpa-report">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Financial Planning & Analysis
          </h1>
          <p className="text-slate-600 mt-1">
            Comprehensive financial overview and insights
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleExportPDF}
          icon={ArrowDownTrayIcon}
        >
          Export PDF
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Net Income"
          value={formatCurrency(viewType === 'monthly' ? kpis.monthlyNet : kpis.netIncome)}
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
          variant="success"
          trend={{
            value: `${kpis.yoyGrowth.toFixed(1)}% YoY`,
            isPositive: kpis.yoyGrowth > 0,
          }}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(kpis.totalIncome)}
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
          variant="primary"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(kpis.totalExpenses)}
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
          variant="warning"
        />
        <StatCard
          title="Profit Margin"
          value={`${ratios.profitMargin.toFixed(1)}%`}
          icon={<ArrowTrendingUpIcon className="w-6 h-6 text-white" />}
          variant={ratios.profitMargin > 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 pt-4">
          <Tabs
            tabs={tabs}
            activeTab={viewType}
            onChange={(id) => setViewType(id as ViewType)}
          />
        </div>

        <div className="p-6">
          {/* Monthly View */}
          {viewType === 'monthly' && (
            <div className="space-y-6">
              {/* Income vs Expenses Chart with Month-to-Month Comparison */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Month-to-Month Comparison
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={monthlyDataWithComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#10b981" name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Net Income"
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Categories */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Income Categories</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown.income}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryBreakdown.income.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {categoryBreakdown.income.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-medium text-slate-900">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expense Categories */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Expense Categories</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown.expenses}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryBreakdown.expenses.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {categoryBreakdown.expenses.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-medium text-slate-900">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Yearly View */}
          {viewType === 'yearly' && (
            <div className="space-y-6">
              {/* Year-to-Year Comparison */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Year-to-Year Comparison
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={yearlyDataWithComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#10b981" name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Net Income"
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Year-over-Year Growth */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Year-over-Year Growth</h3>
                <div className="space-y-4">
                  {yearlyDataWithComparison.slice(1).map((year) => (
                    <div key={year.year} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900">{year.year}</span>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-600">Income Growth</p>
                            <p
                              className={`font-bold ${
                                year.incomeGrowth > 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {year.incomeGrowth > 0 ? '+' : ''}
                              {year.incomeGrowth.toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-600">Expense Growth</p>
                            <p
                              className={`font-bold ${
                                year.expenseGrowth > 0 ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {year.expenseGrowth > 0 ? '+' : ''}
                              {year.expenseGrowth.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-slate-600">Income</p>
                          <p className="font-semibold text-slate-900">{formatCurrency(year.income)}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Expenses</p>
                          <p className="font-semibold text-slate-900">{formatCurrency(year.expenses)}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Net Income</p>
                          <p
                            className={`font-semibold ${
                              year.net > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(year.net)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Break Even Analysis */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Break Even Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-900 mb-2">Break Even Revenue</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(breakEven.breakEvenRevenue)}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-900 mb-2">Margin of Safety</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(breakEven.marginOfSafety)}
            </p>
            <p className="text-xs text-green-700 mt-1">
              ({breakEven.marginOfSafetyPercent.toFixed(1)}%)
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-900 mb-2">Contribution Margin</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(breakEven.contributionMargin)}
            </p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-sm text-indigo-900 mb-2">Contribution Margin Ratio</p>
            <p className="text-2xl font-bold text-indigo-600">
              {breakEven.contributionMarginRatio.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Additional KPIs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Additional Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Net Profit Growth</p>
            <p
              className={`text-2xl font-bold ${
                additionalKPIs.netProfitGrowth > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {additionalKPIs.netProfitGrowth > 0 ? '+' : ''}
              {additionalKPIs.netProfitGrowth.toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Collection Efficiency</p>
            <p className="text-2xl font-bold text-slate-900">
              {additionalKPIs.collectionEfficiency.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Rent Collection Rate</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Annual RevPAU</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(additionalKPIs.revPAU)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Per Unit Revenue</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Monthly RevPAU</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(additionalKPIs.monthlyRevPAU)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Per Unit/Month</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Contribution Margin Ratio</p>
            <p className="text-2xl font-bold text-slate-900">
              {additionalKPIs.contributionMarginRatio.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Of Revenue</p>
          </div>
        </div>
      </div>

      {/* Cash Flow */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Cash Flow Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={cashFlow}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Income" />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Cumulative Cash Flow"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Financial Ratios */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Financial Ratios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Profit Margin</p>
            <p className="text-3xl font-bold text-slate-900">
              {ratios.profitMargin.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Net Profit / Revenue</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Expense Ratio</p>
            <p className="text-3xl font-bold text-slate-900">
              {ratios.expenseRatio.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Expenses / Revenue</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Current Ratio</p>
            <p className="text-3xl font-bold text-slate-900">{ratios.currentRatio}</p>
            <p className="text-xs text-slate-500 mt-1">Income / Expenses</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Operating Expense Ratio</p>
            <p className="text-3xl font-bold text-slate-900">
              {ratios.operatingExpenseRatio.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Operating Costs / Revenue</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-2">Return on Revenue</p>
            <p className="text-3xl font-bold text-slate-900">
              {ratios.returnOnRevenue.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">ROI from Revenue</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;

import * as XLSX from 'xlsx';
import { RoomUnit, Building, Tenant, ExpenseItem, FlatFinancialMetrics } from '../types/crm';

export interface MonthlyCashflow {
  monthName: string; // "Jan", "Feb", etc.
  monthIndex: number; // 0-11
  revenue: number;
  realEstateRent: number;
  utilities: number;
  expenses: number;
  totalOutflow: number;
  netProfit: number;
  vacancyLoss: number;
}

export interface PortfolioFinancials {
  totalCapacity: number;
  totalOccupied: number;
  totalVacant: number;
  overallOccupancyRate: number;
  annualGrossPotentialRevenue: number;
  annualVacancyLoss: number;
  annualRealizedRevenue: number;
  annualRealEstateRent: number;
  annualUtilities: number;
  annualOperatingExpenses: number;
  totalAnnualOutflow: number;
  netAnnualProfit: number;
  overallProfitMargin: number;
  monthlyCashflows: MonthlyCashflow[];
}

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Calculates financial metrics, capacity, vacancy count and vacancy loss for a single room/flat
 */
export function calculateFlatFinancialMetrics(
  room: RoomUnit,
  building: Building | undefined,
  allTenants: Tenant[],
  allExpenses: ExpenseItem[]
): FlatFinancialMetrics {
  const capacity = Number(room.capacity) || 10;
  
  // Active tenants currently living in this room
  const activeTenants = allTenants.filter(
    t => (t.roomId === room.id || (!t.roomId && t.buildingId === room.buildingId)) && t.status === 'Active'
  );
  const occupiedCount = activeTenants.length;
  const vacancyCount = Math.max(0, capacity - occupiedCount);
  const occupancyRate = capacity > 0 ? Math.round((occupiedCount / capacity) * 1000) / 10 : 0;

  // Monthly current tenant rent
  const monthlyRealizedRent = activeTenants.reduce((sum, t) => sum + (Number(t.rentAmount) || 0), 0);
  
  // Average rent per bed in this flat
  const averageBedRent = occupiedCount > 0 
    ? Math.round(monthlyRealizedRent / occupiedCount) 
    : 800;

  // Potential rent if 100% full
  const monthlyPotentialRent = capacity * averageBedRent;
  const monthlyVacancyLoss = vacancyCount * averageBedRent;
  const annualVacancyLoss = monthlyVacancyLoss * 12;

  // Annual figures
  const annualGrossPotentialRevenue = monthlyPotentialRent * 12;
  const annualRealizedRevenue = monthlyRealizedRent * 12;

  // Real estate rent (if not set on room, fall back to building's split or 0)
  const annualRealEstateRent = Number(room.actualRentAnnual) || 0;
  
  const monthlyDewa = Number(room.dewaBill?.amount) || 0;
  const monthlyWifi = Number(room.wifiBill?.amount) || 0;
  const annualDewaBills = monthlyDewa * 12;
  const annualWifiBills = monthlyWifi * 12;

  // Logged expenses for this room
  const roomExpenses = allExpenses.filter(e => e.roomId === room.id);
  const annualLoggedExpenses = roomExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalAnnualExpenses = annualRealEstateRent + annualDewaBills + annualWifiBills + annualLoggedExpenses;
  const netAnnualProfit = annualRealizedRevenue - totalAnnualExpenses;
  const profitMarginPercent = annualRealizedRevenue > 0 
    ? Math.round((netAnnualProfit / annualRealizedRevenue) * 1000) / 10 
    : 0;

  return {
    roomId: room.id,
    roomNumber: room.roomNumber,
    buildingId: room.buildingId,
    buildingName: building?.name || 'Building',
    capacity,
    occupiedCount,
    vacancyCount,
    occupancyRate,
    averageBedRent,
    monthlyPotentialRent,
    monthlyVacancyLoss,
    annualVacancyLoss,
    annualGrossPotentialRevenue,
    annualRealizedRevenue,
    annualRealEstateRent,
    annualDewaBills,
    annualWifiBills,
    annualLoggedExpenses,
    totalAnnualExpenses,
    netAnnualProfit,
    profitMarginPercent,
  };
}

/**
 * Aggregates portfolio-wide financial metrics and monthly cashflow distributions
 */
export function calculatePortfolioFinancials(
  rooms: RoomUnit[],
  buildings: Building[],
  tenants: Tenant[],
  expenses: ExpenseItem[],
  selectedRoomId: string = 'all'
): { flatMetrics: FlatFinancialMetrics[]; portfolio: PortfolioFinancials } {
  const filteredRooms = selectedRoomId === 'all'
    ? rooms
    : rooms.filter(r => r.id === selectedRoomId);

  const flatMetrics = filteredRooms.map(r => {
    const bld = buildings.find(b => b.id === r.buildingId);
    return calculateFlatFinancialMetrics(r, bld, tenants, expenses);
  });

  const totalCapacity = flatMetrics.reduce((sum, m) => sum + m.capacity, 0);
  const totalOccupied = flatMetrics.reduce((sum, m) => sum + m.occupiedCount, 0);
  const totalVacant = Math.max(0, totalCapacity - totalOccupied);
  const overallOccupancyRate = totalCapacity > 0 
    ? Math.round((totalOccupied / totalCapacity) * 1000) / 10 
    : 0;

  const annualGrossPotentialRevenue = flatMetrics.reduce((sum, m) => sum + m.annualGrossPotentialRevenue, 0);
  const annualVacancyLoss = flatMetrics.reduce((sum, m) => sum + m.annualVacancyLoss, 0);
  const annualRealizedRevenue = flatMetrics.reduce((sum, m) => sum + m.annualRealizedRevenue, 0);
  const annualRealEstateRent = flatMetrics.reduce((sum, m) => sum + m.annualRealEstateRent, 0);
  const annualUtilities = flatMetrics.reduce((sum, m) => sum + m.annualDewaBills + m.annualWifiBills, 0);
  const annualOperatingExpenses = flatMetrics.reduce((sum, m) => sum + m.annualLoggedExpenses, 0);
  const totalAnnualOutflow = annualRealEstateRent + annualUtilities + annualOperatingExpenses;
  const netAnnualProfit = annualRealizedRevenue - totalAnnualOutflow;
  const overallProfitMargin = annualRealizedRevenue > 0 
    ? Math.round((netAnnualProfit / annualRealizedRevenue) * 1000) / 10 
    : 0;

  // Monthly distributions (Jan through Dec)
  const monthlyCashflows: MonthlyCashflow[] = MONTH_NAMES.map((name, idx) => {
    const monthlyRev = Math.round(annualRealizedRevenue / 12);
    const monthlyRERent = Math.round(annualRealEstateRent / 12);
    const monthlyUtils = Math.round(annualUtilities / 12);

    // Filter actual expenses that occurred in this month (DD.MM.YYYY)
    const monthNumStr = (idx + 1).toString().padStart(2, '0');
    const expensesInMonth = expenses.filter(e => {
      if (selectedRoomId !== 'all' && e.roomId !== selectedRoomId) return false;
      const parts = e.date.split('.');
      if (parts.length === 3 && parts[1] === monthNumStr) return true;
      return false;
    });

    const monthLoggedExp = expensesInMonth.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalOut = monthlyRERent + monthlyUtils + monthLoggedExp;
    const net = monthlyRev - totalOut;
    const vacLoss = Math.round(annualVacancyLoss / 12);

    return {
      monthName: name,
      monthIndex: idx,
      revenue: monthlyRev,
      realEstateRent: monthlyRERent,
      utilities: monthlyUtils,
      expenses: monthLoggedExp,
      totalOutflow: totalOut,
      netProfit: net,
      vacancyLoss: vacLoss
    };
  });

  return {
    flatMetrics,
    portfolio: {
      totalCapacity,
      totalOccupied,
      totalVacant,
      overallOccupancyRate,
      annualGrossPotentialRevenue,
      annualVacancyLoss,
      annualRealizedRevenue,
      annualRealEstateRent,
      annualUtilities,
      annualOperatingExpenses,
      totalAnnualOutflow,
      netAnnualProfit,
      overallProfitMargin,
      monthlyCashflows
    }
  };
}

/**
 * Generates and downloads a complete Excel spreadsheet (.xlsx) of the Profit & Loss statement
 */
export function exportProfitLossToExcel(
  flatMetrics: FlatFinancialMetrics[],
  portfolio: PortfolioFinancials,
  expenses: ExpenseItem[]
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive P&L Statement
  const summaryData = [
    ['RENTPULSE DUBAI - END OF YEAR PROFIT & LOSS STATEMENT'],
    ['Generated On', new Date().toLocaleDateString('en-GB')],
    [''],
    ['EXECUTIVE SUMMARY', 'AMOUNT (AED)', 'NOTES'],
    ['Gross Potential Tenant Revenue (100% Capacity)', portfolio.annualGrossPotentialRevenue, 'Maximum possible revenue if all beds filled'],
    ['Less: Vacancy Loss (Unoccupied Beds)', -portfolio.annualVacancyLoss, `Lost income from ${portfolio.totalVacant} vacant bed spaces`],
    ['Effective Realized Tenant Revenue', portfolio.annualRealizedRevenue, 'Actual rent inflow from active tenants'],
    [''],
    ['EXPENSES & OUTFLOWS', 'AMOUNT (AED)', 'NOTES'],
    ['Flat Actual Rent Paid to Real Estate / Landlords', portfolio.annualRealEstateRent, 'Annual master lease contract payments'],
    ['Electricity & Water (DEWA)', flatMetrics.reduce((s, m) => s + m.annualDewaBills, 0), 'Annual room DEWA utility bills'],
    ['High Speed Wi-Fi (Du / Etisalat)', flatMetrics.reduce((s, m) => s + m.annualWifiBills, 0), 'Annual internet router subscriptions'],
    ['Flat Maintenance, Cleaning & Operating Expenses', portfolio.annualOperatingExpenses, 'AC cleaning, gas cylinders, plumbing, pest control'],
    ['TOTAL ANNUAL EXPENSES', portfolio.totalAnnualOutflow, 'Combined master lease + utilities + operations'],
    [''],
    ['NET PROFIT / LOSS', portfolio.netAnnualProfit, portfolio.netAnnualProfit >= 0 ? 'NET PROFITABLE' : 'NET LOSS'],
    ['PROFIT MARGIN %', `${portfolio.overallProfitMargin}%`, 'Net Profit / Realized Revenue'],
    [''],
    ['PORTFOLIO OCCUPANCY METRICS', 'COUNT', 'PERCENTAGE'],
    ['Total Accommodatable Beds / Capacity', portfolio.totalCapacity, '100%'],
    ['Occupied Beds (Active Tenants)', portfolio.totalOccupied, `${portfolio.overallOccupancyRate}%`],
    ['Vacant Beds Available', portfolio.totalVacant, `${Math.round((portfolio.totalVacant / (portfolio.totalCapacity || 1)) * 1000) / 10}%`],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'P&L Annual Statement');

  // Sheet 2: Flat-by-Flat Breakdown & Vacancy
  const flatRows = flatMetrics.map((m, idx) => ({
    'S.No': idx + 1,
    'Building': m.buildingName,
    'Room / Flat Number': `Room ${m.roomNumber}`,
    'Capacity (Beds)': m.capacity,
    'Occupied Beds': m.occupiedCount,
    'Vacant Beds': m.vacancyCount,
    'Occupancy %': `${m.occupancyRate}%`,
    'Avg Bed Rent (AED)': m.averageBedRent,
    'Annual Vacancy Loss (AED)': m.annualVacancyLoss,
    'Real Estate Rent to Landlord (AED)': m.annualRealEstateRent,
    'Annual Utilities (DEWA + Wi-Fi)': m.annualDewaBills + m.annualWifiBills,
    'Maintenance & Logged Expenses (AED)': m.annualLoggedExpenses,
    'Annual Tenant Revenue Inflow (AED)': m.annualRealizedRevenue,
    'Net Annual Profit (AED)': m.netAnnualProfit,
    'Profit Margin %': `${m.profitMarginPercent}%`,
    'Status': m.netAnnualProfit >= 0 ? 'Profitable' : 'Loss'
  }));

  const wsFlats = XLSX.utils.json_to_sheet(flatRows);
  XLSX.utils.book_append_sheet(wb, wsFlats, 'Flat-by-Flat P&L');

  // Sheet 3: Itemized Expenses Log
  const expenseRows = expenses.map((e, idx) => ({
    'S.No': idx + 1,
    'Date': e.date,
    'Flat / Room': e.roomId,
    'Category': e.category,
    'Expense Title': e.title,
    'Amount (AED)': e.amount,
    'Payment Method': e.paidBy || 'Cash',
    'Invoice / Receipt Ref': e.invoiceRef || '-',
    'Notes': e.notes || '-'
  }));

  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Itemized Expenses Log');

  // Generate and trigger download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `RentPulse_Dubai_Profit_Loss_${dateStr}.xlsx`);
}

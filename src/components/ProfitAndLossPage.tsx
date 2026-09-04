import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  DoorOpen, 
  Users, 
  Coins, 
  FileSpreadsheet, 
  Plus, 
  Receipt, 
  Calendar, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  Filter, 
  Zap, 
  Wifi, 
  Info,
  DollarSign
} from 'lucide-react';
import { RoomUnit, Building, Tenant, ExpenseItem, FlatFinancialMetrics, ExpenseCategory } from '../types/crm';
import { calculatePortfolioFinancials, exportProfitLossToExcel } from '../utils/profitAndLossCalculator';

interface ProfitAndLossPageProps {
  rooms: RoomUnit[];
  buildings: Building[];
  tenants: Tenant[];
  expenses: ExpenseItem[];
  onOpenAddExpense: (roomId?: string) => void;
  onDeleteExpense: (expenseId: string) => void;
  onSelectRoomInSheet: (buildingId: string, roomId: string) => void;
}

export const ProfitAndLossPage: React.FC<ProfitAndLossPageProps> = ({
  rooms,
  buildings,
  tenants,
  expenses,
  onOpenAddExpense,
  onDeleteExpense,
  onSelectRoomInSheet,
}) => {
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');

  // Compute live financials
  const { flatMetrics, portfolio } = calculatePortfolioFinancials(
    rooms,
    buildings,
    tenants,
    expenses,
    selectedRoomFilter
  );

  const selectedRoomObj = rooms.find(r => r.id === selectedRoomFilter);

  // Filtered expenses for the ledger
  const filteredExpenses = expenses.filter(e => {
    if (selectedRoomFilter !== 'all' && e.roomId !== selectedRoomFilter) return false;
    if (selectedCategoryFilter !== 'all' && e.category !== selectedCategoryFilter) return false;
    if (expenseSearchQuery.trim()) {
      const q = expenseSearchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.invoiceRef && e.invoiceRef.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleExportExcel = () => {
    exportProfitLossToExcel(flatMetrics, portfolio, expenses);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
              <TrendingUp className="w-4 h-4" />
              <span>Financial Performance & Vacancy Analysis</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              End of the Year Profit & Loss (P&L)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Compare actual rent paid to real estate against tenant inflow, tracking unearned revenue from vacant beds, utility bills, and maintenance expenses.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onOpenAddExpense(selectedRoomFilter !== 'all' ? selectedRoomFilter : undefined)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-rose-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Flat Expense</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              title="Download full P&L balance sheet and flat breakdown to Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Export P&L (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="pt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Filter Scope:</span>
            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="bg-slate-800 text-xs font-bold text-white px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">Entire Portfolio (All Flats & Rooms)</option>
              {rooms.map(r => {
                const bld = buildings.find(b => b.id === r.buildingId);
                return (
                  <option key={r.id} value={r.id}>
                    {bld?.name || 'Building'} — Room {r.roomNumber} (Cap: {r.capacity} beds)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="text-xs font-medium text-slate-400">
            Financial Year: <span className="font-bold text-amber-300">2026</span> • Currency: <span className="font-bold text-white">AED (Dirhams)</span>
          </div>
        </div>
      </div>

      {/* --- EXECUTIVE KPI CARDS ROW WITH VACANCY REFLECTION --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Capacity & Vacancy Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Occupancy & Vacancy</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{portfolio.totalOccupied}</span>
            <span className="text-sm font-bold text-slate-400">/ {portfolio.totalCapacity} Beds</span>
          </div>
          
          {/* Vacancy Badge */}
          <div className="mt-2.5 flex items-center justify-between">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              portfolio.totalVacant > 0 
                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {portfolio.totalVacant > 0 ? `${portfolio.totalVacant} Vacant Bed${portfolio.totalVacant > 1 ? 's' : ''}` : 'Fully Occupied'}
            </span>
            <span className="text-xs font-bold text-slate-600">{portfolio.overallOccupancyRate}% full</span>
          </div>
        </div>

        {/* Card 2: Revenue vs Vacancy Loss */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tenant Revenue (Annual)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-700">AED {portfolio.annualRealizedRevenue.toLocaleString()}</span>
          </div>

          {/* Vacancy Loss Reflection */}
          <div className="mt-2.5 text-[11px] flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span className="text-slate-400">Vacancy Loss:</span>
            <span className="font-bold text-rose-600">
              - AED {portfolio.annualVacancyLoss.toLocaleString()} / yr
            </span>
          </div>
        </div>

        {/* Card 3: Actual Rent to Real Estate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Real Estate Actual Rent</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">AED {portfolio.annualRealEstateRent.toLocaleString()}</span>
            <span className="text-xs text-slate-400">/ yr</span>
          </div>
          <div className="mt-2.5 text-[11px] flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span className="text-slate-400">Monthly Contract:</span>
            <span className="font-bold text-slate-700">
              AED {Math.round(portfolio.annualRealEstateRent / 12).toLocaleString()} / mo
            </span>
          </div>
        </div>

        {/* Card 4: Operating Expenses & Utilities */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Utilities & Operations</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">
              AED {(portfolio.annualUtilities + portfolio.annualOperatingExpenses).toLocaleString()}
            </span>
          </div>
          <div className="mt-2.5 text-[11px] flex items-center justify-between border-t border-slate-100 pt-1.5 text-slate-500">
            <span>DEWA/Net: {portfolio.annualUtilities.toLocaleString()}</span>
            <span>•</span>
            <span>Maint: {portfolio.annualOperatingExpenses.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 5: Net Profit / Loss Bottom Line */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          portfolio.netAnnualProfit >= 0 
            ? 'bg-emerald-950/90 text-white border-emerald-800' 
            : 'bg-rose-950/90 text-white border-rose-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              {portfolio.netAnnualProfit >= 0 ? 'Net Annual Profit' : 'Net Annual Loss'}
            </span>
            <div className="p-2 bg-white/10 rounded-xl">
              {portfolio.netAnnualProfit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black">
              {portfolio.netAnnualProfit >= 0 ? '+' : ''}AED {portfolio.netAnnualProfit.toLocaleString()}
            </span>
          </div>
          <div className="mt-2.5 text-[11px] flex items-center justify-between border-t border-white/10 pt-1.5 text-white/80">
            <span>Profit Margin:</span>
            <span className="font-bold text-amber-300 text-sm">{portfolio.overallProfitMargin}%</span>
          </div>
        </div>

      </div>

      {/* Vacancy Loss Warning Banner if Vacant Beds Exist */}
      {portfolio.totalVacant > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start sm:items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                {portfolio.totalVacant} Vacant Bed Spaces Detected Across Filtered Flats
              </h4>
              <p className="text-xs text-amber-800">
                Each empty bed reduces your net profit. You are losing approximately <span className="font-bold text-rose-700">AED {Math.round(portfolio.annualVacancyLoss / 12).toLocaleString()} per month</span> (AED {portfolio.annualVacancyLoss.toLocaleString()} annually) until these spaces are filled.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW 1: FLAT-BY-FLAT PROFITABILITY & VACANCY TABLE --- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span>Flat-by-Flat Profitability & Vacancy Comparison</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side financial breakdown: Real Estate Rent vs Inflow vs Vacancy Loss vs Net Margin.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Flat / Room</th>
                <th className="py-3 px-2 text-center">Capacity</th>
                <th className="py-3 px-2 text-center">Occupied</th>
                <th className="py-3 px-2 text-center">Vacant</th>
                <th className="py-3 px-3 text-right">Vacancy Loss</th>
                <th className="py-3 px-3 text-right">Real Estate Rent</th>
                <th className="py-3 px-3 text-right">Utilities & Maint</th>
                <th className="py-3 px-3 text-right">Tenant Inflow</th>
                <th className="py-3 px-3.5 text-right">Net Profit</th>
                <th className="py-3 px-2 text-center">Margin %</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {flatMetrics.map((m) => {
                return (
                  <tr key={m.roomId} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 text-sm">Room {m.roomNumber}</div>
                      <div className="text-[11px] text-slate-500">{m.buildingName}</div>
                    </td>

                    {/* Capacity */}
                    <td className="py-3 px-2 text-center font-bold text-slate-700">
                      {m.capacity} beds
                    </td>

                    {/* Occupied */}
                    <td className="py-3 px-2 text-center font-bold text-blue-700">
                      {m.occupiedCount}
                    </td>

                    {/* Vacant */}
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        m.vacancyCount > 0 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {m.vacancyCount > 0 ? `${m.vacancyCount} Vacant` : 'Full'}
                      </span>
                    </td>

                    {/* Vacancy Loss */}
                    <td className="py-3 px-3 text-right font-medium text-rose-600">
                      {m.vacancyCount > 0 ? `-AED ${m.annualVacancyLoss.toLocaleString()}` : '-'}
                    </td>

                    {/* Real Estate Rent */}
                    <td className="py-3 px-3 text-right font-bold text-slate-800">
                      AED {m.annualRealEstateRent.toLocaleString()}
                    </td>

                    {/* Utilities & Logged Expenses */}
                    <td className="py-3 px-3 text-right font-medium text-slate-600">
                      AED {(m.annualDewaBills + m.annualWifiBills + m.annualLoggedExpenses).toLocaleString()}
                    </td>

                    {/* Realized Inflow */}
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      AED {m.annualRealizedRevenue.toLocaleString()}
                    </td>

                    {/* Net Profit */}
                    <td className={`py-3 px-3.5 text-right font-black text-sm ${
                      m.netAnnualProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {m.netAnnualProfit >= 0 ? '+' : ''}AED {m.netAnnualProfit.toLocaleString()}
                    </td>

                    {/* Margin */}
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        m.profitMarginPercent >= 20 ? 'bg-emerald-100 text-emerald-800' :
                        m.profitMarginPercent > 0 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {m.profitMarginPercent}%
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onSelectRoomInSheet(m.buildingId, m.roomId)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-semibold transition"
                      >
                        View Sheet
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- VIEW 2: MONTH-BY-MONTH CASHFLOW BREAKDOWN --- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Monthly Cashflow & Profit Distribution (Jan – Dec)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            12-Month distribution showing monthly revenue inflow, real estate rent, utilities, and net monthly bottom line.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {portfolio.monthlyCashflows.map(m => (
            <div 
              key={m.monthName}
              className={`p-3 rounded-2xl border transition ${
                m.netProfit >= 0 ? 'bg-slate-50/70 border-slate-200' : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>{m.monthName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  m.netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {m.netProfit >= 0 ? '+' : ''}AED {m.netProfit.toLocaleString()}
                </span>
              </div>
              <div className="space-y-0.5 text-[10px] text-slate-500">
                <div className="flex justify-between">
                  <span>Inflow:</span>
                  <span className="font-semibold text-emerald-700">AED {m.revenue}</span>
                </div>
                <div className="flex justify-between">
                  <span>Master Rent:</span>
                  <span>AED {m.realEstateRent}</span>
                </div>
                <div className="flex justify-between">
                  <span>Utils & Exp:</span>
                  <span>AED {m.utilities + m.expenses}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- VIEW 3: ITEMIZED FLAT EXPENSES LEDGER --- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-500" />
              <span>Itemized Flat Operational Expenses ({filteredExpenses.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Log of all maintenance repairs, gas cylinders, maid cleaning, pest control, and Ejari fees.
            </p>
          </div>

          {/* Ledger Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
            >
              <option value="all">All Expense Categories</option>
              <option value="AC Maintenance & Repair">AC Maintenance & Repair</option>
              <option value="Plumbing & Electrical">Plumbing & Electrical</option>
              <option value="Cleaning & Maid Service">Cleaning & Maid Service</option>
              <option value="Gas / LPG Cylinder">Gas / LPG Cylinder</option>
              <option value="Supplies (Bedding, Locks, Curtains)">Supplies</option>
              <option value="Pest Control">Pest Control</option>
              <option value="Ejari Registration Fee">Ejari Fee</option>
            </select>

            <button
              onClick={() => onOpenAddExpense(selectedRoomFilter !== 'all' ? selectedRoomFilter : undefined)}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Expenses List */}
        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 italic">
              No expenses recorded matching the current filter. Click "+ Add Expense" above to record any maintenance or operational cost.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-3">Flat / Room</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Paid By</th>
                  <th className="py-2.5 px-3">Invoice Ref</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const targetRoom = rooms.find(r => r.id === exp.roomId);
                  const targetBld = buildings.find(b => b.id === (targetRoom?.buildingId || exp.buildingId));

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-600">
                        {exp.date}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        Room {targetRoom?.roomNumber || 'Unit'} ({targetBld?.name || 'Building'})
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-[10px] text-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 font-medium">
                        {exp.title}
                        {exp.notes && (
                          <span className="text-[11px] text-slate-400 block italic">{exp.notes}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-700 text-sm">
                        AED {exp.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {exp.paidBy || 'Cash'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {exp.invoiceRef || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Delete expense "${exp.title}" (AED ${exp.amount})?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

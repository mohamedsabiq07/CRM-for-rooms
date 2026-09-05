import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap, 
  Wifi, 
  ArrowRight, 
  History, 
  TrendingUp, 
  FolderArchive,
  Star
} from 'lucide-react';
import { Tenant, RoomUnit, MonthlyUtilityBill } from '../types/crm';
import { getTenantStatusForMonth, searchMatchesMonth, STANDARD_MONTHS } from '../utils/dateUtils';

interface MonthHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: string[];
  tenants: Tenant[];
  rooms: RoomUnit[];
  utilityBills: MonthlyUtilityBill[];
  activeStayMonth?: string;
}

export const MonthHistoryModal: React.FC<MonthHistoryModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  onSelectMonth,
  availableMonths,
  tenants,
  rooms,
  utilityBills,
  activeStayMonth = 'Sep-2026'
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [customMonthInput, setCustomMonthInput] = useState('');

  // Combine standard and discovered months uniquely
  const allMonths = Array.from(new Set([...STANDARD_MONTHS, ...availableMonths])).sort((a, b) => {
    // Keep 2026 in standard order
    const idxA = STANDARD_MONTHS.indexOf(a);
    const idxB = STANDARD_MONTHS.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
  });

  const filteredMonths = allMonths.filter(m => searchMatchesMonth(m, searchQuery));

  const handleSelect = (month: string) => {
    onSelectMonth(month);
    onClose();
  };

  const handleCustomMonthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMonthInput.trim()) return;
    const formatted = customMonthInput.trim();
    onSelectMonth(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-[#181824] text-white flex items-center justify-between border-b border-[#262638] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#222234] text-[#38CE3C] rounded-xl border border-[#2f2f45]">
              <FolderArchive className="w-5 h-5 text-[#38CE3C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Month Archive & Historical Data Review</h3>
                <span className="text-[10px] bg-[#38CE3C]/15 text-[#38CE3C] px-2 py-0.5 rounded font-semibold border border-[#38CE3C]/30">
                  Reference Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Search or select any previous or current month to review historical tenant occupancy, rent collections, and utility bills.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Action Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Real-time Month Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search month (e.g. Aug, August 2026, Jul, Sep)..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Custom Month Input */}
          <form onSubmit={handleCustomMonthSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={customMonthInput}
              onChange={(e) => setCustomMonthInput(e.target.value)}
              placeholder="e.g. May-2026"
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 w-28 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!customMonthInput.trim()}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition cursor-pointer"
            >
              Open Month
            </button>
          </form>
        </div>

        {/* Scrollable Month Catalog Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>AVAILABLE RECORDED MONTHS ({filteredMonths.length})</span>
            <span>Currently viewing: <strong className="text-slate-900 font-bold">{selectedMonth}</strong></span>
          </div>

          {filteredMonths.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No months match "{searchQuery}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching by month name (e.g. "Aug", "September") or enter a custom month above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredMonths.map((m) => {
                const isSelected = m === selectedMonth;
                const isActiveMonth = m === activeStayMonth;

                // Compute financial & occupancy breakdown for month m
                const activeTenantsInM = tenants.filter(t => t.status === 'Active');
                const totalPotentialRent = activeTenantsInM.reduce((sum, t) => sum + (t.rentAmount || 0), 0);
                
                let paidCount = 0;
                let paidAmount = 0;
                let dueCount = 0;
                let dueAmount = 0;

                activeTenantsInM.forEach(t => {
                  const st = getTenantStatusForMonth(t, m);
                  if (st === 'Paid') {
                    paidCount++;
                    paidAmount += (t.rentAmount || 0);
                  } else {
                    dueCount++;
                    dueAmount += (t.rentAmount || 0);
                  }
                });

                const collectionRate = totalPotentialRent > 0 ? Math.round((paidAmount / totalPotentialRent) * 100) : 0;

                // Utility bills summary for month m
                const monthBills = utilityBills.filter(b => b.month === m);
                const dewaBill = monthBills.find(b => b.utilityType === 'DEWA' || b.utilityType === 'SEWA');
                const wifiBill = monthBills.find(b => b.utilityType === 'Wi-Fi');

                return (
                  <div
                    key={m}
                    className={`rounded-xl p-4 border transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50/50 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                        : isActiveMonth
                          ? 'bg-emerald-50/30 border-emerald-300 hover:border-emerald-500'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Month Title & Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                          <span className="font-bold text-slate-900 text-sm">{m}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isActiveMonth && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <Star className="w-2.5 h-2.5 fill-current" /> Active Month
                            </span>
                          )}
                          {isSelected && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                              Viewing Now
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Collections & Progress */}
                      <div className="space-y-1.5 my-3 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">Rent Collection:</span>
                          <span className="font-bold text-slate-900">AED {paidAmount.toLocaleString()} / {totalPotentialRent.toLocaleString()}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-[#38CE3C] h-full transition-all duration-300"
                            style={{ width: `${collectionRate}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="text-emerald-700 font-semibold">{paidCount} Paid</span>
                          <span className="text-rose-600 font-semibold">{dueCount} Due</span>
                          <span className="font-bold text-slate-700">{collectionRate}% Settled</span>
                        </div>
                      </div>

                      {/* Utility Bills Status */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 mb-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>DEWA: {dewaBill ? (dewaBill.status === 'Paid' ? '✓ Paid' : 'Due') : 'Not entered'}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Wifi className="w-3 h-3 text-indigo-500" />
                          <span>Wi-Fi: {wifiBill ? (wifiBill.status === 'Paid' ? '✓ Paid' : 'Due') : 'Not entered'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleSelect(m)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs cursor-default'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Currently Selected</span>
                        </>
                      ) : (
                        <>
                          <span>Review {m} Data</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px]">
            💡 Tip: Selecting any month switches all tenant spreadsheet collections, vacancy rates, and utility bills to that month for reference.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

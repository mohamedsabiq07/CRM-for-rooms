import React from 'react';
import { Users, Coins, CheckCircle2, Hourglass } from 'lucide-react';
import { Tenant } from '../types/crm';
import { getTenantStatusForMonth } from '../utils/dateUtils';

interface StatsCardsProps {
  tenants: Tenant[];
  flatName: string;
  selectedMonth?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ tenants, selectedMonth = 'Sep-2026' }) => {
  const activeTenants = tenants.filter(t => t.status === 'Active');
  const totalRent = activeTenants.reduce((sum, t) => sum + (Number(t.rentAmount) || 0), 0);

  let totalGiven = 0;
  let paidCount = 0;
  let partialCount = 0;
  let dueCount = 0;

  activeTenants.forEach(t => {
    const st = getTenantStatusForMonth(t, selectedMonth);
    const rent = Number(t.rentAmount) || 0;
    const amountPaid = t.monthPaymentAmounts?.[selectedMonth] ?? (st === 'Paid' ? rent : 0);

    totalGiven += amountPaid;
    if (st === 'Paid' || amountPaid >= rent) {
      paidCount++;
    } else if (st === 'Partial' || (amountPaid > 0 && amountPaid < rent)) {
      partialCount++;
    } else {
      dueCount++;
    }
  });

  const totalPendingAmount = Math.max(0, totalRent - totalGiven);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
      {/* 1. Active Tenants */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-[#181824] shadow-2xs flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-slate-100 text-[#181824] shrink-0">
          <Users className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Tenants</p>
          <p className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
            {activeTenants.length}
          </p>
        </div>
      </div>

      {/* 2. Monthly Rent Total */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-indigo-600 shadow-2xs flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
          <Coins className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Total Rent</p>
          <p className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight truncate">
            AED {totalRent.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 3. Paid / Collected */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-[#38CE3C] shadow-2xs flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-[#38CE3C]/10 text-[#1e7e22] shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase">
            Paid ({paidCount}{partialCount > 0 ? `+${partialCount}` : ''})
          </p>
          <p className="text-base sm:text-lg font-extrabold text-emerald-700 leading-tight truncate">
            AED {totalGiven.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 4. Pending / Due */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-rose-500 shadow-2xs flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
          <Hourglass className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase">
            Due ({dueCount})
          </p>
          <p className={`text-base sm:text-lg font-extrabold leading-tight truncate ${totalPendingAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
            AED {totalPendingAmount.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

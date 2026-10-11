import React from 'react';
import { Users, Coins, AlertCircle, Key, CheckCircle2, Clock, Hourglass } from 'lucide-react';
import { Tenant } from '../types/crm';
import { getTenantStatusForMonth } from '../utils/dateUtils';

interface StatsCardsProps {
  tenants: Tenant[];
  flatName: string;
  selectedMonth?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ tenants, flatName, selectedMonth = 'Sep-2026' }) => {
  const activeTenants = tenants.filter(t => t.status === 'Active');
  const waitingTenants = tenants.filter(t => t.status === 'Waiting for new tenant');
  const totalDeposit = activeTenants.reduce((sum, t) => sum + (Number(t.deposit) || 0), 0);
  const totalRent = activeTenants.reduce((sum, t) => sum + (Number(t.rentAmount) || 0), 0);
  
  // Calculate exact AED given vs AED pending
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
  const keysGiven = activeTenants.filter(t => t.cupboardKey && t.doorKey).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      {/* 1. Active Tenants */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-[#181824] shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-slate-100 text-[#181824] border border-slate-200 shrink-0">
          <Users className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Active Tenants</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900">{activeTenants.length}</span>
            <span className="text-xs text-slate-400 truncate">in {flatName.split('-')[0].trim()}</span>
          </div>
          {waitingTenants.length > 0 && (
            <p className="text-[10px] font-semibold text-amber-600 mt-0.5 truncate">
              ⏳ {waitingTenants.length} waiting for tenant
            </p>
          )}
        </div>
      </div>

      {/* 2. Monthly Expected Rent */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-indigo-600 shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
          <Coins className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Monthly Rent Total</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-900">AED {totalRent.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Target for {selectedMonth}</p>
        </div>
      </div>

      {/* 3. Payments Given / Received */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-[#38CE3C] shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-[#38CE3C]/10 text-[#1e7e22] border border-[#38CE3C]/20 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Given / Collected</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-emerald-700">AED {totalGiven.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-600 font-medium">
            <span className="text-emerald-700 font-bold">✓ {paidCount} Paid</span>
            {partialCount > 0 && (
              <span className="text-amber-700 font-bold">• {partialCount} Partial</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Pending Payments */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-rose-500 shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
          <Hourglass className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Pending Payments</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-lg font-bold ${totalPendingAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              AED {totalPendingAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-600 font-medium">
            <span className="text-rose-600 font-bold">{dueCount} Unpaid</span>
            {partialCount > 0 && (
              <span className="text-amber-700 font-semibold">• {partialCount} Balances</span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Deposit Held & Keys */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-[#8E32E9] shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
        <div className="p-2.5 rounded-lg bg-[#8E32E9]/10 text-[#8E32E9] border border-[#8E32E9]/20 shrink-0">
          <Coins className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Deposit Held</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-900">AED {totalDeposit.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
            <Key className="w-3 h-3 text-slate-400" />
            <span>{keysGiven} / {activeTenants.length} keys handed</span>
          </p>
        </div>
      </div>
    </div>
  );
};

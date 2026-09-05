import React from 'react';
import { Users, Coins, AlertCircle, Key, CheckCircle2 } from 'lucide-react';
import { Tenant } from '../types/crm';
import { getTenantStatusForMonth } from '../utils/dateUtils';

interface StatsCardsProps {
  tenants: Tenant[];
  flatName: string;
  selectedMonth?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ tenants, flatName, selectedMonth = 'Sep-2026' }) => {
  const activeTenants = tenants.filter(t => t.status === 'Active');
  const totalDeposit = activeTenants.reduce((sum, t) => sum + (Number(t.deposit) || 0), 0);
  const totalRent = activeTenants.reduce((sum, t) => sum + (Number(t.rentAmount) || 0), 0);
  
  const paidCount = activeTenants.filter(t => getTenantStatusForMonth(t, selectedMonth) === 'Paid').length;
  const dueCount = activeTenants.filter(t => {
    const st = getTenantStatusForMonth(t, selectedMonth);
    return st === 'Due' || st === 'Pending';
  }).length;
  const keysGiven = activeTenants.filter(t => t.cupboardKey && t.doorKey).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      {/* Active Tenants */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-[#181824] shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-slate-100 text-[#181824] border border-slate-200">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Tenants</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900">{activeTenants.length}</span>
            <span className="text-xs text-slate-400">in {flatName.split('-')[0].trim()}</span>
          </div>
        </div>
      </div>

      {/* Advance Deposit */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-[#8E32E9] shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-[#8E32E9]/10 text-[#8E32E9] border border-[#8E32E9]/20">
          <Coins className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Deposit Held</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-900">AED {totalDeposit.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Monthly Rent */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-[#38CE3C] shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-[#38CE3C]/10 text-[#1e7e22] border border-[#38CE3C]/20">
          <Coins className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Monthly Total</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-900">AED {totalRent.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Rent Paid vs Pending */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-[#FF4D6B] shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-[#FF4D6B]/10 text-[#FF4D6B] border border-[#FF4D6B]/20">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            {selectedMonth} Status
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-[#1e7e22] flex items-center gap-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#38CE3C]" /> {paidCount}
            </span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-sm font-semibold text-[#FF4D6B]">
              {dueCount} Due
            </span>
          </div>
        </div>
      </div>

      {/* Keys Handover */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-[#FFDE73] shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
        <div className="p-2.5 rounded-lg bg-[#FFDE73]/20 text-[#8C6B00] border border-[#FFDE73]/40">
          <Key className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Keys Given</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-900">{keysGiven}</span>
            <span className="text-xs text-slate-400">/ {activeTenants.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

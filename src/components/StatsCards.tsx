import React from 'react';
import { Users, Coins, AlertCircle, Key, CheckCircle2 } from 'lucide-react';
import { Tenant } from '../types/crm';

interface StatsCardsProps {
  tenants: Tenant[];
  flatName: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ tenants, flatName }) => {
  const activeTenants = tenants.filter(t => t.status === 'Active');
  const totalDeposit = activeTenants.reduce((sum, t) => sum + (Number(t.deposit) || 0), 0);
  const totalRent = activeTenants.reduce((sum, t) => sum + (Number(t.rentAmount) || 0), 0);
  
  const paidCount = activeTenants.filter(t => t.currentMonthStatus === 'Paid').length;
  const dueCount = activeTenants.filter(t => t.currentMonthStatus === 'Due' || t.currentMonthStatus === 'Pending').length;
  const keysGiven = activeTenants.filter(t => t.cupboardKey && t.doorKey).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      {/* Active Tenants */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Active Tenants</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900">{activeTenants.length}</span>
            <span className="text-xs text-slate-400">in {flatName.split('-')[0].trim()}</span>
          </div>
        </div>
      </div>

      {/* Advance Deposit */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Deposit Held</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">AED {totalDeposit.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Monthly Rent */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Monthly Total</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">AED {totalRent.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Rent Paid vs Pending */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Rent Status</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-emerald-600 flex items-center gap-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {paidCount}
            </span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-sm font-bold text-rose-600">
              {dueCount} Due
            </span>
          </div>
        </div>
      </div>

      {/* Keys Handover */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Both Keys Given</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">{keysGiven}</span>
            <span className="text-xs text-slate-400">/ {activeTenants.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

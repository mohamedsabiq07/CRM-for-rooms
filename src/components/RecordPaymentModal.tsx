import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldAlert, Banknote, Calendar, Check, RotateCcw } from 'lucide-react';
import { Tenant } from '../types/crm';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  selectedMonth?: string;
  onSavePayment: (
    tenantId: string,
    amount: number,
    status: 'Paid' | 'Partial' | 'Due' | 'Pending',
    remarks: string,
    date: string,
    month?: string
  ) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  tenant,
  selectedMonth,
  onSavePayment,
}) => {
  if (!isOpen || !tenant) return null;

  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '.');

  const rent = Number(tenant.rentAmount) || 0;

  // Previous payment info for this month
  const prevStatus = (() => {
    if (selectedMonth && tenant.monthStatusHistory?.[selectedMonth]) {
      return tenant.monthStatusHistory[selectedMonth];
    }
    return tenant.currentMonthStatus || 'Due';
  })();

  const prevAmountPaid: number = (() => {
    if (selectedMonth && tenant.monthPaymentAmounts?.[selectedMonth] != null) {
      return Number(tenant.monthPaymentAmounts[selectedMonth]) || 0;
    }
    return prevStatus === 'Paid' ? rent : 0;
  })();

  // Default input value: if previous amount paid exists, use it; otherwise default to rent if paid, or rent as quick default
  const [amountStr, setAmountStr] = useState<string>(() => {
    if (prevAmountPaid > 0) return prevAmountPaid.toString();
    if (prevStatus === 'Paid') return rent.toString();
    return rent.toString(); // Default to full rent so 1-click confirm settles it immediately!
  });

  const [remarks, setRemarks] = useState(tenant.remarks || '');
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [isConfirmingDowngrade, setIsConfirmingDowngrade] = useState(false);

  const amount = Math.max(0, Number(amountStr) || 0);
  const balance = Math.max(0, rent - amount);

  // Derive status from entered amount
  const newStatus: 'Paid' | 'Partial' | 'Due' =
    amount >= rent && rent > 0 ? 'Paid' : amount > 0 ? 'Partial' : 'Due';

  // Dangerous action check: downgrading from Paid to Due/Partial by accident
  const isDowngrade =
    (prevStatus === 'Paid' && newStatus !== 'Paid') ||
    (prevStatus === 'Partial' && newStatus === 'Due');

  const handleSave = () => {
    // If downgrading payment status and not yet confirmed, ask user for confirmation
    if (isDowngrade && !isConfirmingDowngrade) {
      setIsConfirmingDowngrade(true);
      return;
    }

    onSavePayment(tenant.id, amount, newStatus, remarks, paymentDate, selectedMonth);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">

        {/* Modal Header */}
        <div className="p-4 bg-[#181824] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-[#38CE3C] rounded-lg border border-slate-700">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Record Customer Payment</h3>
                {selectedMonth && (
                  <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-indigo-600 text-white">
                    {selectedMonth}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {tenant.name} • {tenant.partition ? tenant.partition.toUpperCase() : 'BED'} ({tenant.section})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Downgrade Safeguard Warning Modal State */}
        {isConfirmingDowngrade ? (
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 bg-rose-50 border-2 border-rose-300 rounded-xl p-4 text-xs text-rose-900">
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-900 mb-1">Warning: Changing Payment to Lower Status!</p>
                <p className="text-rose-700 leading-relaxed">
                  This customer was previously marked as <strong>{prevStatus}</strong> (AED {prevAmountPaid} paid).
                  You are now setting it to <strong>{newStatus}</strong> (AED {amount} paid).
                </p>
                <p className="mt-2 font-semibold text-rose-800">
                  Are you sure this is not a mistake?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingDowngrade(false)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                ← Cancel & Keep Previous
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-sm cursor-pointer"
              >
                Yes, Change to {newStatus}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">

            {/* Standard Rent for this tenant */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Assigned Room Rent</p>
                <p className="text-xl font-extrabold text-slate-900">AED {rent.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">Monthly partition / bed rent</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Deposit Advance</p>
                <p className="text-sm font-bold text-slate-800">
                  {tenant.depositNote || `AED ${tenant.deposit}`}
                </p>
                <p className="text-[10px] text-slate-400">Held security</p>
              </div>
            </div>

            {/* Amount input: Out of rent, how much paid? */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  Amount Customer Paid (AED)
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  Target: AED {rent.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  AED
                </span>
                <input
                  type="number"
                  min="0"
                  max={rent * 2}
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder={`e.g. ${rent}`}
                  className="w-full text-2xl font-extrabold pl-14 pr-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 text-slate-900 font-mono shadow-inner"
                />
              </div>
            </div>

            {/* Out of X, Y has been paid status display */}
            <div className={`p-3.5 rounded-xl border-2 transition-all ${
              newStatus === 'Paid'
                ? 'bg-[#EAFBF0] border-[#38CE3C]/70 text-[#1B8020]'
                : newStatus === 'Partial'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Payment Status</p>
                  <p className="text-base font-extrabold flex items-center gap-1.5 mt-0.5">
                    {newStatus === 'Paid' && '✓ Paid in Full'}
                    {newStatus === 'Partial' && '⚡ Partial Payment'}
                    {newStatus === 'Due' && '❌ Not Paid (Due / Pending)'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Paid vs Total</p>
                  <p className="text-base font-extrabold font-mono mt-0.5">
                    AED {amount.toLocaleString()} / {rent.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Remaining balance line */}
              <div className="mt-2 pt-2 border-t border-current/20 flex items-center justify-between text-xs">
                <span className="font-semibold opacity-90">Remaining to be paid:</span>
                <span className={`font-bold font-mono ${balance > 0 ? 'text-rose-700' : 'text-emerald-800'}`}>
                  {balance > 0 ? `AED ${balance.toLocaleString()} Pending` : '✓ Fully Cleared (0 Balance)'}
                </span>
              </div>
            </div>

            {/* Quick 1-Click Fill Buttons */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quick Actions</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAmountStr(rent.toString())}
                  className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Full: {rent}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAmountStr(Math.round(rent / 2).toString())}
                  className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>50%: {Math.round(rent / 2)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAmountStr('0')}
                  className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>Reset: 0</span>
                </button>
              </div>
            </div>

            {/* Date and Notes */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    placeholder="DD.MM.YYYY"
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 font-mono text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. paid cash on the spot"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 text-slate-900"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#181824] hover:bg-slate-800 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer border border-[#262638]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#38CE3C]" />
                <span>Save Payment Record</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

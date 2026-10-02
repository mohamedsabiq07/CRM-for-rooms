import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldAlert, Banknote, Calendar } from 'lucide-react';
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

type Step = 'entry' | 'confirm';

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

  // Previous payment info for this month
  const prevStatus = (() => {
    if (selectedMonth && tenant.monthStatusHistory?.[selectedMonth]) {
      return tenant.monthStatusHistory[selectedMonth];
    }
    return tenant.currentMonthStatus || 'Due';
  })();

  const prevAmountPaid: number = (() => {
    if (selectedMonth && tenant.monthPaymentAmounts?.[selectedMonth] != null) {
      return tenant.monthPaymentAmounts[selectedMonth];
    }
    return prevStatus === 'Paid' ? tenant.rentAmount : 0;
  })();

  const [amountStr, setAmountStr] = useState(prevAmountPaid > 0 ? prevAmountPaid.toString() : '');
  const [remarks, setRemarks] = useState(tenant.remarks || '');
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [step, setStep] = useState<Step>('entry');

  const amount = Number(amountStr) || 0;
  const rent = tenant.rentAmount;

  // Derive the new status from the entered amount
  const newStatus: 'Paid' | 'Partial' | 'Due' =
    amount >= rent ? 'Paid' : amount > 0 ? 'Partial' : 'Due';

  const balance = rent - amount;
  const balanceStr = balance > 0 ? `AED ${balance.toLocaleString()}` : '—';

  // Determine if this is a potentially dangerous change (downgrading payment)
  const isDowngrade =
    (prevStatus === 'Paid' && newStatus !== 'Paid') ||
    (prevStatus === 'Partial' && newStatus === 'Due');

  const isSamePaidStatus = prevStatus === newStatus && amount === prevAmountPaid;

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Always confirm before saving — extra caution for downgrades
    setStep('confirm');
  };

  const handleConfirm = () => {
    onSavePayment(tenant.id, amount, newStatus, remarks, paymentDate, selectedMonth);
    onClose();
  };

  const handleBack = () => setStep('entry');

  // ─── STATUS BADGE STYLING ────────────────────────────────────────────
  const statusStyle = (s: string) => {
    if (s === 'Paid') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (s === 'Partial') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  const statusLabel = (s: string, amt?: number) => {
    if (s === 'Paid') return '✅ Paid in Full';
    if (s === 'Partial') return `⚡ Partial — AED ${amt ?? amount} paid`;
    return '❌ Due (AED 0 paid)';
  };

  // ─── ENTRY STEP ──────────────────────────────────────────────────────
  if (step === 'entry') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">

          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-800 text-white rounded-lg border border-slate-700">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Record Rent Payment</h3>
                  {selectedMonth && (
                    <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-indigo-600 text-white">
                      {selectedMonth}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{tenant.name} • {tenant.partition.toUpperCase()} ({tenant.section})</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Existing status banner */}
          {prevStatus !== 'Due' && (
            <div className={`px-4 py-2.5 border-b text-xs font-semibold flex items-center gap-2 ${
              prevStatus === 'Paid'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Current status for {selectedMonth}: <strong>{statusLabel(prevStatus, prevAmountPaid)}</strong>
                {prevStatus === 'Partial' && ` — Balance: AED ${(rent - prevAmountPaid).toLocaleString()}`}
              </span>
            </div>
          )}

          <form onSubmit={handleEntrySubmit} className="p-5 space-y-4">

            {/* Rent summary */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Monthly Rent</p>
                <p className="text-lg font-bold text-slate-900">AED {rent.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Deposit Held</p>
                <p className="text-sm font-bold text-slate-800">
                  {tenant.depositNote || `AED ${tenant.deposit}`}
                </p>
              </div>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount Received (AED)
              </label>
              <input
                type="number"
                min="0"
                max={rent}
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder={`Enter amount (full = AED ${rent})`}
                className="w-full text-xl font-bold px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
              />
            </div>

            {/* Live payment status indicator */}
            <div className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 transition-all ${
              newStatus === 'Paid'
                ? 'bg-emerald-50 border-emerald-200'
                : newStatus === 'Partial'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-rose-50 border-rose-200'
            }`}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Payment Status</p>
                <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${statusStyle(newStatus)}`}>
                  {newStatus === 'Paid' ? '✅ Paid in Full' : newStatus === 'Partial' ? '⚡ Partial Payment' : '❌ Not Paid (Due)'}
                </span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Balance Remaining</p>
                <p className={`text-base font-bold ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {balance > 0 ? `AED ${balance.toLocaleString()} due` : 'Cleared ✓'}
                </p>
              </div>
            </div>

            {/* Quick-fill buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAmountStr(rent.toString())}
                className="flex-1 text-xs font-semibold py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
              >
                Full: AED {rent}
              </button>
              {[0.5, 0.75].map(frac => {
                const val = Math.round(rent * frac);
                return (
                  <button
                    key={frac}
                    type="button"
                    onClick={() => setAmountStr(val.toString())}
                    className="flex-1 text-xs font-semibold py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition"
                  >
                    {frac * 100}%: {val}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setAmountStr('0')}
                className="flex-1 text-xs font-semibold py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition"
              >
                Due (0)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    placeholder="DD.MM.YYYY"
                    className="w-full text-sm pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. cash, bank transfer…"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                />
              </div>
            </div>

            {/* Downgrade warning inside form */}
            {isDowngrade && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-300 rounded-xl px-3.5 py-3 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>
                  <strong>Warning:</strong> You are changing the status from <em>{prevStatus}</em> to <em>{newStatus}</em>.
                  You will be asked to confirm this on the next screen.
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSamePaidStatus}
                className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 ${
                  isSamePaidStatus
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : isDowngrade
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isDowngrade ? 'Review Change →' : 'Review & Confirm →'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── CONFIRM STEP ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">

        {/* Confirm header */}
        <div className={`p-4 flex items-center gap-3 ${isDowngrade ? 'bg-rose-700' : 'bg-slate-900'} text-white`}>
          {isDowngrade
            ? <ShieldAlert className="w-5 h-5 text-rose-200 shrink-0" />
            : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <div>
            <p className="text-sm font-bold">{isDowngrade ? '⚠️ Confirm Payment Change' : 'Confirm Payment'}</p>
            <p className="text-xs opacity-70">{tenant.name} • {selectedMonth}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">

          {isDowngrade && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-300 rounded-xl p-3.5 text-xs text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">You are downgrading the payment status!</p>
                <p className="text-rose-700">
                  Previous: <span className={`font-bold px-1.5 py-0.5 rounded border ${statusStyle(prevStatus)}`}>{prevStatus}</span>
                  {' → '}
                  New: <span className={`font-bold px-1.5 py-0.5 rounded border ${statusStyle(newStatus)}`}>{newStatus}</span>
                </p>
                <p className="mt-1.5 text-rose-600">Only proceed if this is intentional and not a mistake.</p>
              </div>
            </div>
          )}

          {/* Summary table */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 text-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-slate-500 font-medium text-xs">Tenant</span>
              <span className="font-bold text-slate-900">{tenant.name}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-slate-500 font-medium text-xs">Month</span>
              <span className="font-bold text-slate-900">{selectedMonth}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-slate-500 font-medium text-xs">Monthly Rent</span>
              <span className="font-bold text-slate-900">AED {rent.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-slate-500 font-medium text-xs">Amount Received</span>
              <span className={`font-bold ${amount > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                AED {amount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-slate-500 font-medium text-xs">Balance Due</span>
              <span className={`font-bold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {balance > 0 ? `AED ${balance.toLocaleString()}` : 'Nil ✓'}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-slate-500 font-medium text-xs">New Status</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusStyle(newStatus)}`}>
                {newStatus === 'Paid' ? '✅ Paid' : newStatus === 'Partial' ? '⚡ Partial' : '❌ Due'}
              </span>
            </div>
            {remarks && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-slate-500 font-medium text-xs">Remarks</span>
                <span className="font-medium text-slate-700 text-xs text-right max-w-[180px]">{remarks}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              ← Go Back
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 ${
                isDowngrade
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isDowngrade ? 'Yes, Confirm Change' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, CheckCircle2, ShieldAlert, Banknote, Check } from 'lucide-react';
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

  const [amountStr, setAmountStr] = useState<string>(() => {
    if (prevAmountPaid > 0) return prevAmountPaid.toString();
    return rent.toString();
  });

  const [remarks, setRemarks] = useState(tenant.remarks || '');
  const [isConfirmingDowngrade, setIsConfirmingDowngrade] = useState(false);

  const amount = Math.max(0, Number(amountStr) || 0);
  const balance = Math.max(0, rent - amount);

  const newStatus: 'Paid' | 'Partial' | 'Due' =
    amount >= rent && rent > 0 ? 'Paid' : amount > 0 ? 'Partial' : 'Due';

  const isDowngrade =
    (prevStatus === 'Paid' && newStatus !== 'Paid') ||
    (prevStatus === 'Partial' && newStatus === 'Due');

  const handleSave = () => {
    if (isDowngrade && !isConfirmingDowngrade) {
      setIsConfirmingDowngrade(true);
      return;
    }
    onSavePayment(tenant.id, amount, newStatus, remarks, todayStr, selectedMonth);
    onClose();
  };

  const handleInstantFullPaid = () => {
    onSavePayment(tenant.id, rent, 'Paid', remarks, todayStr, selectedMonth);
    onClose();
  };

  const handleInstantDue = () => {
    setAmountStr('0');
    if (prevStatus === 'Paid' || prevStatus === 'Partial') {
      setIsConfirmingDowngrade(true);
      return;
    }
    onSavePayment(tenant.id, 0, 'Due', remarks, todayStr, selectedMonth);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-3.5 bg-[#181824] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-[#38CE3C]" />
            <div>
              <h3 className="text-sm font-bold">{tenant.name}</h3>
              <p className="text-[11px] text-slate-400">
                {tenant.partition ? tenant.partition.toUpperCase() : 'BED'} • Rent: AED {rent} ({selectedMonth})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Downgrade Safeguard */}
        {isConfirmingDowngrade ? (
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Change from {prevStatus} to {newStatus}?</p>
                <p className="text-rose-700 mt-0.5">
                  Previously AED {prevAmountPaid} paid. Confirm changing to AED {amount} paid?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingDowngrade(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 rounded-xl cursor-pointer"
              >
                Confirm {newStatus}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3.5">
            {/* 1-Tap Instant Settle Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleInstantFullPaid}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Paid Full ({rent})</span>
              </button>
              <button
                type="button"
                onClick={handleInstantDue}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Mark Due (0)</span>
              </button>
            </div>

            {/* Custom / Partial Amount Input */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700">Paid Amount (AED)</label>
                <span className={`font-bold ${balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {balance > 0 ? `Bal: AED ${balance}` : '✓ 0 Balance'}
                </span>
              </div>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max={rent * 2}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full text-xl font-extrabold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 font-mono"
              />
            </div>

            {/* Optional Short Note */}
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional note (e.g. cash, balance next week)..."
              className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-slate-900"
            />

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-2.5 text-xs font-extrabold text-white bg-[#181824] hover:bg-slate-800 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#38CE3C]" />
              <span>Save Payment (AED {amount})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

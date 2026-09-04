import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { Tenant } from '../types/crm';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSavePayment: (tenantId: string, amount: number, status: 'Paid' | 'Partial' | 'Due' | 'Pending', remarks: string, date: string) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onSavePayment,
}) => {
  if (!isOpen || !tenant) return null;

  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.');

  const [amount, setAmount] = useState(tenant.rentAmount.toString());
  const [status, setStatus] = useState<'Paid' | 'Partial' | 'Due' | 'Pending'>('Paid');
  const [remarks, setRemarks] = useState(tenant.remarks || '');
  const [paymentDate, setPaymentDate] = useState(todayStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePayment(tenant.id, Number(amount) || 0, status, remarks, paymentDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 text-slate-950 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Record Rent Payment</h3>
              <p className="text-xs text-slate-400">{tenant.name} • {tenant.partition.toUpperCase()} ({tenant.section})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 font-semibold">Standard Monthly Rent</p>
              <p className="text-lg font-extrabold text-emerald-950">AED {tenant.rentAmount}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Deposit Held</p>
              <p className="text-sm font-bold text-slate-800">
                {tenant.depositNote || `AED ${tenant.deposit}`}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Amount Received (AED)
            </label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                setAmount(val);
                if (Number(val) >= tenant.rentAmount) {
                  setStatus('Paid');
                } else if (Number(val) > 0) {
                  setStatus('Partial');
                }
              }}
              className="w-full text-base font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="Paid">Paid in Full</option>
                <option value="Partial">Partial Payment</option>
                <option value="Due">Pending / Due</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Date
              </label>
              <input
                type="text"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                placeholder="DD.MM.YYYY"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks / Balance Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. 500 balance, paid cash, bank transfer"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

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
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Mark Settled</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

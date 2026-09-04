import React, { useState } from 'react';
import { X, LogOut, Key, DollarSign, Calendar, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Tenant, CheckOutRecord } from '../types/crm';
import { calculateStayDuration } from '../utils/dateUtils';
import { calculateGiveBack } from '../utils/rentCalculator';

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onConfirmCheckOut: (tenantId: string, checkoutRecord: CheckOutRecord) => void;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onConfirmCheckOut,
}) => {
  if (!isOpen || !tenant) return null;

  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.');

  const [checkOutDate, setCheckOutDate] = useState(todayStr);
  const [doorKeyReturned, setDoorKeyReturned] = useState(tenant.doorKey);
  const [cupboardKeyReturned, setCupboardKeyReturned] = useState(tenant.cupboardKey);
  const [doorKeyFee, setDoorKeyFee] = useState('50');
  const [cupboardKeyFee, setCupboardKeyFee] = useState('30');
  const [unpaidRent, setUnpaidRent] = useState('0');
  const [damageCharges, setDamageCharges] = useState('0');
  const [notes, setNotes] = useState('');

  const stayDuration = calculateStayDuration(tenant.joiningDate, checkOutDate);

  const settlement = calculateGiveBack(
    tenant.deposit || 0,
    Number(unpaidRent) || 0,
    doorKeyReturned,
    cupboardKeyReturned,
    Number(doorKeyFee) || 0,
    Number(cupboardKeyFee) || 0,
    Number(damageCharges) || 0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const record: CheckOutRecord = {
      checkOutDate: checkOutDate.trim(),
      stayDuration,
      originalDeposit: tenant.deposit || 0,
      unpaidRentDeduction: Number(unpaidRent) || 0,
      keyReturnedDoor: doorKeyReturned,
      keyReturnedCupboard: cupboardKeyReturned,
      lostKeyCharges: settlement.totalKeyCharges,
      damageCharges: Number(damageCharges) || 0,
      giveBackAmount: settlement.giveBackAmount,
      notes: notes.trim()
    };

    onConfirmCheckOut(tenant.id, record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-white rounded-lg border border-slate-700">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Tenant Out & Settlement</h3>
              <p className="text-xs text-slate-400">
                {tenant.name} • {tenant.partition.toUpperCase()} ({tenant.section})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Stay Duration Info */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Move-in Date:</span>
              <span className="font-bold text-slate-800">{tenant.joiningDate || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Stay Duration:</span>
              <span className="font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block">
                {stayDuration}
              </span>
            </div>
          </div>

          {/* Move-Out Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Move-Out / Check-Out Date (DD.MM.YYYY)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Key Return Checklist & Lost Key Charges */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Key className="w-4 h-4 text-slate-700" />
              Key Handover & Penalties
            </h4>

            {/* Door Key */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doorKeyReturned}
                  onChange={(e) => setDoorKeyReturned(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
                />
                Door Key Returned (D/k)
              </label>

              {!doorKeyReturned && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 text-[11px] font-bold">Lost Fee: AED</span>
                  <input
                    type="number"
                    value={doorKeyFee}
                    onChange={(e) => setDoorKeyFee(e.target.value)}
                    className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Cupboard Key */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cupboardKeyReturned}
                  onChange={(e) => setCupboardKeyReturned(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
                />
                Cupboard Key Returned (Cu/k)
              </label>

              {!cupboardKeyReturned && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 text-[11px] font-bold">Lost Fee: AED</span>
                  <input
                    type="number"
                    value={cupboardKeyFee}
                    onChange={(e) => setCupboardKeyFee(e.target.value)}
                    className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Deductions: Unpaid Rent & Damage Charges */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unpaid Rent / Balance (AED)
              </label>
              <input
                type="number"
                value={unpaidRent}
                onChange={(e) => setUnpaidRent(e.target.value)}
                placeholder="0"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Damages / Cleaning (AED)
              </label>
              <input
                type="number"
                value={damageCharges}
                onChange={(e) => setDamageCharges(e.target.value)}
                placeholder="0"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* THE "GIVE BACK" (DEPOSIT REFUND) SUMMARY CARD */}
          <div className={`p-4 rounded-xl border transition ${
            settlement.giveBackAmount > 0 
              ? 'bg-slate-50 border-slate-300 text-slate-900' 
              : settlement.tenantOwesExtra > 0
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Original Advance Deposit Held:
              </span>
              <span className="text-sm font-bold text-slate-900">
                AED {tenant.deposit || 0}
              </span>
            </div>

            {settlement.totalDeductions > 0 && (
              <div className="text-[11px] text-slate-600 space-y-0.5 pb-2 border-b border-slate-200 mb-2">
                {settlement.unpaidRentDeduction > 0 && (
                  <div className="flex justify-between">
                    <span>Unpaid Rent:</span>
                    <span className="text-rose-600 font-semibold">-AED {settlement.unpaidRentDeduction}</span>
                  </div>
                )}
                {settlement.totalKeyCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Lost Key Charges:</span>
                    <span className="text-rose-600 font-semibold">-AED {settlement.totalKeyCharges}</span>
                  </div>
                )}
                {settlement.damageCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Damages/Cleaning:</span>
                    <span className="text-rose-600 font-semibold">-AED {settlement.damageCharges}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-sm font-bold block text-slate-900">
                  {settlement.giveBackAmount > 0 ? 'Give Back to Tenant:' : settlement.tenantOwesExtra > 0 ? 'Tenant Owes Extra:' : 'Settled (Zero Balance)'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {settlement.giveBackAmount > 0 ? 'Net deposit refund to hand over' : ''}
                </span>
              </div>
              <span className={`text-2xl font-bold ${
                settlement.giveBackAmount > 0 ? 'text-slate-900' : settlement.tenantOwesExtra > 0 ? 'text-rose-700' : 'text-slate-800'
              }`}>
                AED {settlement.giveBackAmount > 0 ? settlement.giveBackAmount : settlement.tenantOwesExtra}
              </span>
            </div>
          </div>

          {/* Checkout Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Check-Out Notes & Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Deposit refunded in cash, vacated room peacefully"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Confirm Check-Out & Refund</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

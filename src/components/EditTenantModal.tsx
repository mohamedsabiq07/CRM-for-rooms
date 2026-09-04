import React, { useState } from 'react';
import { X, Edit3, Calendar, Phone, Key, Trash2 } from 'lucide-react';
import { Tenant } from '../types/crm';

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onUpdateTenant: (updated: Tenant) => void;
  onDeleteTenant: (id: string) => void;
}

export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onUpdateTenant,
  onDeleteTenant,
}) => {
  if (!isOpen || !tenant) return null;

  const [name, setName] = useState(tenant.name);
  const [place, setPlace] = useState(tenant.place);
  const [phone, setPhone] = useState(tenant.phone);
  const [deposit, setDeposit] = useState(tenant.deposit.toString());
  const [depositNote, setDepositNote] = useState(tenant.depositNote || '');
  const [rentAmount, setRentAmount] = useState(tenant.rentAmount.toString());
  const [joiningDate, setJoiningDate] = useState(tenant.joiningDate);
  const [leavingDate, setLeavingDate] = useState(tenant.leavingDate || '');
  const [section, setSection] = useState(tenant.section);
  const [partition, setPartition] = useState(tenant.partition);
  const [cupboardKey, setCupboardKey] = useState(tenant.cupboardKey);
  const [doorKey, setDoorKey] = useState(tenant.doorKey);
  const [remarks, setRemarks] = useState(tenant.remarks);
  const [status, setStatus] = useState<'Active' | 'Vacated'>(tenant.status);
  const [currentMonthStatus, setCurrentMonthStatus] = useState(tenant.currentMonthStatus);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTenant({
      ...tenant,
      name: name.trim(),
      place: place.trim(),
      phone: phone.trim(),
      deposit: Number(deposit) || 0,
      depositNote: depositNote.trim(),
      rentAmount: Number(rentAmount) || 0,
      joiningDate: joiningDate.trim(),
      leavingDate: leavingDate.trim() || null,
      section,
      partition: partition.trim().toLowerCase(),
      cupboardKey,
      doorKey,
      remarks: remarks.trim(),
      status,
      currentMonthStatus,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-lg">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Edit Tenant Details</h3>
              <p className="text-xs text-slate-400">Sno: {tenant.sno} • {tenant.partition.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tenant Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Place / Origin
              </label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Joining Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section & Partition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Flat Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="HALL">HALL</option>
                <option value="ROOM">ROOM</option>
                <option value="MASTER ROOM">MASTER ROOM</option>
                <option value="BALCONY">BALCONY</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Partition Code
              </label>
              <input
                type="text"
                value={partition}
                onChange={(e) => setPartition(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase font-bold text-rose-700"
              />
            </div>
          </div>

          {/* Rent, Deposit & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rent (AED)
              </label>
              <input
                type="number"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deposit (AED)
              </label>
              <input
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deposit Note
              </label>
              <input
                type="text"
                value={depositNote}
                onChange={(e) => setDepositNote(e.target.value)}
                placeholder="No Advance, etc."
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Keys Handover */}
          <div className="flex items-center gap-6 py-2 px-3 bg-amber-50/60 rounded-xl border border-amber-200/70">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Key className="w-4 h-4 text-amber-600" /> Keys:
            </span>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={cupboardKey}
                onChange={(e) => setCupboardKey(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              Cupboard Key (Cu/k)
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={doorKey}
                onChange={(e) => setDoorKey(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              Door Key (D/k)
            </label>
          </div>

          {/* Status & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Status
              </label>
              <select
                value={currentMonthStatus}
                onChange={(e) => setCurrentMonthStatus(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold"
              >
                <option value="Paid">Paid</option>
                <option value="Due">Due</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Occupancy Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Vacated">Vacated (Moved Out)</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. 500 balance, she came at night"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 italic"
            />
          </div>

          {/* Footer & Delete */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${tenant.name}?`)) {
                  onDeleteTenant(tenant.id);
                  onClose();
                }
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Tenant</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-md shadow-amber-500/20 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

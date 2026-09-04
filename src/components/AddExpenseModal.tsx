import React, { useState } from 'react';
import { X, Receipt, Calendar, DollarSign, Tag, Building2, DoorOpen, CreditCard, FileText } from 'lucide-react';
import { RoomUnit, Building, ExpenseItem, ExpenseCategory } from '../types/crm';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: RoomUnit[];
  buildings: Building[];
  defaultRoomId?: string;
  onAddExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
}

const CATEGORIES: { label: ExpenseCategory; icon: string }[] = [
  { label: 'AC Maintenance & Repair', icon: '❄️' },
  { label: 'Plumbing & Electrical', icon: '🔧' },
  { label: 'Cleaning & Maid Service', icon: '🧹' },
  { label: 'Gas / LPG Cylinder', icon: '🔥' },
  { label: 'Supplies (Bedding, Locks, Curtains)', icon: '🛏️' },
  { label: 'Pest Control', icon: '🐜' },
  { label: 'DEWA / Electricity & Water', icon: '⚡' },
  { label: 'Wi-Fi / Internet', icon: '🌐' },
  { label: 'Real Estate Commission / Brokerage', icon: '🏢' },
  { label: 'Ejari Registration Fee', icon: '📜' },
  { label: 'Other / Miscellaneous', icon: '📦' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  rooms,
  buildings,
  defaultRoomId,
  onAddExpense,
}) => {
  if (!isOpen) return null;

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.');

  const [roomId, setRoomId] = useState(defaultRoomId || rooms[0]?.id || '');
  const [category, setCategory] = useState<ExpenseCategory>('AC Maintenance & Repair');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayFormatted);
  const [paidBy, setPaidBy] = useState<'Cash' | 'Bank Transfer' | 'Card' | 'Cheque'>('Cash');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [notes, setNotes] = useState('');

  const selectedRoom = rooms.find(r => r.id === roomId);
  const selectedBuilding = buildings.find(b => b.id === selectedRoom?.buildingId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0 || !roomId) return;

    onAddExpense({
      roomId,
      buildingId: selectedRoom?.buildingId || '',
      title: title.trim(),
      category,
      amount: Number(amount) || 0,
      date: date.trim(),
      paidBy,
      invoiceRef: invoiceRef.trim(),
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-white rounded-lg border border-slate-700">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Add Flat Expense</h3>
              <p className="text-xs text-slate-400">Track maintenance, repairs, supplies & operational costs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Target Flat / Room Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Flat / Room *
            </label>
            <div className="relative">
              <DoorOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {rooms.map(r => {
                  const bld = buildings.find(b => b.id === r.buildingId);
                  return (
                    <option key={r.id} value={r.id}>
                      {bld?.name || 'Building'} — Room {r.roomNumber} ({r.roomType})
                    </option>
                  );
                })}
              </select>
            </div>
            {selectedRoom && (
              <p className="text-[11px] text-slate-500 mt-1">
                Capacity: {selectedRoom.capacity} beds • Real Estate Rent: AED {selectedRoom.actualRentAnnual?.toLocaleString()}/yr
              </p>
            )}
          </div>

          {/* Expense Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.label} value={cat.label}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expense Description / Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AC compressor repair, gas cylinder replacement, maid service"
              className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-900"
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount (AED) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">AED</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="350"
                  className="w-full text-sm pl-12 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Expense Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="DD.MM.YYYY"
                  className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Payment Method & Invoice Ref */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice / Receipt #
              </label>
              <input
                type="text"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                placeholder="INV-2026-90"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Technician Contact
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Technician Ali +971501234567, 3 months warranty"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg italic text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Action Buttons */}
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
              className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition cursor-pointer"
            >
              Add Expense & Record
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

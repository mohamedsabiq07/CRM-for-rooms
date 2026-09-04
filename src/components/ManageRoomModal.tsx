import React, { useState } from 'react';
import { X, Zap, Wifi, DoorOpen, Calendar, Trash2, CheckCircle2 } from 'lucide-react';
import { RoomUnit, Building } from '../types/crm';

interface ManageRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: Building;
  room: RoomUnit | null; // null if adding new room
  onSaveRoom: (roomData: Omit<RoomUnit, 'id'>, roomId?: string) => void;
  onDeleteRoom?: (roomId: string) => void;
}

export const ManageRoomModal: React.FC<ManageRoomModalProps> = ({
  isOpen,
  onClose,
  building,
  room,
  onSaveRoom,
  onDeleteRoom,
}) => {
  if (!isOpen) return null;

  const isEditing = !!room;

  const [roomNumber, setRoomNumber] = useState(room ? room.roomNumber : '');
  const [roomType, setRoomType] = useState(room ? room.roomType : 'Partition Flat');
  const [notes, setNotes] = useState(room?.notes || '');

  // DEWA
  const [dewaAccount, setDewaAccount] = useState(room?.dewaBill?.accountNumber || '');
  const [dewaAmount, setDewaAmount] = useState(room?.dewaBill?.amount?.toString() || '850');
  const [dewaDueDate, setDewaDueDate] = useState(room?.dewaBill?.dueDate || '10.09.2026');
  const [dewaStatus, setDewaStatus] = useState<'Paid' | 'Due' | 'Overdue'>(room?.dewaBill?.status || 'Due');

  // Wi-Fi
  const [wifiProvider, setWifiProvider] = useState(room?.wifiBill?.provider || 'Du');
  const [wifiAccount, setWifiAccount] = useState(room?.wifiBill?.accountNumber || '');
  const [wifiAmount, setWifiAmount] = useState(room?.wifiBill?.amount?.toString() || '389');
  const [wifiDueDate, setWifiDueDate] = useState(room?.wifiBill?.dueDate || '15.09.2026');
  const [wifiStatus, setWifiStatus] = useState<'Paid' | 'Due' | 'Overdue'>(room?.wifiBill?.status || 'Due');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) return;

    onSaveRoom({
      buildingId: building.id,
      roomNumber: roomNumber.trim(),
      roomType: roomType.trim(),
      notes: notes.trim(),
      dewaBill: {
        provider: 'DEWA',
        accountNumber: dewaAccount.trim(),
        amount: Number(dewaAmount) || 0,
        dueDate: dewaDueDate.trim(),
        status: dewaStatus,
      },
      wifiBill: {
        provider: wifiProvider.trim(),
        accountNumber: wifiAccount.trim(),
        amount: Number(wifiAmount) || 0,
        dueDate: wifiDueDate.trim(),
        status: wifiStatus,
      }
    }, room?.id);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-lg">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isEditing ? `Edit Room ${room.roomNumber}` : 'Add Room to Building'}
              </h3>
              <p className="text-xs text-slate-400">{building.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Room Number & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Room / Flat Number *
              </label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 103, 601"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Room Layout Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
              >
                <option value="Partition Flat">Partition Flat</option>
                <option value="Master Bedspace">Master Bedspace</option>
                <option value="Studio Partition">Studio Partition</option>
                <option value="1BHK Bedspace">1BHK Bedspace</option>
              </select>
            </div>
          </div>

          {/* DEWA Bill Section */}
          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-600" />
                DEWA Bill (Electricity & Water)
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                dewaStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                dewaStatus === 'Due' ? 'bg-amber-200 text-amber-900' : 'bg-rose-100 text-rose-800'
              }`}>
                {dewaStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Premise / Account #</label>
                <input
                  type="text"
                  value={dewaAccount}
                  onChange={(e) => setDewaAccount(e.target.value)}
                  placeholder="2201948572"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Bill (AED)</label>
                <input
                  type="number"
                  value={dewaAmount}
                  onChange={(e) => setDewaAmount(e.target.value)}
                  placeholder="850"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="text"
                  value={dewaDueDate}
                  onChange={(e) => setDewaDueDate(e.target.value)}
                  placeholder="10.09.2026"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Status</label>
                <select
                  value={dewaStatus}
                  onChange={(e) => setDewaStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
                >
                  <option value="Paid">Paid</option>
                  <option value="Due">Due</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>

          {/* Wi-Fi Bill Section */}
          <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Wifi className="w-4 h-4 text-blue-600" />
                Wi-Fi Internet Bill
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                wifiStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                wifiStatus === 'Due' ? 'bg-amber-200 text-amber-900' : 'bg-rose-100 text-rose-800'
              }`}>
                {wifiStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Provider (Du / Etisalat)</label>
                <input
                  type="text"
                  value={wifiProvider}
                  onChange={(e) => setWifiProvider(e.target.value)}
                  placeholder="Du / Etisalat"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Plan (AED)</label>
                <input
                  type="number"
                  value={wifiAmount}
                  onChange={(e) => setWifiAmount(e.target.value)}
                  placeholder="389"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Router / Account #</label>
                <input
                  type="text"
                  value={wifiAccount}
                  onChange={(e) => setWifiAccount(e.target.value)}
                  placeholder="04-892-1140"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="text"
                  value={wifiDueDate}
                  onChange={(e) => setWifiDueDate(e.target.value)}
                  placeholder="15.09.2026"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {isEditing && onDeleteRoom ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete Room ${room.roomNumber}?`)) {
                    onDeleteRoom(room.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Room</span>
              </button>
            ) : <div />}

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
                {isEditing ? 'Save Room Details' : 'Add Room'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

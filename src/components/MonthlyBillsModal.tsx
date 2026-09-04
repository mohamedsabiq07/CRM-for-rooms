import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Wifi, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Building2, 
  Save, 
  Clock,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { RoomUnit, Building, MonthlyUtilityBill } from '../types/crm';

interface MonthlyBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: RoomUnit[];
  buildings: Building[];
  selectedMonth: string; // e.g. "Sep-2026"
  onMonthChange: (month: string) => void;
  utilityBills: MonthlyUtilityBill[];
  onSaveBill: (bill: MonthlyUtilityBill) => void;
}

const AVAILABLE_MONTHS = [
  'Jun-2026',
  'Jul-2026',
  'Aug-2026',
  'Sep-2026',
  'Oct-2026',
  'Nov-2026',
  'Dec-2026'
];

export const MonthlyBillsModal: React.FC<MonthlyBillsModalProps> = ({
  isOpen,
  onClose,
  rooms,
  buildings,
  selectedMonth,
  onMonthChange,
  utilityBills,
  onSaveBill,
}) => {
  if (!isOpen) return null;

  // Local draft state for editing current month bills
  const [localDrafts, setLocalDrafts] = useState<Record<string, {
    dewaType: 'DEWA' | 'SEWA';
    dewaAmount: number;
    dewaStatus: 'Paid' | 'Due';
    dewaDueDate: string;
    dewaAccount: string;
    wifiAmount: number;
    wifiStatus: 'Paid' | 'Due';
    wifiDueDate: string;
    wifiAccount: string;
    saved?: boolean;
  }>>(() => {
    const initial: Record<string, any> = {};
    rooms.forEach(r => {
      const dewaBill = utilityBills.find(b => b.roomId === r.id && b.month === selectedMonth && (b.utilityType === 'DEWA' || b.utilityType === 'SEWA'));
      const wifiBill = utilityBills.find(b => b.roomId === r.id && b.month === selectedMonth && b.utilityType === 'Wi-Fi');
      
      initial[r.id] = {
        dewaType: dewaBill?.utilityType || (r.dewaBill.provider === 'SEWA' ? 'SEWA' : 'DEWA'),
        dewaAmount: dewaBill ? dewaBill.amount : (r.dewaBill.amount || 750),
        dewaStatus: dewaBill ? dewaBill.status : (r.dewaBill.status || 'Due'),
        dewaDueDate: dewaBill?.dueDate || r.dewaBill.dueDate || `15.${selectedMonth.slice(0, 3)}`,
        dewaAccount: dewaBill?.accountNumber || r.dewaBill.accountNumber || '',
        wifiAmount: wifiBill ? wifiBill.amount : (r.wifiBill.amount || 389),
        wifiStatus: wifiBill ? wifiBill.status : (r.wifiBill.status || 'Due'),
        wifiDueDate: wifiBill?.dueDate || r.wifiBill.dueDate || `18.${selectedMonth.slice(0, 3)}`,
        wifiAccount: wifiBill?.accountNumber || r.wifiBill.accountNumber || '',
      };
    });
    return initial;
  });

  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  const currentMonthIndex = AVAILABLE_MONTHS.indexOf(selectedMonth);

  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) {
      onMonthChange(AVAILABLE_MONTHS[currentMonthIndex - 1]);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex < AVAILABLE_MONTHS.length - 1) {
      onMonthChange(AVAILABLE_MONTHS[currentMonthIndex + 1]);
    }
  };

  const handleUpdateField = (roomId: string, field: string, value: any) => {
    setLocalDrafts(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: value
      }
    }));
  };

  const handleSaveRoomBills = (roomId: string) => {
    const draft = localDrafts[roomId];
    if (!draft) return;

    // 1. Save DEWA/SEWA bill
    const dewaBillObj: MonthlyUtilityBill = {
      id: `util-${roomId}-${draft.dewaType.toLowerCase()}-${selectedMonth.toLowerCase()}`,
      roomId,
      month: selectedMonth,
      utilityType: draft.dewaType,
      amount: Number(draft.dewaAmount) || 0,
      status: draft.dewaStatus,
      dueDate: draft.dewaDueDate,
      accountNumber: draft.dewaAccount,
      notes: `${draft.dewaType} bill for ${selectedMonth}`,
      paidDate: draft.dewaStatus === 'Paid' ? new Date().toLocaleDateString('en-GB').replace(/\//g, '.') : undefined,
    };
    onSaveBill(dewaBillObj);

    // 2. Save Wi-Fi bill
    const wifiBillObj: MonthlyUtilityBill = {
      id: `util-${roomId}-wifi-${selectedMonth.toLowerCase()}`,
      roomId,
      month: selectedMonth,
      utilityType: 'Wi-Fi',
      amount: Number(draft.wifiAmount) || 0,
      status: draft.wifiStatus,
      dueDate: draft.wifiDueDate,
      accountNumber: draft.wifiAccount,
      notes: `Du / Etisalat Internet for ${selectedMonth}`,
      paidDate: draft.wifiStatus === 'Paid' ? new Date().toLocaleDateString('en-GB').replace(/\//g, '.') : undefined,
    };
    onSaveBill(wifiBillObj);

    setLocalDrafts(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        saved: true
      }
    }));

    setSavedSuccessMsg(`Saved utility bills for Room!`);
    setTimeout(() => setSavedSuccessMsg(''), 3000);
  };

  const handleSaveAllRooms = () => {
    rooms.forEach(r => handleSaveRoomBills(r.id));
    setSavedSuccessMsg(`All 7 rooms utility bills updated for ${selectedMonth}!`);
    setTimeout(() => setSavedSuccessMsg(''), 4000);
  };

  // Compute month totals
  let totalDewaSewaMonth = 0;
  let totalWifiMonth = 0;
  rooms.forEach(r => {
    const draft = localDrafts[r.id];
    if (draft) {
      totalDewaSewaMonth += Number(draft.dewaAmount) || 0;
      totalWifiMonth += Number(draft.wifiAmount) || 0;
    }
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Monthly Utility Bills (DEWA, SEWA & Wi-Fi)</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Month-by-Month
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Record and store actual utility bills for every month to accurately track flat operational expenses.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Selector Bar & Quick Stats */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm">
            <button
              onClick={handlePrevMonth}
              disabled={currentMonthIndex <= 0}
              className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-900">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Billing Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="bg-transparent font-bold text-indigo-700 focus:outline-none cursor-pointer border-b border-indigo-400"
              >
                {AVAILABLE_MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleNextMonth}
              disabled={currentMonthIndex >= AVAILABLE_MONTHS.length - 1}
              className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-slate-500">DEWA/SEWA Total:</span>
              <span className="font-bold text-slate-900">AED {totalDewaSewaMonth.toLocaleString()}</span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="text-slate-500">Wi-Fi Total:</span>
              <span className="font-bold text-slate-900">AED {totalWifiMonth.toLocaleString()}</span>
            </div>
            <button
              onClick={handleSaveAllRooms}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-sm transition cursor-pointer text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save All 7 Rooms</span>
            </button>
          </div>
        </div>

        {savedSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}

        {/* Room Utility Bills List */}
        <div className="overflow-y-auto p-4 space-y-3 divide-y divide-slate-100 flex-1">
          {rooms.map((room) => {
            const bld = buildings.find(b => b.id === room.buildingId);
            const draft = localDrafts[room.id] || {
              dewaType: 'DEWA',
              dewaAmount: 750,
              dewaStatus: 'Due',
              dewaDueDate: '15.09',
              dewaAccount: '',
              wifiAmount: 389,
              wifiStatus: 'Due',
              wifiDueDate: '18.09',
              wifiAccount: '',
            };

            return (
              <div key={room.id} className="pt-3 first:pt-0">
                <div className="bg-slate-50/60 rounded-xl p-3.5 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Property & Room Label */}
                  <div className="min-w-[180px]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span>{bld?.name || 'Building'}</span>
                    </div>
                    <div className="text-xs text-indigo-700 font-bold mt-0.5">
                      {room.roomNumber} <span className="text-slate-400 font-normal">({room.capacity} beds)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {bld?.address}
                    </div>
                  </div>

                  {/* DEWA / SEWA Input Section */}
                  <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <select
                          value={draft.dewaType}
                          onChange={(e) => handleUpdateField(room.id, 'dewaType', e.target.value)}
                          className="bg-transparent font-bold text-xs text-amber-800 border-none cursor-pointer focus:outline-none"
                        >
                          <option value="DEWA">DEWA (Dubai)</option>
                          <option value="SEWA">SEWA (Sharjah)</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateField(room.id, 'dewaStatus', draft.dewaStatus === 'Paid' ? 'Due' : 'Paid')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${
                          draft.dewaStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {draft.dewaStatus}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Amount (AED)</label>
                        <input
                          type="number"
                          value={draft.dewaAmount || ''}
                          onChange={(e) => handleUpdateField(room.id, 'dewaAmount', Number(e.target.value))}
                          placeholder="e.g. 850"
                          className="w-full mt-0.5 px-2 py-1 bg-slate-50 text-xs font-bold text-slate-900 border border-slate-200 rounded focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Due Date</label>
                        <input
                          type="text"
                          value={draft.dewaDueDate || ''}
                          onChange={(e) => handleUpdateField(room.id, 'dewaDueDate', e.target.value)}
                          placeholder="DD.MM"
                          className="w-full mt-0.5 px-2 py-1 bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Wi-Fi Input Section */}
                  <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                        <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Wi-Fi (Du / Etisalat)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateField(room.id, 'wifiStatus', draft.wifiStatus === 'Paid' ? 'Due' : 'Paid')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${
                          draft.wifiStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {draft.wifiStatus}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Amount (AED)</label>
                        <input
                          type="number"
                          value={draft.wifiAmount || ''}
                          onChange={(e) => handleUpdateField(room.id, 'wifiAmount', Number(e.target.value))}
                          placeholder="e.g. 389"
                          className="w-full mt-0.5 px-2 py-1 bg-slate-50 text-xs font-bold text-slate-900 border border-slate-200 rounded focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Due Date</label>
                        <input
                          type="text"
                          value={draft.wifiDueDate || ''}
                          onChange={(e) => handleUpdateField(room.id, 'wifiDueDate', e.target.value)}
                          placeholder="DD.MM"
                          className="w-full mt-0.5 px-2 py-1 bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Room Action */}
                  <div className="flex flex-col items-end justify-center min-w-[90px]">
                    <button
                      type="button"
                      onClick={() => handleSaveRoomBills(room.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer ${
                        draft.saved
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {draft.saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{draft.saved ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>All 7 rooms utility bills are recorded month-wise and feed into the P&L expense ledger.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

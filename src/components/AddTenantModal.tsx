import React, { useState } from 'react';
import { X, UserPlus, Calendar, Phone, MapPin, Coins, Key, ShieldCheck, Bed, Layers, Calculator } from 'lucide-react';
import { Tenant, Building, RoomUnit, SpaceType, BedType } from '../types/crm';
import { calculateProRataRent } from '../utils/rentCalculator';

interface AddTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: Building;
  room: RoomUnit;
  nextSno: number;
  defaultSection?: string;
  onAddTenant: (newTenant: Omit<Tenant, 'id'>) => void;
}

export const AddTenantModal: React.FC<AddTenantModalProps> = ({
  isOpen,
  onClose,
  building,
  room,
  nextSno,
  defaultSection = 'HALL',
  onAddTenant,
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.');

  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [phone, setPhone] = useState('+971 5');
  const [deposit, setDeposit] = useState('200');
  const [isNoAdvance, setIsNoAdvance] = useState(false);
  const [rentAmount, setRentAmount] = useState('800');
  const [joiningDate, setJoiningDate] = useState(todayFormatted);
  const [section, setSection] = useState(defaultSection);
  const [partition, setPartition] = useState('p1');
  const [spaceType, setSpaceType] = useState<SpaceType>('Partition');
  const [bedType, setBedType] = useState<BedType>('Lower Bed');
  const [cupboardKey, setCupboardKey] = useState(true);
  const [doorKey, setDoorKey] = useState(true);
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  // Real-time pro-rata calculation for mid-month arrivals
  const proRataResult = calculateProRataRent(Number(rentAmount) || 0, joiningDate);
  const isMidMonth = proRataResult && proRataResult.daysRemainingInMonth < 28 && proRataResult.daysRemainingInMonth > 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddTenant({
      sno: nextSno,
      buildingId: building.id,
      roomId: room.id,
      flatId: building.id,
      name: name.trim(),
      place: place.trim(),
      phone: phone.trim(),
      deposit: isNoAdvance ? 0 : Number(deposit) || 0,
      depositNote: isNoAdvance ? 'No Advance' : '',
      joiningDate: joiningDate.trim(),
      status: 'Active',
      section: section || 'HALL',
      partition: partition.trim().toLowerCase(),
      spaceType,
      bedType,
      rentAmount: Number(rentAmount) || 800,
      cupboardKey,
      doorKey,
      currentMonthStatus: 'Pending',
      remarks: remarks.trim(),
      lastPaidDate: joiningDate.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Tenant In (Check-In)</h3>
              <p className="text-xs text-slate-400">{building.name} • Room {room.roomNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Tenant Name & Place */}
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
                placeholder="e.g. Sunanda, Anita"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Place / Origin / State
              </label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g. Malayali, Karnataka, Tamil"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Contact Number & Move-in Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone / WhatsApp Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+971 50..."
                  className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Joining Date (DD.MM.YYYY)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  placeholder="01.09.2026"
                  className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* SPACE TYPE & BED TYPE SELECTION */}
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Bed className="w-4 h-4 text-amber-600" />
              Space & Bed Type Configuration
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Space Category</label>
                <select
                  value={spaceType}
                  onChange={(e) => {
                    const st = e.target.value as SpaceType;
                    setSpaceType(st);
                    if (st === 'Partition') setBedType('Private Partition');
                    else if (st === 'Without Partition') setBedType('Lower Bed');
                  }}
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="Partition">Partition (Cabin)</option>
                  <option value="Without Partition">Without Partition (Open)</option>
                  <option value="Bed Space">Bed Space</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bed Choice</label>
                <select
                  value={bedType}
                  onChange={(e) => setBedType(e.target.value as BedType)}
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="Lower Bed">Lower Bed</option>
                  <option value="Upper Bed">Upper Bed</option>
                  <option value="Single Bed">Single Bed</option>
                  <option value="Private Partition">Private Partition</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="HALL">HALL</option>
                  <option value="ROOM">ROOM</option>
                  <option value="MASTER ROOM">MASTER ROOM</option>
                  <option value="BALCONY">BALCONY</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Partition / Bed Code</label>
                <input
                  type="text"
                  value={partition}
                  onChange={(e) => setPartition(e.target.value)}
                  placeholder="p1, p2, p3... p8"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase font-bold text-rose-700"
                />
              </div>
            </div>
          </div>

          {/* Rent & Advance Deposit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Monthly Rent (AED)
              </label>
              <input
                type="number"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                placeholder="800"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Advance Deposit (AED)
                </label>
                <label className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNoAdvance}
                    onChange={(e) => setIsNoAdvance(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  No Advance
                </label>
              </div>
              <input
                type="number"
                disabled={isNoAdvance}
                value={isNoAdvance ? '0' : deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="200"
                className={`w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold ${
                  isNoAdvance ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {/* MID-MONTH PRO-RATA RENT CALLOUT */}
          {isMidMonth && proRataResult && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-blue-950 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  Mid-Month Arrival Pro-Rata:
                </span>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  {proRataResult.daysRemainingInMonth} days remaining in current month = <strong>AED {proRataResult.proRataAmount}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRentAmount(proRataResult.proRataAmount.toString())}
                className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold text-[11px] hover:bg-blue-700 transition shrink-0"
              >
                Apply AED {proRataResult.proRataAmount}
              </button>
            </div>
          )}

          {/* Key Handover Checkboxes */}
          <div className="flex items-center gap-6 py-2 px-3 bg-amber-50/60 rounded-xl border border-amber-200/70">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Key className="w-4 h-4 text-amber-600" /> Keys Given:
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

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks & Special Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Lower bed booked, advance paid in cash"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Check-In & Add to Sheet</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

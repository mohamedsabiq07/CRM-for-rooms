import React, { useState, useEffect } from 'react';
import { X, Edit3, Calendar, Phone, Key, Trash2, Building2, DoorOpen, Bed } from 'lucide-react';
import { Tenant, SpaceType, BedType, Building, RoomUnit, LocationItem } from '../types/crm';
import { isFutureDate, normalizePhoneForStorage } from '../utils/dateUtils';

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  buildings?: Building[];
  rooms?: RoomUnit[];
  locations?: LocationItem[];
  selectedMonth?: string;
  onUpdateTenant: (updated: Tenant) => void;
  onDeleteTenant: (id: string) => void;
}

export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  isOpen,
  onClose,
  tenant,
  buildings = [],
  rooms = [],
  locations = [],
  selectedMonth,
  onUpdateTenant,
  onDeleteTenant,
}) => {
  if (!isOpen || !tenant) return null;

  const [sno, setSno] = useState(tenant.sno.toString());
  const [name, setName] = useState(tenant.name);
  const [place, setPlace] = useState(tenant.place);
  const [phone, setPhone] = useState(tenant.phone);
  const [deposit, setDeposit] = useState(tenant.deposit.toString());
  const [rentAmount, setRentAmount] = useState(tenant.rentAmount.toString());
  const [joiningDate, setJoiningDate] = useState(tenant.joiningDate);
  const [leavingDate, setLeavingDate] = useState(tenant.leavingDate || '');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(tenant.buildingId);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(tenant.roomId || '');
  const [section, setSection] = useState(tenant.section);
  const [partition, setPartition] = useState(tenant.partition);
  const [spaceType, setSpaceType] = useState<SpaceType>(tenant.spaceType || 'Partition');
  const [bedType, setBedType] = useState<BedType>(tenant.bedType || 'Lower Bed');
  const [cupboardKey, setCupboardKey] = useState(tenant.cupboardKey);
  const [doorKey, setDoorKey] = useState(tenant.doorKey);
  const [partitionKey, setPartitionKey] = useState(tenant.partitionKey ?? true);
  const [remarks, setRemarks] = useState(tenant.remarks);
  const [status, setStatus] = useState<Tenant['status']>(tenant.status);
  const [currentMonthStatus, setCurrentMonthStatus] = useState(tenant.currentMonthStatus);

  useEffect(() => {
    if (tenant) {
      setSno(tenant.sno.toString());
      setName(tenant.name);
      setPlace(tenant.place);
      setPhone(tenant.phone);
      setDeposit(tenant.deposit.toString());
      setRentAmount(tenant.rentAmount.toString());
      setJoiningDate(tenant.joiningDate);
      setLeavingDate(tenant.leavingDate || '');
      setSelectedBuildingId(tenant.buildingId);
      setSelectedRoomId(tenant.roomId || '');
      setSection(tenant.section);
      setPartition(tenant.partition);
      setSpaceType(tenant.spaceType || 'Partition');
      setBedType(tenant.bedType || 'Lower Bed');
      setCupboardKey(tenant.cupboardKey);
      setDoorKey(tenant.doorKey);
      setPartitionKey(tenant.partitionKey ?? true);
      setRemarks(tenant.remarks);
      setStatus(tenant.status);
      setCurrentMonthStatus(tenant.currentMonthStatus);
    }
  }, [tenant]);

  const currentBldRooms = rooms.filter(r => r.buildingId === selectedBuildingId);
  const originalBuilding = buildings.find(b => b.id === tenant.buildingId);
  const originalRoom = rooms.find(r => r.id === tenant.roomId);
  const targetBuilding = buildings.find(b => b.id === selectedBuildingId);
  const targetRoom = rooms.find(r => r.id === selectedRoomId);

  const isBuildingChanged = selectedBuildingId !== tenant.buildingId;
  const isRoomUnitChanged = Boolean(tenant.roomId && selectedRoomId !== tenant.roomId);
  const isLocationChanged = isBuildingChanged || isRoomUnitChanged;
  const isSectionChanged = (section || '').trim().toLowerCase() !== (tenant.section || '').trim().toLowerCase();

  const handleBuildingChange = (newBldId: string) => {
    setSelectedBuildingId(newBldId);
    const bldRooms = rooms.filter(r => r.buildingId === newBldId);
    if (bldRooms.length > 0) {
      setSelectedRoomId(bldRooms[0].id);
    } else {
      setSelectedRoomId('');
    }
  };

  const handleStatusChange = (newStatus: Tenant['status']) => {
    setStatus(newStatus);
    if (newStatus === 'Waiting for new tenant') {
      setCupboardKey(false);
      setDoorKey(false);
      setPartitionKey(false);
    }
  };

  const handleJoiningDateChange = (val: string) => {
    setJoiningDate(val);
    if (isFutureDate(val)) {
      setStatus('Waiting for new tenant');
      setCupboardKey(false);
      setDoorKey(false);
      setPartitionKey(false);
    }
  };

  const ROOM_QUICK_OPTIONS = [
    { label: 'Room 1', value: 'Room Number 1' },
    { label: 'Room 2', value: 'Room Number 2' },
    { label: 'Room 3', value: 'Room Number 3' },
    { label: 'HALL', value: 'HALL' },
    { label: 'ROOM', value: 'ROOM' },
    { label: 'MASTER ROOM', value: 'MASTER ROOM' },
    { label: 'BALCONY', value: 'BALCONY' },
  ];

  const isRoomSelected = (optValue: string, optLabel: string) => {
    const cur = (section || '').trim().toLowerCase();
    const val = optValue.toLowerCase();
    const lbl = optLabel.toLowerCase();
    if (cur === val || cur === lbl) return true;
    if (lbl === 'room 1' && (cur === 'room 1' || cur === 'room number 1')) return true;
    if (lbl === 'room 2' && (cur === 'room 2' || cur === 'room number 2')) return true;
    if (lbl === 'room 3' && (cur === 'room 3' || cur === 'room number 3')) return true;
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMonth = selectedMonth || tenant.stayMonth || 'Sep-2026';
    const numRent = Math.max(0, Number(rentAmount) || 0);
    const numDeposit = Math.max(0, Number(deposit) || 0);

    const updatedHistory: Record<string, 'Paid' | 'Pending' | 'Due' | 'Partial'> = {
      ...(tenant.monthStatusHistory || {}),
      [targetMonth]: currentMonthStatus,
    };

    const updatedPaymentAmounts: Record<string, number> = {
      ...(tenant.monthPaymentAmounts || {}),
      [targetMonth]: currentMonthStatus === 'Paid'
        ? numRent
        : currentMonthStatus === 'Due'
          ? 0
          : (tenant.monthPaymentAmounts?.[targetMonth] ?? Math.round(numRent / 2)),
    };

    onUpdateTenant({
      ...tenant,
      sno: parseInt(sno, 10) || tenant.sno,
      buildingId: selectedBuildingId,
      flatId: selectedBuildingId,
      roomId: selectedRoomId,
      name: name.trim(),
      place: place.trim(),
      phone: normalizePhoneForStorage(phone),
      deposit: numDeposit,
      depositNote: '', // Always clear legacy deposit notes
      rentAmount: numRent,
      joiningDate: joiningDate.trim(),
      leavingDate: leavingDate.trim() || null,
      section: section.trim(),
      partition: partition.trim().toLowerCase(),
      spaceType,
      bedType,
      cupboardKey,
      doorKey,
      partitionKey: spaceType === 'Partition' ? partitionKey : false,
      remarks: remarks.trim(),
      status,
      currentMonthStatus,
      monthStatusHistory: updatedHistory,
      monthPaymentAmounts: updatedPaymentAmounts,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-white rounded-lg border border-slate-700">
              <Edit3 className="w-5 h-5 text-[#38CE3C]" />
            </div>
            <div>
              <h3 className="text-base font-bold">Edit Tenant • Room & Location</h3>
              <p className="text-xs text-slate-400">
                Sno: #{tenant.sno} • {tenant.name} • {originalBuilding?.name || 'Building'} ({section || 'Room'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Form */}
        <form id="edit-tenant-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Property & Flat Location Card (Building & Room Unit Transfer) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                Property & Flat Location
              </span>
              {isLocationChanged ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  🔄 Transferring Flat
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400">
                  Current Flat Location
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Building / Property
                </label>
                <select
                  value={selectedBuildingId}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                >
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Room Unit / Flat #
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                >
                  {currentBldRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.roomType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Room Unit buttons if building has multiple units */}
            {currentBldRooms.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60">
                <span className="text-[11px] text-slate-500 font-medium">Quick Unit Switch:</span>
                {currentBldRooms.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRoomId(r.id)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      selectedRoomId === r.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Room {r.roomNumber}
                  </button>
                ))}
              </div>
            )}

            {/* Visual alert when location is changed */}
            {isLocationChanged && (
              <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-2.5 text-xs text-amber-900 flex items-start gap-2">
                <span className="text-base leading-none">⚠️</span>
                <div>
                  <p className="font-bold">Moving tenant to another location:</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    From: <strong>{originalBuilding?.name || 'Current Building'} • Room {originalRoom?.roomNumber || '-'}</strong>
                    <br />
                    To: <strong>{targetBuilding?.name || 'New Building'} • Room {targetRoom?.roomNumber || '-'}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Room Number & Bed Space Allocation (Sub-Room within flat) */}
          <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <DoorOpen className="w-3.5 h-3.5 text-indigo-600" />
                Room Number & Bed Allocation
              </span>
              {isSectionChanged && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
                  🔄 {tenant.section} ➔ {section}
                </span>
              )}
            </div>

            {/* 1-Click Room Number Switcher (Room 1, Room 2, Room 3, Hall...) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Room Number / Section
                </label>
                <span className="text-[11px] text-indigo-700 font-semibold">1-click to switch</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {ROOM_QUICK_OPTIONS.map(opt => {
                  const active = isRoomSelected(opt.value, opt.label);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSection(opt.value)}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                        active
                          ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs ring-1 ring-indigo-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                      }`}
                    >
                      {active && <span className="text-[10px]">✓</span>}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Section selector & Partition / Bed input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Room Name / Section Dropdown
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
                >
                  <option value="Room Number 1">Room Number 1 (Room 1)</option>
                  <option value="Room Number 2">Room Number 2 (Room 2)</option>
                  <option value="Room Number 3">Room Number 3 (Room 3)</option>
                  <option value="HALL">HALL</option>
                  <option value="ROOM">ROOM</option>
                  <option value="MASTER ROOM">MASTER ROOM</option>
                  <option value="BALCONY">BALCONY</option>
                  {!['Room Number 1', 'Room Number 2', 'Room Number 3', 'HALL', 'ROOM', 'MASTER ROOM', 'BALCONY'].includes(section) && (
                    <option value={section}>{section}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Partition / Bed Code
                </label>
                <input
                  type="text"
                  value={partition}
                  onChange={(e) => setPartition(e.target.value)}
                  placeholder="e.g. Bed 1, Bed 3, P1..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 uppercase font-bold text-slate-900 mb-1.5"
                />
                {/* Quick Bed / Partition Chips */}
                <div className="flex items-center gap-1 flex-wrap">
                  {spaceType === 'Bed Space' || (partition || '').toLowerCase().startsWith('bed')
                    ? ['Bed 1', 'Bed 2', 'Bed 3', 'Bed 4', 'Bed 5', 'Bed 6', 'Bed 7', 'Bed 8', 'Bed 9', 'Bed 10', 'Bed 11', 'Bed 12'].map(bCode => (
                        <button
                          key={bCode}
                          type="button"
                          onClick={() => setPartition(bCode)}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition cursor-pointer ${
                            (partition || '').toUpperCase() === bCode.toUpperCase()
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {bCode}
                        </button>
                      ))
                    : ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'].map(pCode => (
                        <button
                          key={pCode}
                          type="button"
                          onClick={() => setPartition(pCode)}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition cursor-pointer ${
                            (partition || '').toUpperCase() === pCode
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {pCode}
                        </button>
                      ))
                  }
                </div>
              </div>
            </div>

            {/* Space Type & Bunker Bed selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-indigo-200/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bunker Position (Upper / Lower)
                </label>
                <div className="grid grid-cols-2 gap-2 mb-1.5">
                  <button
                    type="button"
                    onClick={() => setBedType('Lower Bed')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      bedType === 'Lower Bed'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>⬇️</span> Lower Bed
                  </button>
                  <button
                    type="button"
                    onClick={() => setBedType('Upper Bed')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      bedType === 'Upper Bed'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>⬆️</span> Upper Bed
                  </button>
                </div>
                <select
                  value={bedType}
                  onChange={(e) => setBedType(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
                >
                  <option value="Lower Bed">Lower Bed</option>
                  <option value="Upper Bed">Upper Bed</option>
                  <option value="Private Partition">Private Partition</option>
                  <option value="Single Bed">Single Bed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Space Type
                </label>
                <select
                  value={spaceType}
                  onChange={(e) => setSpaceType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-semibold text-slate-900"
                >
                  <option value="Partition">Partition</option>
                  <option value="Without Partition">Without Partition</option>
                  <option value="Bed Space">Bed Space</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Serial Number & Tenant Info */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Serial # (Sno)
              </label>
              <input
                type="number"
                value={sno}
                onChange={(e) => setSno(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold text-slate-900 text-center bg-amber-50/50"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tenant Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Place / Origin
              </label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="flex rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-slate-900">
                <span className="inline-flex items-center px-2.5 bg-slate-100 text-slate-700 text-xs font-semibold border-r border-slate-200 select-none">
                  🇦🇪 +971
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="50 123 4567 or 050..."
                  className="w-full text-sm px-3 py-2 text-slate-900 focus:outline-none font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Accepts 050..., 50..., or international number</p>
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
                onChange={(e) => handleJoiningDateChange(e.target.value)}
                className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Rent & Deposit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rent (AED)
              </label>
              <input
                type="number"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                className="w-full text-sm px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold text-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Deposit (AED)
                </label>
                <div className="flex items-center gap-1">
                  {['0', '100', '150', '200'].map(dVal => (
                    <button
                      key={dVal}
                      type="button"
                      onClick={() => setDeposit(dVal)}
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border transition cursor-pointer ${
                        deposit === dVal
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dVal}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="0"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="w-full text-sm px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Keys Handover */}
          <div className="space-y-1">
            <div className="flex items-center gap-6 py-2 px-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Key className="w-4 h-4 text-slate-600" /> Keys:
              </span>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cupboardKey}
                  onChange={(e) => setCupboardKey(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
                />
                Cupboard Key (Cu/k)
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doorKey}
                  onChange={(e) => setDoorKey(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
                />
                Door Key (D/k)
              </label>
              {spaceType === 'Partition' && (
                <label className="flex items-center gap-2 text-xs font-semibold text-purple-900 cursor-pointer bg-purple-100/70 px-2 py-0.5 rounded-md border border-purple-200">
                  <input
                    type="checkbox"
                    checked={partitionKey}
                    onChange={(e) => setPartitionKey(e.target.checked)}
                    className="rounded text-purple-900 focus:ring-purple-900 w-4 h-4"
                  />
                  Partition Key (P/k)
                </label>
              )}
            </div>
            {status === 'Waiting for new tenant' && (
              <p className="text-[11px] text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200/70 font-medium">
                ℹ️ Keys unticked automatically (Waiting for new tenant).
              </p>
            )}
          </div>

          {/* Payment Status & Occupancy Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Status
              </label>
              <select
                value={currentMonthStatus}
                onChange={(e) => setCurrentMonthStatus(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold text-slate-900"
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
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold text-slate-900"
              >
                <option value="Active">Active</option>
                <option value="Waiting for new tenant">Waiting for new tenant</option>
                <option value="Vacated">Vacated (Moved Out)</option>
                <option value="Checked Out">Checked Out</option>
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
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 italic"
            />
          </div>
        </form>

        {/* Sticky Footer & Delete */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${tenant.name}?`)) {
                onDeleteTenant(tenant.id);
                onClose();
              }
            }}
            className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-tenant-form"
              className="px-5 py-2.5 sm:py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

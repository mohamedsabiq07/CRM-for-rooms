import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Zap, 
  Wifi, 
  Calendar, 
  Phone, 
  DoorOpen, 
  FileSpreadsheet,
  Edit2,
  Trash2,
  CreditCard,
  Users,
  Bed,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Building, RoomUnit, Tenant, LocationItem } from '../types/crm';
import { getLiveCalendarMonth, getTenantStatusForMonth } from '../utils/dateUtils';

interface BuildingsPageProps {
  buildings: Building[];
  rooms: RoomUnit[];
  tenants: Tenant[];
  locations: LocationItem[];
  onOpenAddBuilding: () => void;
  onDeleteBuilding: (buildingId: string) => void;
  onOpenAddRoom: (building: Building) => void;
  onEditRoom: (building: Building, room: RoomUnit) => void;
  onSelectRoomInSheet: (buildingId: string, roomId: string) => void;
  onQuickToggleBillStatus: (roomId: string, billType: 'dewa' | 'wifi') => void;
}

export const BuildingsPage: React.FC<BuildingsPageProps> = ({
  buildings,
  rooms,
  tenants,
  locations,
  onOpenAddBuilding,
  onDeleteBuilding,
  onOpenAddRoom,
  onEditRoom,
  onSelectRoomInSheet,
  onQuickToggleBillStatus,
}) => {
  const [selectedLocFilter, setSelectedLocFilter] = useState<string>('all');
  const [utilityFilter, setUtilityFilter] = useState<'all' | 'pending' | 'paid'>('all');

  const currentMonth = getLiveCalendarMonth();

  const filteredBuildings = buildings.filter(b => {
    if (selectedLocFilter === 'all') return true;
    return b.locationId === selectedLocFilter;
  });

  const filteredBuildingIds = new Set(filteredBuildings.map(b => b.id));
  const filteredRooms = rooms.filter(r => filteredBuildingIds.has(r.buildingId));

  // High-level occupancy & financial metrics
  const totalAnnualOwnerRent = buildings.reduce((sum, b) => sum + (Number(b.ownerRentAnnual) || 0), 0);
  const monthlyOwnerRent = Math.round(totalAnnualOwnerRent / 12);

  const activeTenants = tenants.filter(t => t.status === 'Active');
  const totalMonthlyTenantRent = activeTenants.reduce((sum, t) => sum + (Number(t.rentAmount) || 0), 0);

  // Calculate Pending vs Paid utility bills across all rooms
  const totalMonthlyDewa = rooms.reduce((sum, r) => sum + (Number(r.dewaBill?.amount) || 0), 0);
  const totalMonthlyWifi = rooms.reduce((sum, r) => sum + (Number(r.wifiBill?.amount) || 0), 0);

  const pendingDewaAmount = rooms.reduce(
    (sum, r) => sum + (r.dewaBill?.status !== 'Paid' ? (Number(r.dewaBill?.amount) || 0) : 0),
    0
  );
  const pendingWifiAmount = rooms.reduce(
    (sum, r) => sum + (r.wifiBill?.status !== 'Paid' ? (Number(r.wifiBill?.amount) || 0) : 0),
    0
  );
  const totalPendingUtilities = pendingDewaAmount + pendingWifiAmount;
  const totalPaidUtilities = (totalMonthlyDewa + totalMonthlyWifi) - totalPendingUtilities;

  const pendingUtilityCount = rooms.reduce((count, r) => {
    let c = 0;
    if (r.dewaBill?.status !== 'Paid') c++;
    if (r.wifiBill?.status !== 'Paid') c++;
    return count + c;
  }, 0);

  const totalMonthlyExpenses = monthlyOwnerRent + totalMonthlyDewa + totalMonthlyWifi;
  const estimatedMonthlyProfit = totalMonthlyTenantRent - totalMonthlyExpenses;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Financial Metrics */}
      <div className="bg-[#181824] text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-[#262638]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#38CE3C] uppercase tracking-widest">
              <Building2 className="w-4 h-4 text-[#38CE3C]" />
              <span>Buildings, Room Occupancy &amp; Utility Overview</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              {buildings.length} Properties • {rooms.length} Configured Flats
            </h2>
          </div>

          <button
            onClick={onOpenAddBuilding}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#38CE3C] hover:bg-[#30b533] text-[#181824] font-bold rounded-lg text-xs shadow-sm transition self-start md:self-auto cursor-pointer border border-[#38CE3C]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Property</span>
          </button>
        </div>

        {/* Horizontal KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Annual Master Rent
            </span>
            <span className="text-lg font-bold text-white mt-0.5 block">
              AED {totalAnnualOwnerRent.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">
              ~AED {monthlyOwnerRent.toLocaleString()} / mo
            </span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Monthly Tenant Inflow
            </span>
            <span className="text-lg font-bold text-white mt-0.5 block">
              AED {totalMonthlyTenantRent.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">
              {activeTenants.length} active tenants
            </span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pending Utility Bills
            </span>
            <span className={`text-lg font-bold mt-0.5 block ${totalPendingUtilities > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              AED {totalPendingUtilities.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">
              {pendingUtilityCount} pending • AED {totalPaidUtilities.toLocaleString()} paid
            </span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Estimated Net Cash Flow
            </span>
            <span className={`text-lg font-bold mt-0.5 block ${
              estimatedMonthlyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {estimatedMonthlyProfit >= 0 ? '+' : ''}AED {estimatedMonthlyProfit.toLocaleString()} / mo
            </span>
            <span className="text-[11px] text-slate-400">
              Net margin after expenses
            </span>
          </div>
        </div>
      </div>

      {/* Location Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Filter:</span>
        <button
          onClick={() => setSelectedLocFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            selectedLocFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Locations ({buildings.length})
        </button>
        {locations.map(loc => {
          const count = buildings.filter(b => b.locationId === loc.id).length;
          return (
            <button
              key={loc.id}
              onClick={() => setSelectedLocFilter(loc.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedLocFilter === loc.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {loc.name} ({count})
            </button>
          );
        })}
      </div>

      {/* ══ SECTION 1: BUILDINGS & ROOMS (HORIZONTAL ROWS — CAPACITY, OCCUPANCY & TENANTS ONLY) ══ */}
      <div className="space-y-4">
        {filteredBuildings.map((building) => {
          const buildingRooms = rooms.filter(r => r.buildingId === building.id);
          const location = locations.find(l => l.id === building.locationId);

          const bldActiveTenants = tenants.filter(t => t.buildingId === building.id && t.status === 'Active');
          const bldTotalCapacity = buildingRooms.reduce((s, r) => s + (r.capacity || 10), 0);
          const bldVacant = Math.max(0, bldTotalCapacity - bldActiveTenants.length);

          return (
            <div
              key={building.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* Building Horizontal Header Bar */}
              <div className="bg-slate-900 text-white px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold tracking-tight text-white">{building.name}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-[#38CE3C] border border-slate-700 uppercase">
                        {location?.name || 'Dubai'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{building.address}</span>
                    </p>
                  </div>

                  {/* Building-level Horizontal Summary Pills */}
                  <div className="flex items-center gap-2 flex-wrap text-xs sm:pl-4 sm:border-l sm:border-slate-800">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 font-semibold border border-slate-700">
                      {buildingRooms.length} Unit{buildingRooms.length === 1 ? '' : 's'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 font-semibold border border-slate-700">
                      {bldActiveTenants.length} / {bldTotalCapacity} Occupied
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg font-bold border ${
                      bldVacant > 0
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {bldVacant > 0 ? `${bldVacant} Vacant` : 'Full'}
                    </span>
                  </div>
                </div>

                {/* Right: Owner Contract, Cheque & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Contract: <strong className="text-white">AED {building.ownerRentAnnual.toLocaleString()}/yr</strong>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      Next Cheque: <strong className="text-amber-300">{building.nextChequeDueDate}</strong> (AED {building.chequeAmount.toLocaleString()})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {building.ownerPhone && (
                      <a
                        href={`tel:${building.ownerPhone.replace(/\s+/g, '')}`}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
                        title="Call Building Owner / Real Estate"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{building.ownerName || 'Landlord'}</span>
                      </a>
                    )}

                    <button
                      onClick={() => onOpenAddRoom(building)}
                      className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 bg-[#38CE3C] hover:bg-[#30b533] text-[#181824] rounded-lg transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add Room</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove "${building.name}" from Tenant Management?`)) {
                          onDeleteBuilding(building.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg border border-slate-800 transition cursor-pointer"
                      title="Remove Building"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Horizontal Rooms List (Strictly Room Capacity, Occupancy & Tenants) */}
              <div className="divide-y divide-slate-200">
                {buildingRooms.length === 0 ? (
                  <div className="py-6 px-5 text-center bg-slate-50">
                    <p className="text-xs text-slate-400 italic">No rooms registered under this building yet.</p>
                  </div>
                ) : (
                  buildingRooms.map((room) => {
                    const roomTenants = tenants.filter(t => t.roomId === room.id && t.status === 'Active');
                    const waitingTenants = tenants.filter(t => t.roomId === room.id && t.status === 'Waiting for new tenant');
                    const totalAllocated = roomTenants.length + waitingTenants.length;
                    const roomCapacity = room.capacity || 10;
                    const vacantCount = Math.max(0, roomCapacity - totalAllocated);

                    // Calculate Tenant Rent Paid vs Pending for this room
                    let roomRentTotal = 0;
                    let roomRentPaid = 0;
                    let paidTenantsCount = 0;
                    let pendingTenantsCount = 0;

                    roomTenants.forEach(t => {
                      const rent = Number(t.rentAmount) || 0;
                      const st = getTenantStatusForMonth(t, currentMonth);
                      const paidAmt = t.monthPaymentAmounts?.[currentMonth] !== undefined
                        ? Number(t.monthPaymentAmounts[currentMonth]) || 0
                        : (st === 'Paid' ? rent : 0);
                      roomRentTotal += rent;
                      roomRentPaid += paidAmt;
                      if (st === 'Paid' || (rent > 0 && paidAmt >= rent)) {
                        paidTenantsCount++;
                      } else {
                        pendingTenantsCount++;
                      }
                    });
                    const roomRentPending = Math.max(0, roomRentTotal - roomRentPaid);

                    const isNamed = /unit|hall/i.test(room.roomNumber);
                    const cleanNum = room.roomNumber.replace(/^(room|flat)\s*/i, '').replace(/\s*\(.*\)$/, '').trim();
                    const displayRoomLabel = isNamed ? room.roomNumber : `Flat ${cleanNum}`;

                    return (
                      <div
                        key={room.id}
                        className="px-5 py-3.5 hover:bg-slate-50/80 transition flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3"
                      >
                        {/* Left: Room Number & Type */}
                        <div className="flex items-center gap-3 min-w-[210px]">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                            <DoorOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-slate-900">
                                {displayRoomLabel}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {room.roomType || 'Partition Flat'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Master Rent: <strong className="text-slate-700">AED {Number(room.actualRentAnnual || 0).toLocaleString()}/yr</strong>
                            </p>
                          </div>
                        </div>

                        {/* Middle: Horizontal Capacity, Occupancy, Tenants & Pending Rent Strip */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-1">
                          {/* Capacity Badge */}
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                            <Bed className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-slate-500">Capacity:</span>
                            <span className="font-bold text-slate-900">{roomCapacity} Beds</span>
                          </div>

                          {/* Active Tenants Badge */}
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-indigo-900 font-bold">{roomTenants.length} Active Tenants</span>
                            {waitingTenants.length > 0 && (
                              <span className="text-amber-700 font-semibold">
                                (+{waitingTenants.length} Waiting)
                              </span>
                            )}
                          </div>

                          {/* Vacancy Status Badge */}
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                            vacantCount > 0
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            <span>
                              {vacantCount > 0 ? `${vacantCount} Vacant Space${vacantCount === 1 ? '' : 's'}` : '✓ 100% Occupied'}
                            </span>
                          </div>

                          {/* Tenant Rent Paid vs Pending */}
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                            <span className="text-emerald-700 font-bold">
                              Paid: AED {roomRentPaid.toLocaleString()} ({paidTenantsCount})
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className={`font-bold ${roomRentPending > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                              Pending: AED {roomRentPending.toLocaleString()} ({pendingTenantsCount})
                            </span>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 self-end xl:self-center shrink-0">
                          <button
                            onClick={() => onSelectRoomInSheet(building.id, room.id)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow-2xs cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-[#38CE3C]" />
                            <span>Open Tenants</span>
                          </button>

                          <button
                            onClick={() => onEditRoom(building, room)}
                            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
                            title="Edit Room Capacity & Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ SECTION 2: DEDICATED HORIZONTAL BOX FOR DEWA/SEWA & WI-FI BILLS (PENDING & PAID) ══ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#181824] text-white px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#262638]">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                DEWA / SEWA &amp; Wi-Fi Utility Bills — Pending &amp; Paid
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Horizontal utility tracker across all rooms. Click any status badge to toggle between Pending/Due and Paid.
            </p>
          </div>

          {/* Pending vs Paid Summary & Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-[#222234] px-3 py-1.5 rounded-xl border border-[#2f2f45] text-xs">
              <span className="text-rose-400 font-bold">
                Pending: AED {totalPendingUtilities.toLocaleString()}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[#38CE3C] font-bold">
                Paid: AED {totalPaidUtilities.toLocaleString()}
              </span>
            </div>

            <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setUtilityFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  utilityFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({filteredRooms.length})
              </button>
              <button
                onClick={() => setUtilityFilter('pending')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  utilityFilter === 'pending' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending Only
              </button>
              <button
                onClick={() => setUtilityFilter('paid')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  utilityFilter === 'paid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Paid Only
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Rows of Utility Bills */}
        <div className="divide-y divide-slate-200">
          {filteredRooms
            .filter(room => {
              const dewaPending = room.dewaBill?.status !== 'Paid';
              const wifiPending = room.wifiBill?.status !== 'Paid';
              if (utilityFilter === 'pending') return dewaPending || wifiPending;
              if (utilityFilter === 'paid') return !dewaPending && !wifiPending;
              return true;
            })
            .map(room => {
              const building = buildings.find(b => b.id === room.buildingId);
              const isNamed = /unit|hall/i.test(room.roomNumber);
              const cleanNum = room.roomNumber.replace(/^(room|flat)\s*/i, '').replace(/\s*\(.*\)$/, '').trim();
              const displayRoomLabel = isNamed ? room.roomNumber : `Flat ${cleanNum}`;

              const dewaPaid = room.dewaBill?.status === 'Paid';
              const wifiPaid = room.wifiBill?.status === 'Paid';
              const dewaAmt = Number(room.dewaBill?.amount) || 0;
              const wifiAmt = Number(room.wifiBill?.amount) || 0;
              const roomPendingAmt = (dewaPaid ? 0 : dewaAmt) + (wifiPaid ? 0 : wifiAmt);

              return (
                <div
                  key={room.id}
                  className="px-5 py-3.5 hover:bg-slate-50/80 transition flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-xs"
                >
                  {/* 1. Property & Room Identifier */}
                  <div className="min-w-[220px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {building?.name || 'Building'}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {displayRoomLabel}
                    </span>
                  </div>

                  {/* 2. DEWA / SEWA Horizontal Strip */}
                  <div className="flex items-center justify-between sm:justify-start gap-3 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 flex-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {room.dewaBill?.provider || 'DEWA'} Bill: AED {dewaAmt.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Due: {room.dewaBill?.dueDate || 'End of month'}
                          {room.dewaBill?.accountNumber ? ` • Acc #${room.dewaBill.accountNumber}` : ''}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onQuickToggleBillStatus(room.id, 'dewa')}
                      className={`ml-auto px-2.5 py-1 rounded-lg font-bold text-[11px] border transition cursor-pointer flex items-center gap-1 ${
                        dewaPaid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                      title="Click to toggle Paid / Pending"
                    >
                      {dewaPaid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Pending ({room.dewaBill?.status || 'Due'})</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 3. Wi-Fi Horizontal Strip */}
                  <div className="flex items-center justify-between sm:justify-start gap-3 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 flex-1">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 block">
                          Wi-Fi ({room.wifiBill?.provider || 'Du'}): AED {wifiAmt.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Due: {room.wifiBill?.dueDate || '15th'}
                          {room.wifiBill?.accountNumber ? ` • Acc #${room.wifiBill.accountNumber}` : ''}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onQuickToggleBillStatus(room.id, 'wifi')}
                      className={`ml-auto px-2.5 py-1 rounded-lg font-bold text-[11px] border transition cursor-pointer flex items-center gap-1 ${
                        wifiPaid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                      title="Click to toggle Paid / Pending"
                    >
                      {wifiPaid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Pending ({room.wifiBill?.status || 'Due'})</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 4. Room Utility Pending Status */}
                  <div className="min-w-[140px] text-right">
                    {roomPendingAmt > 0 ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-extrabold">
                        Pending: AED {roomPendingAmt.toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold">
                        ✓ All Settled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

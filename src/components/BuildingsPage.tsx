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
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  TrendingUp,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { Building, RoomUnit, Tenant, LocationItem } from '../types/crm';

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

  const filteredBuildings = buildings.filter(b => {
    if (selectedLocFilter === 'all') return true;
    return b.locationId === selectedLocFilter;
  });

  // Calculate high-level financial metrics
  const totalAnnualOwnerRent = buildings.reduce((sum, b) => sum + (Number(b.ownerRentAnnual) || 0), 0);
  const monthlyOwnerRent = Math.round(totalAnnualOwnerRent / 12);

  const activeTenants = tenants.filter(t => t.status === 'Active');
  const totalMonthlyTenantRent = activeTenants.reduce((sum, t) => sum + (Number(t.rentAmount) || 0), 0);

  const totalMonthlyDewa = rooms.reduce((sum, r) => sum + (Number(r.dewaBill?.amount) || 0), 0);
  const totalMonthlyWifi = rooms.reduce((sum, r) => sum + (Number(r.wifiBill?.amount) || 0), 0);
  const totalMonthlyExpenses = monthlyOwnerRent + totalMonthlyDewa + totalMonthlyWifi;
  const estimatedMonthlyProfit = totalMonthlyTenantRent - totalMonthlyExpenses;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Financial Metrics */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-widest">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Building Portfolio & Utility Operations</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              {buildings.length} Properties Under Management
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Track landlord contracts, upcoming cheque dates, and room-level utility bills.
            </p>
          </div>

          <button
            onClick={onOpenAddBuilding}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-950 font-semibold rounded-lg text-xs shadow-sm transition self-start md:self-auto cursor-pointer border border-slate-200"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Property</span>
          </button>
        </div>

        {/* Financial KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
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
              Monthly Utilities (DEWA + Wi-Fi)
            </span>
            <span className="text-lg font-bold text-white mt-0.5 block">
              AED {(totalMonthlyDewa + totalMonthlyWifi).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">
              DEWA: {totalMonthlyDewa} • Wi-Fi: {totalMonthlyWifi}
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
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
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

      {/* Buildings Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBuildings.map((building) => {
          const buildingRooms = rooms.filter(r => r.buildingId === building.id);
          const location = locations.find(l => l.id === building.locationId);

          return (
            <div
              key={building.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition flex flex-col justify-between"
            >
              <div>
                {/* Building Header Banner */}
                <div className="bg-slate-900 text-white p-5 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold tracking-tight text-white">{building.name}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                        {location?.name || 'Dubai'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{building.address}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-medium block">Owner Contract</span>
                    <span className="text-sm font-bold text-white">
                      AED {building.ownerRentAnnual.toLocaleString()} / yr
                    </span>
                  </div>
                </div>

                {/* Owner Payment Terms & Next Cheque Alert */}
                <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-700">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">
                        {building.paymentTerms} Terms (AED {building.chequeAmount.toLocaleString()} / cheque)
                      </span>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Next Cheque: <strong>{building.nextChequeDueDate}</strong></span>
                      </p>
                    </div>
                  </div>

                  {building.ownerPhone && (
                    <a
                      href={`tel:${building.ownerPhone.replace(/\s+/g, '')}`}
                      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-white rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm"
                      title="Call Building Owner / Real Estate"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{building.ownerName || 'Call Landlord'}</span>
                    </a>
                  )}
                </div>

                {/* Rooms List Section */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <DoorOpen className="w-4 h-4 text-slate-500" />
                      <span>Configured Units ({buildingRooms.length})</span>
                    </h4>

                    <button
                      onClick={() => onOpenAddRoom(building)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-slate-100 border border-slate-200 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Room</span>
                    </button>
                  </div>

                  {buildingRooms.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400 italic">No rooms registered under this building yet.</p>
                      <button
                        onClick={() => onOpenAddRoom(building)}
                        className="mt-2 text-xs font-semibold text-slate-700 hover:underline"
                      >
                        + Add Room (e.g. 103, 601)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {buildingRooms.map((room) => {
                        const roomTenants = tenants.filter(t => t.roomId === room.id && t.status === 'Active');
                        const roomIncome = roomTenants.reduce((sum, t) => sum + (Number(t.rentAmount) || 0), 0);

                        return (
                          <div
                            key={room.id}
                            className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200 hover:border-slate-300 transition"
                          >
                            {/* Room Header & Quick Access */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-slate-900">
                                    Room {room.roomNumber}
                                  </span>
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                    {room.roomType || 'Partition Flat'}
                                  </span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                    Math.max(0, (room.capacity || 10) - roomTenants.length) > 0 
                                      ? 'bg-slate-100 text-slate-700 border-slate-200' 
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {Math.max(0, (room.capacity || 10) - roomTenants.length) > 0 
                                      ? `${Math.max(0, (room.capacity || 10) - roomTenants.length)} Vacant (${roomTenants.length}/${room.capacity || 10} Beds)` 
                                      : `Full (${room.capacity || 10} Beds)`}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Master Rent: <strong className="text-slate-800">AED {Number(room.actualRentAnnual || 0).toLocaleString()}/yr</strong> • Tenant Inflow: <strong className="text-slate-800">AED {roomIncome.toLocaleString()}/mo</strong>
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Open in Sheet Button */}
                                <button
                                  onClick={() => onSelectRoomInSheet(building.id, room.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition shadow-sm"
                                  title={`Open Room ${room.roomNumber} in Tenants Spreadsheet`}
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                  <span>Open Sheet</span>
                                </button>

                                <button
                                  onClick={() => onEditRoom(building, room)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition"
                                  title="Edit Room & Utilities"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Utilities: DEWA & Wi-Fi */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                              {/* DEWA Bill Card */}
                              <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                                      <Zap className="w-3.5 h-3.5 text-slate-500" /> DEWA Bill
                                    </span>
                                    <button
                                      onClick={() => onQuickToggleBillStatus(room.id, 'dewa')}
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition ${
                                        room.dewaBill?.status === 'Paid'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-slate-100 text-slate-700 border-slate-200'
                                      }`}
                                      title="Click to toggle Paid/Due"
                                    >
                                      {room.dewaBill?.status || 'Due'}
                                    </button>
                                  </div>
                                  <div className="mt-1 flex items-baseline justify-between">
                                    <span className="text-xs font-bold text-slate-900">
                                      AED {room.dewaBill?.amount || 0}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {room.dewaBill?.accountNumber ? `#${room.dewaBill.accountNumber}` : ''}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  Due: {room.dewaBill?.dueDate || 'End of month'}
                                </span>
                              </div>

                              {/* Wi-Fi Bill Card */}
                              <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                                      <Wifi className="w-3.5 h-3.5 text-slate-500" /> Wi-Fi ({room.wifiBill?.provider || 'Du'})
                                    </span>
                                    <button
                                      onClick={() => onQuickToggleBillStatus(room.id, 'wifi')}
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition ${
                                        room.wifiBill?.status === 'Paid'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-slate-100 text-slate-700 border-slate-200'
                                      }`}
                                      title="Click to toggle Paid/Due"
                                    >
                                      {room.wifiBill?.status || 'Due'}
                                    </button>
                                  </div>
                                  <div className="mt-1 flex items-baseline justify-between">
                                    <span className="text-xs font-bold text-slate-900">
                                      AED {room.wifiBill?.amount || 0}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {room.wifiBill?.accountNumber ? `#${room.wifiBill.accountNumber}` : ''}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  Due: {room.wifiBill?.dueDate || '15th'}
                                </span>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Building Bottom Footer with Vacate/Remove Building Option */}
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-600">{buildingRooms.length} room units configured</span>
                
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove "${building.name}" from your CRM?\n\nThis will vacate and remove the building, its rooms, and utilities from your active dashboard.`)) {
                      onDeleteBuilding(building.id);
                    }
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-md border border-slate-200 transition"
                  title="Vacate and remove this building"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />
                  <span>Remove Building</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

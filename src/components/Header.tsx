import React from 'react';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Bell, 
  FileSpreadsheet, 
  Search, 
  Calculator,
  History,
  DoorOpen,
  LayoutGrid,
  LogOut,
  User
} from 'lucide-react';
import { LocationItem, Building, RoomUnit, RentNotification, OwnerChequeNotification, UtilityNotification } from '../types/crm';

interface HeaderProps {
  currentView: 'sheet' | 'buildings';
  onChangeView: (view: 'sheet' | 'buildings') => void;
  locations: LocationItem[];
  buildings: Building[];
  rooms: RoomUnit[];
  selectedLocationId: string;
  selectedBuildingId: string;
  selectedRoomId: string;
  onSelectLocation: (locId: string) => void;
  onSelectBuilding: (bldId: string) => void;
  onSelectRoom: (roomId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddTenant: () => void;
  onOpenAddBuilding: () => void;
  onOpenRentCalculator: () => void;
  onOpenPastTenants: () => void;
  pastTenantsCount: number;
  onToggleNotifications: () => void;
  onExportExcel: () => void;
  onLogout: () => void;
  tenantNotifications: RentNotification[];
  chequeNotifications: OwnerChequeNotification[];
  utilityNotifications: UtilityNotification[];
  isNotificationOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onChangeView,
  locations,
  buildings,
  rooms,
  selectedLocationId,
  selectedBuildingId,
  selectedRoomId,
  onSelectLocation,
  onSelectBuilding,
  onSelectRoom,
  searchQuery,
  onSearchChange,
  onOpenAddTenant,
  onOpenAddBuilding,
  onOpenRentCalculator,
  onOpenPastTenants,
  pastTenantsCount,
  onToggleNotifications,
  onExportExcel,
  onLogout,
  tenantNotifications,
  chequeNotifications,
  utilityNotifications,
  isNotificationOpen,
}) => {
  const currentBuildings = buildings.filter(b => b.locationId === selectedLocationId);
  const currentRooms = rooms.filter(r => r.buildingId === selectedBuildingId);

  const totalUrgentCount = 
    tenantNotifications.filter(n => n.status === 'overdue' || n.status === 'due_today').length +
    chequeNotifications.length +
    utilityNotifications.filter(u => u.status === 'overdue' || u.status === 'due_today').length;

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Brand & Main View Navigation */}
          <div className="flex items-center flex-wrap gap-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  Room CRM <span className="text-[10px] bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-400/30">Dubai</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Buildings & Partitions</p>
              </div>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => onChangeView('sheet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentView === 'sheet'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Tenants Sheet</span>
              </button>

              <button
                onClick={() => onChangeView('buildings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentView === 'buildings'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Buildings & Utilities ({buildings.length})</span>
              </button>
            </div>

            {/* Contextual Selectors (shown when in Sheet view) */}
            {currentView === 'sheet' && (
              <div className="flex items-center flex-wrap gap-2">
                {/* Building Selector */}
                <div className="flex items-center space-x-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <select
                    value={selectedBuildingId}
                    onChange={(e) => onSelectBuilding(e.target.value)}
                    aria-label="Select Building"
                    className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
                  >
                    {buildings.map((bld) => (
                      <option key={bld.id} value={bld.id} className="bg-slate-800 text-white">
                        {bld.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Number Selector */}
                <div className="flex items-center space-x-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700">
                  <DoorOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <select
                    value={selectedRoomId}
                    onChange={(e) => onSelectRoom(e.target.value)}
                    aria-label="Select Room Number"
                    className="bg-transparent text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer pr-1"
                  >
                    {currentRooms.length === 0 ? (
                      <option value="" className="bg-slate-800 text-slate-400">No rooms</option>
                    ) : (
                      currentRooms.map((room) => (
                        <option key={room.id} value={room.id} className="bg-slate-800 text-white">
                          Room {room.roomNumber} ({room.roomType.split(' ')[0]})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Search, Action Buttons, User Profile & Notifications */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Search Input */}
            <div className="relative min-w-[150px] sm:min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search tenant, partition, place..."
                className="w-full bg-slate-800 text-xs text-white placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            {/* Pro-Rata Rent Calculator Quick Tool */}
            <button
              onClick={onOpenRentCalculator}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-semibold border border-amber-500/30 shadow-sm transition cursor-pointer"
              title="Pro-Rata Rent Calculator for Mid-Month Arrivals"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Rent Calc</span>
            </button>

            {/* Past Stays / Checkout Archive */}
            <button
              onClick={onOpenPastTenants}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 rounded-lg text-xs font-semibold border border-indigo-500/30 shadow-sm transition cursor-pointer"
              title="Past Tenants & Vacated History"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Past Stays</span>
              {pastTenantsCount > 0 && (
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1 rounded font-bold">
                  {pastTenantsCount}
                </span>
              )}
            </button>

            {/* Excel Export (if in sheet) */}
            {currentView === 'sheet' && (
              <button
                onClick={onExportExcel}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold border border-emerald-500/50 shadow-sm transition"
                title="Export Current Sheet to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>
            )}

            {/* Notifications Bell with Total Due Count */}
            <button
              onClick={onToggleNotifications}
              className={`relative p-2 rounded-lg border transition ${
                isNotificationOpen 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' 
                  : totalUrgentCount > 0
                    ? 'bg-rose-950/70 text-rose-300 border-rose-600/60 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
              title="Notifications: Tenant Rent + Owner Cheques + DEWA/Wi-Fi"
            >
              <Bell className="w-4 h-4" />
              {totalUrgentCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-full border border-slate-900 shadow">
                  {totalUrgentCount}
                </span>
              )}
            </button>

            {/* Contextual Action Button */}
            {currentView === 'sheet' ? (
              <button
                onClick={onOpenAddTenant}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Tenant</span>
              </button>
            ) : (
              <button
                onClick={onOpenAddBuilding}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Building</span>
              </button>
            )}

            {/* User Profile & Logout */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
              <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs font-semibold text-amber-300">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>abuthalif</span>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

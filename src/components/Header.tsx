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
  TrendingUp,
  Receipt,
  DoorOpen,
  LayoutGrid,
  LogOut,
  User,
  Users,
  Zap,
  Calendar,
  FolderArchive
} from 'lucide-react';
import { LocationItem, Building, RoomUnit, RentNotification, OwnerChequeNotification, UtilityNotification } from '../types/crm';

interface HeaderProps {
  currentView: 'sheet' | 'buildings' | 'profit_loss' | 'followups';
  onChangeView: (view: 'sheet' | 'buildings' | 'profit_loss' | 'followups') => void;
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
  onOpenAddExpense?: () => void;
  onOpenRentCalculator: () => void;
  onOpenPastTenants: () => void;
  onOpenMonthlyBills?: () => void;
  pastTenantsCount: number;
  inquiryCount?: number;
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  availableMonths?: string[];
  onOpenMonthHistory?: () => void;
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
  onOpenAddExpense,
  onOpenRentCalculator,
  onOpenPastTenants,
  onOpenMonthlyBills,
  pastTenantsCount,
  inquiryCount = 0,
  selectedMonth,
  onMonthChange,
  availableMonths = [],
  onOpenMonthHistory,
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
    <header className="bg-[#181824] text-white sticky top-0 z-30 shadow-sm border-b border-[#262638]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Brand & Main View Navigation */}
          <div className="flex items-center flex-wrap gap-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#38CE3C] border border-[#38CE3C] flex items-center justify-center text-[#181824] font-bold shrink-0 shadow-sm">
                <Building2 className="w-5 h-5 text-[#181824]" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  RentPulse <span className="text-[10px] bg-[#38CE3C]/15 text-[#38CE3C] font-semibold px-2 py-0.5 rounded border border-[#38CE3C]/30">Dubai</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-normal">Property & Tenant Management</p>
              </div>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => onChangeView('sheet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  currentView === 'sheet'
                    ? 'bg-slate-800 text-white shadow-sm font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tenants Sheet</span>
              </button>

              <button
                onClick={() => onChangeView('buildings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  currentView === 'buildings'
                    ? 'bg-slate-800 text-white shadow-sm font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
                <span>Buildings & Rooms ({buildings.length})</span>
              </button>

              <button
                onClick={() => onChangeView('profit_loss')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  currentView === 'profit_loss'
                    ? 'bg-slate-800 text-white shadow-sm font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Profit & Loss</span>
              </button>

              <button
                onClick={() => onChangeView('followups')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  currentView === 'followups'
                    ? 'bg-slate-800 text-white shadow-sm font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Follow-ups & Leads</span>
                {inquiryCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                    {inquiryCount}
                  </span>
                )}
              </button>
            </div>

            {/* Contextual Selectors (shown when in Sheet view) */}
            {currentView === 'sheet' && (
              <div className="flex items-center flex-wrap gap-2">
                {/* Building Selector */}
                <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={selectedBuildingId}
                    onChange={(e) => onSelectBuilding(e.target.value)}
                    aria-label="Select Building"
                    className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
                  >
                    {buildings.map((bld) => (
                      <option key={bld.id} value={bld.id} className="bg-slate-900 text-white">
                        {bld.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Number Selector */}
                <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                  <DoorOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={selectedRoomId}
                    onChange={(e) => onSelectRoom(e.target.value)}
                    aria-label="Select Room Number"
                    className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
                  >
                    {currentRooms.length === 0 ? (
                      <option value="" className="bg-[#181824] text-slate-400">No rooms</option>
                    ) : (
                      currentRooms.map((room) => {
                        const rawNum = room.roomNumber;
                        const isNamed = /unit|hall/i.test(rawNum);
                        const cleanNum = rawNum.replace(/^(room|flat)\s*/i, '').replace(/\s*\(.*\)$/, '').trim();
                        const label = isNamed ? rawNum : `Flat ${cleanNum}`;
                        return (
                          <option key={room.id} value={room.id} className="bg-[#181824] text-white">
                            {label} ({room.roomType.split(' ')[0]})
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                {/* Month Selector */}
                {selectedMonth && onMonthChange && (
                  <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-[#38CE3C] shrink-0" />
                    <select
                      value={selectedMonth}
                      onChange={(e) => onMonthChange(e.target.value)}
                      aria-label="Select Stay Month"
                      className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1"
                    >
                      {availableMonths.map((m) => (
                        <option key={m} value={m} className="bg-[#181824] text-white">
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search, Action Buttons, User Profile & Notifications */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Search Input */}
            <div className="relative min-w-[150px] sm:min-w-[170px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search tenant, partition..."
                className="w-full bg-slate-900 text-xs text-white placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-md border border-slate-800 focus:outline-none focus:border-slate-600 transition"
              />
            </div>

            {/* Month Archives & Historical Review Button */}
            {onOpenMonthHistory && (
              <button
                onClick={onOpenMonthHistory}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-[#38CE3C] hover:text-white rounded-md text-xs font-medium border border-slate-800 transition cursor-pointer"
                title="Search & Review Any Month's Data (Collections, Occupancy, Utility Bills)"
              >
                <FolderArchive className="w-3.5 h-3.5 text-[#38CE3C]" />
                <span className="hidden sm:inline">Month Review</span>
              </button>
            )}

            {/* Pro-Rata Rent Calculator Quick Tool */}
            <button
              onClick={onOpenRentCalculator}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-medium border border-slate-800 transition cursor-pointer"
              title="Pro-Rata Rent Calculator for Mid-Month Arrivals"
            >
              <Calculator className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Calculator</span>
            </button>

            {/* Past Stays / Checkout Archive */}
            <button
              onClick={onOpenPastTenants}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-medium border border-slate-800 transition cursor-pointer"
              title="Past Tenants & Vacated History"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Past Stays</span>
              {pastTenantsCount > 0 && (
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded border border-slate-700 font-medium">
                  {pastTenantsCount}
                </span>
              )}
            </button>

            {/* Quick Add Expense Button */}
            {onOpenAddExpense && (
              <button
                onClick={onOpenAddExpense}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-medium border border-slate-800 transition cursor-pointer"
                title="Log Flat Expense (AC, maintenance, cleaning, supplies)"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Add Expense</span>
              </button>
            )}

            {/* Monthly Utility Bills (DEWA / SEWA / Wi-Fi) */}
            {onOpenMonthlyBills && (
              <button
                onClick={onOpenMonthlyBills}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 rounded-md text-xs font-medium border border-slate-800 transition cursor-pointer"
                title="Monthly Utility Bills (DEWA, SEWA & Wi-Fi) for all 7 rooms"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Monthly Bills</span>
              </button>
            )}

            {/* Excel Export (if in sheet) */}
            {currentView === 'sheet' && (
              <button
                onClick={onExportExcel}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-medium border border-slate-800 transition"
                title="Export Current Sheet to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            {/* Notifications Bell with Total Due Count */}
            <button
              onClick={onToggleNotifications}
              className={`relative p-2 rounded-md border transition ${
                isNotificationOpen 
                  ? 'bg-slate-800 text-white border-slate-700' 
                  : totalUrgentCount > 0
                    ? 'bg-slate-900 text-rose-300 border-rose-900/60'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
              title="Notifications: Tenant Rent + Owner Cheques + DEWA/Wi-Fi"
            >
              <Bell className="w-3.5 h-3.5" />
              {totalUrgentCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-semibold rounded-full border border-slate-950">
                  {totalUrgentCount}
                </span>
              )}
            </button>

            {/* Contextual Action Button */}
            {currentView === 'sheet' ? (
              <button
                onClick={onOpenAddTenant}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#38CE3C] hover:bg-[#30b533] text-[#181824] rounded-md text-xs font-bold shadow-sm transition cursor-pointer border border-[#38CE3C]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Tenant</span>
              </button>
            ) : (
              <button
                onClick={onOpenAddBuilding}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#38CE3C] hover:bg-[#30b533] text-[#181824] rounded-md text-xs font-bold shadow-sm transition cursor-pointer border border-[#38CE3C]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Building</span>
              </button>
            )}

            {/* User Profile & Logout */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-800 text-xs font-medium text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>abuthalif</span>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-md transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

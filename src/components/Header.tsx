import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
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
  buildings,
  rooms,
  selectedBuildingId,
  selectedRoomId,
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
  const currentRooms = rooms.filter(r => r.buildingId === selectedBuildingId);

  const totalUrgentCount = 
    tenantNotifications.filter(n => n.status === 'overdue' || n.status === 'due_today').length +
    chequeNotifications.length +
    utilityNotifications.filter(u => u.status === 'overdue' || u.status === 'due_today').length;

  // ── Smart Auto-Hiding Header on Mobile Scroll ────────────────────────────────
  const [isVisible, setIsVisible]   = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const isSearchFocusedRef           = useRef(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;

        if (currentScrollY <= 25) {
          setIsVisible(true);
          setIsScrolled(false);
          lastScrollY = currentScrollY;
          ticking = false;
          return;
        }

        setIsScrolled(true);

        if (isSearchFocusedRef.current || isNotificationOpen) {
          setIsVisible(true);
          lastScrollY = currentScrollY;
          ticking = false;
          return;
        }

        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (currentScrollY >= maxScroll - 10) {
          ticking = false;
          return;
        }

        const diff = currentScrollY - lastScrollY;

        if (Math.abs(diff) > 8) {
          if (diff > 0 && currentScrollY > 70) {
            setIsVisible(false);
          } else if (diff < 0) {
            setIsVisible(true);
          }
          lastScrollY = currentScrollY;
        }

        ticking = false;
      });

      ticking = true;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isNotificationOpen]);

  useEffect(() => {
    setIsVisible(true);
  }, [currentView, selectedBuildingId, selectedRoomId, selectedMonth]);

  return (
    <header
      className={`bg-[#181824] text-white sticky top-0 z-30 border-b border-[#262638] transition-transform duration-300 ease-in-out will-change-transform ${
        isScrolled ? 'shadow-lg' : 'shadow-sm'
      } ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="w-full px-3 sm:px-6 py-2 space-y-2">
        {/* Row 1: Brand + Navigation Tabs + Primary Add / Bell / Logout */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto max-w-full">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#38CE3C] flex items-center justify-center text-[#181824] font-bold shrink-0">
                <Building2 className="w-4 h-4 text-[#181824]" />
              </div>
              <span className="text-xs sm:text-sm font-extrabold tracking-tight text-white hidden sm:inline">
                Rooms CRM
              </span>
            </div>

            {/* Compact View Switcher Tabs */}
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 shrink-0">
              <button
                onClick={() => onChangeView('sheet')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  currentView === 'sheet'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tenants</span>
              </button>

              <button
                onClick={() => onChangeView('buildings')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  currentView === 'buildings'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
                <span>Rooms</span>
              </button>

              <button
                onClick={() => onChangeView('profit_loss')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  currentView === 'profit_loss'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>P&amp;L</span>
              </button>

              <button
                onClick={() => onChangeView('followups')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  currentView === 'followups'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Leads</span>
                {inquiryCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                    {inquiryCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {currentView === 'sheet' ? (
              <button
                onClick={onOpenAddTenant}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#38CE3C] hover:bg-[#30b533] text-[#181824] rounded-lg text-xs font-extrabold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Tenant</span>
              </button>
            ) : currentView === 'buildings' ? (
              <button
                onClick={onOpenAddBuilding}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#38CE3C] hover:bg-[#30b533] text-[#181824] rounded-lg text-xs font-extrabold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Building</span>
              </button>
            ) : null}

            <button
              onClick={onToggleNotifications}
              className={`relative p-1.5 rounded-lg border transition cursor-pointer ${
                isNotificationOpen 
                  ? 'bg-slate-800 text-white border-slate-700' 
                  : totalUrgentCount > 0
                    ? 'bg-slate-900 text-rose-300 border-rose-900/60'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {totalUrgentCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1 bg-rose-600 text-white text-[9px] font-bold rounded-full">
                  {totalUrgentCount}
                </span>
              )}
            </button>

            <button
              onClick={onLogout}
              title="Log Out"
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2 (Only in Sheet View): Building + Room + Month + Search + Quick Utilities */}
        {currentView === 'sheet' && (
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Building Selector */}
              <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedBuildingId}
                  onChange={(e) => onSelectBuilding(e.target.value)}
                  aria-label="Select Building"
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
                >
                  {buildings.map((bld) => (
                    <option key={bld.id} value={bld.id} className="bg-slate-900 text-white">
                      {bld.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Number Selector */}
              <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <DoorOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedRoomId}
                  onChange={(e) => onSelectRoom(e.target.value)}
                  aria-label="Select Room"
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
                >
                  {currentRooms.map((room) => {
                    const rawNum = room.roomNumber;
                    const isNamed = /unit|hall/i.test(rawNum);
                    const cleanNum = rawNum.replace(/^(room|flat)\s*/i, '').replace(/\s*\(.*\)$/, '').trim();
                    const label = isNamed ? rawNum : `Flat ${cleanNum}`;
                    return (
                      <option key={room.id} value={room.id} className="bg-[#181824] text-white">
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Month Selector */}
              {selectedMonth && onMonthChange && (
                <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-[#38CE3C] shrink-0" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => onMonthChange(e.target.value)}
                    aria-label="Select Month"
                    className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
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

            {/* Search & Secondary Tools */}
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial justify-end">
              <div className="relative flex-1 sm:w-44 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => {
                    isSearchFocusedRef.current = true;
                    setIsVisible(true);
                  }}
                  onBlur={() => {
                    isSearchFocusedRef.current = false;
                  }}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search tenant..."
                  className="w-full bg-slate-900 text-xs text-white placeholder-slate-500 pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-slate-600"
                />
              </div>

              <button
                onClick={onOpenPastTenants}
                className="flex items-center gap-1 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold border border-slate-800 cursor-pointer"
                title="Past Tenants"
              >
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Past</span>
                {pastTenantsCount > 0 && (
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded">
                    {pastTenantsCount}
                  </span>
                )}
              </button>

              {onOpenMonthlyBills && (
                <button
                  onClick={onOpenMonthlyBills}
                  className="flex items-center gap-1 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-xs font-semibold border border-slate-800 cursor-pointer"
                  title="Utility Bills"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Bills</span>
                </button>
              )}

              {onOpenAddExpense && (
                <button
                  onClick={onOpenAddExpense}
                  className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold border border-slate-800 cursor-pointer"
                  title="Add Expense"
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden lg:inline">Expense</span>
                </button>
              )}

              <button
                onClick={onOpenRentCalculator}
                className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold border border-slate-800 cursor-pointer"
                title="Pro-Rata Calculator"
              >
                <Calculator className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {onOpenMonthHistory && (
                <button
                  onClick={onOpenMonthHistory}
                  className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-[#38CE3C] rounded-lg text-xs font-semibold border border-slate-800 cursor-pointer"
                  title="Month Review"
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={onExportExcel}
                className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold border border-slate-800 cursor-pointer"
                title="Export Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

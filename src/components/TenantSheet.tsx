import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Edit3, 
  Check, 
  Plus, 
  LogOut, 
  Calendar, 
  FastForward, 
  ChevronLeft, 
  ChevronRight, 
  Hash,
  Banknote
} from 'lucide-react';
import { Tenant, Building, RoomUnit } from '../types/crm';
import { 
  calculateStayDuration, 
  calculateRentDueInfo, 
  generateWhatsAppLink,
  getTenantStatusForMonth,
  getPreviousMonth,
  getNextMonth,
  STANDARD_MONTHS
} from '../utils/dateUtils';
import { isTenantInPartition } from '../utils/tenantConversion';
import { compareSections, compareTenantsForSequence } from '../utils/tenantSequencer';

interface TenantSheetProps {
  building: Building;
  room?: RoomUnit;
  tenants: Tenant[];
  searchQuery: string;
  selectedMonth?: string;
  activeStayMonth?: string;
  availableMonths?: string[];
  selectedTenantId?: string | null;
  onSelectTenant?: (tenantId: string | null) => void;
  onMonthChange?: (month: string) => void;
  onOpenMonthHistory?: () => void;
  onCarryForwardMonth?: (fromMonth?: string, toMonth?: string) => void;
  onResequenceSnos?: () => void;
  onEditTenant: (tenant: Tenant) => void;
  onDeleteTenant: (tenantId: string) => void;
  onCheckOutTenant: (tenant: Tenant) => void;
  onToggleKey: (tenantId: string, keyType: 'cupboard' | 'door' | 'partition') => void;
  onStatusClick: (tenant: Tenant) => void;
  onAddTenantToSection?: (section: string) => void;
}

export const TenantSheet: React.FC<TenantSheetProps> = ({
  building,
  room,
  tenants,
  searchQuery,
  selectedMonth = 'Sep-2026',
  activeStayMonth = 'Sep-2026',
  availableMonths = STANDARD_MONTHS,
  selectedTenantId,
  onSelectTenant,
  onMonthChange,
  onCarryForwardMonth,
  onResequenceSnos,
  onEditTenant,
  onCheckOutTenant,
  onToggleKey,
  onStatusClick,
  onAddTenantToSection,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const [hoveredTenantId, setHoveredTenantId] = useState<string | null>(null);
  const activeSelectedId = selectedTenantId !== undefined ? selectedTenantId : internalSelectedId;

  const handleSelectTenant = (id: string | null) => {
    setInternalSelectedId(id);
    onSelectTenant?.(id);
  };

  const filteredTenants = tenants.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.place.toLowerCase().includes(q) ||
      t.partition.toLowerCase().includes(q) ||
      t.remarks.toLowerCase().includes(q) ||
      t.section.toLowerCase().includes(q) ||
      (t.phone && t.phone.toLowerCase().includes(q)) ||
      (t.bedType && t.bedType.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        const targetId = activeSelectedId || hoveredTenantId;
        const targetTenant = filteredTenants.find(t => t.id === targetId) || (filteredTenants.length > 0 ? filteredTenants[0] : null);
        if (targetTenant) {
          handleSelectTenant(targetTenant.id);
          onEditTenant(targetTenant);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSelectedId, hoveredTenantId, filteredTenants, onEditTenant]);

  const rawSections = Array.from(new Set(filteredTenants.map(t => (t.section || '').trim()).filter(Boolean))) as string[];
  const sections = (rawSections.length > 0 ? rawSections : ['MAIN']).sort(compareSections);

  const capacity = room?.capacity || 10;
  const activeCount = filteredTenants.filter(t => t.status === 'Active').length;
  const waitingCount = filteredTenants.filter(t => t.status === 'Waiting for new tenant').length;
  const vacancyCount = Math.max(0, capacity - activeCount - waitingCount);

  let roomCollected = 0;
  let roomTotal = 0;
  let roomPaidCount = 0;
  let roomDueCount = 0;

  filteredTenants.forEach(t => {
    if (t.status === 'Active') {
      const rent = Number(t.rentAmount) || 0;
      const st = getTenantStatusForMonth(t, selectedMonth);
      const paid = t.monthPaymentAmounts?.[selectedMonth] !== undefined
        ? Number(t.monthPaymentAmounts[selectedMonth]) || 0
        : (st === 'Paid' ? rent : 0);
      roomTotal += rent;
      roomCollected += paid;
      if (st === 'Paid' || (rent > 0 && paid >= rent)) {
        roomPaidCount++;
      } else {
        roomDueCount++;
      }
    }
  });
  const roomPending = Math.max(0, roomTotal - roomCollected);

  const rawRoomNum = room?.roomNumber || '';
  const isUnitOrNamed = /unit|hall/i.test(rawRoomNum);
  const cleanRoomNum = rawRoomNum.replace(/^(room|flat)\s*/i, '').replace(/\s*\(.*\)$/, '').trim();
  const formattedRoomLabel = isUnitOrNamed ? rawRoomNum.toUpperCase() : `FLAT ${cleanRoomNum}`;
  const sheetTitle = room ? `${building.name.toUpperCase()} • ${formattedRoomLabel}` : building.name.toUpperCase();

  const nextMonth = getNextMonth(selectedMonth, availableMonths);
  const prevMonth = getPreviousMonth(selectedMonth, availableMonths);

  const formatPartitionLabel = (p?: string) => {
    if (!p) return '-';
    const up = p.toUpperCase();
    if (up.startsWith('PARTITION') || up.startsWith('P') || up.startsWith('LOFT') || up.startsWith('BED')) {
      return up;
    }
    return `P${up}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      {/* ══ COMPACT TOP HEADER BAR ════════════════════════════════════════════════ */}
      <div className="bg-[#181824] py-3 px-4 sm:px-5 border-b border-[#262638] flex items-center justify-between flex-wrap gap-2 text-white">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#38CE3C] shrink-0"></span>
          <h2 className="text-xs sm:text-sm font-extrabold tracking-tight text-white uppercase">
            {sheetTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2 bg-[#222234] px-2.5 py-1 rounded-lg border border-[#2f2f45]">
            <span className="text-[#38CE3C] font-bold">✓ AED {roomCollected.toLocaleString()} ({roomPaidCount})</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400 font-bold">Due AED {roomPending.toLocaleString()} ({roomDueCount})</span>
          </div>

          <div className={`px-2.5 py-1 rounded-lg font-bold border ${
            vacancyCount > 0 
              ? 'bg-[#FFDE73]/15 text-[#FFDE73] border-[#FFDE73]/40' 
              : 'bg-[#38CE3C]/15 text-[#38CE3C] border-[#38CE3C]/40'
          }`}>
            {vacancyCount > 0 ? `${vacancyCount} Vacant` : 'Full'} ({activeCount}/{capacity})
          </div>
        </div>
      </div>

      {/* ══ COMPACT MONTH & ACTION BAR ════════════════════════════════════════════ */}
      <div className="bg-slate-50 px-3.5 sm:px-5 py-2 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {/* Month Stepper + Dropdown */}
          <div className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                if (prevMonth && onMonthChange) onMonthChange(prevMonth);
              }}
              disabled={!prevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-30 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 px-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange?.(e.target.value)}
                aria-label="Select month"
                className="bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}{m === activeStayMonth ? ' ★' : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                if (nextMonth && onMonthChange) onMonthChange(nextMonth);
              }}
              disabled={!nextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-30 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedMonth !== activeStayMonth && onMonthChange && (
            <button
              onClick={() => onMonthChange(activeStayMonth)}
              className="px-2.5 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-[11px] cursor-pointer"
            >
              Current ({activeStayMonth})
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onResequenceSnos && (
            <button
              onClick={onResequenceSnos}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer"
              title="Re-number tenants 1, 2, 3..."
            >
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">1,2,3</span>
            </button>
          )}

          {onCarryForwardMonth && (
            filteredTenants.length > 0 ? (
              <button
                onClick={() => onCarryForwardMonth(selectedMonth, nextMonth || undefined)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-2xs cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Carry Forward</span>
              </button>
            ) : prevMonth ? (
              <button
                onClick={() => onCarryForwardMonth(prevMonth, selectedMonth)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-2xs cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Copy from {prevMonth}</span>
              </button>
            ) : null
          )}
        </div>
      </div>

      {/* Empty Month State */}
      {filteredTenants.length === 0 && !searchQuery.trim() && (
        <div className="p-8 text-center bg-slate-50/80 border-b border-slate-200">
          <p className="text-sm font-bold text-slate-800 mb-2">No Tenants in {selectedMonth}</p>
          {prevMonth && onCarryForwardMonth && (
            <button
              onClick={() => onCarryForwardMonth(prevMonth, selectedMonth)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
            >
              <FastForward className="w-4 h-4" />
              <span>Copy Tenants from {prevMonth}</span>
            </button>
          )}
        </div>
      )}

      {/* ══ MOBILE VIEW: CORE ACTION CARDS (`md:hidden`) ══════════════════════════ */}
      <div className="md:hidden divide-y divide-slate-200">
        {sections.map((sectionName) => {
          const sectionTenants = filteredTenants
            .filter(t => (t.section || 'HALL') === sectionName)
            .sort(compareTenantsForSequence);

          return (
            <div key={sectionName} className="bg-slate-50/60">
              {/* Section Header Bar */}
              <div className="bg-slate-100 px-3.5 py-2 border-y border-slate-200 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  {sectionName} ({sectionTenants.length})
                </span>
                {onAddTenantToSection && (
                  <button
                    onClick={() => onAddTenantToSection(sectionName)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-[#38CE3C] stroke-[2.5]" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              {/* Mobile Tenant Cards */}
              <div className="p-2.5 space-y-2.5">
                {sectionTenants.map((t) => {
                  const monthStatus = getTenantStatusForMonth(t, selectedMonth);
                  const rent = Number(t.rentAmount) || 0;
                  const isPaid = monthStatus === 'Paid';
                  const isPartial = monthStatus === 'Partial';
                  const amountPaid = t.monthPaymentAmounts?.[selectedMonth] !== undefined
                    ? Math.max(0, Number(t.monthPaymentAmounts[selectedMonth]) || 0)
                    : (isPaid ? rent : 0);
                  const balance = Math.max(0, rent - amountPaid);
                  const dueInfo = calculateRentDueInfo(t.joiningDate, t.lastPaidDate, monthStatus);
                  const waUrl = generateWhatsAppLink(
                    t.phone,
                    t.name,
                    building.name,
                    t.partition,
                    t.rentAmount,
                    dueInfo.status === 'overdue' ? `${Math.abs(dueInfo.daysDiff)} days overdue` : `${selectedMonth} Rent`
                  );

                  return (
                    <div
                      key={t.id}
                      className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2.5"
                    >
                      {/* Row 1: #Sno + Name + Partition/Bed + 1-Tap Rent Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-extrabold text-[11px] border border-slate-200">
                              {t.sno}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-sm truncate">
                              {t.name}
                            </h4>
                          </div>

                          {/* Area/Partition + Bed Badge */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-900 text-white uppercase">
                              {formatPartitionLabel(t.partition)}
                            </span>
                            {t.bedType && (
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                t.bedType === 'Upper Bed'
                                  ? 'bg-[#FFF9E6] text-[#8C6B00] border-[#FFDE73]'
                                  : 'bg-[#F0F2FD] text-[#2F3E76] border-[#BAC3F1]'
                              }`}>
                                {t.bedType === 'Upper Bed' ? '⬆️ Upper' : t.bedType === 'Lower Bed' ? '⬇️ Lower' : t.bedType}
                              </span>
                            )}
                            {t.phone && (
                              <span className="text-[11px] font-mono font-semibold text-slate-600">
                                {t.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 1-Tap Payment Status Button */}
                        <button
                          type="button"
                          onClick={() => onStatusClick(t)}
                          className={`shrink-0 px-3 py-1.5 rounded-xl text-right border transition cursor-pointer ${
                            isPaid
                              ? 'bg-[#EAFBF0] text-[#1B8020] border-[#38CE3C]/60'
                              : isPartial
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-[#FFF0F3] text-[#D1183E] border-[#FF4D6B]/50'
                          }`}
                        >
                          <div className="text-xs font-extrabold font-mono">
                            AED {rent.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-extrabold uppercase">
                            {isPaid
                              ? '✓ Paid'
                              : isPartial
                                ? `Bal: ${balance}`
                                : 'Due • Pay'}
                          </div>
                        </button>
                      </div>

                      {/* Optional Remarks / Deposit compact line */}
                      {(Number(t.deposit) > 0 || t.remarks) && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                          <span>Dep: <strong className="text-slate-700">AED {Number(t.deposit) || 0}</strong></span>
                          {t.remarks && <span className="truncate max-w-[180px] italic">{t.remarks}</span>}
                        </div>
                      )}

                      {/* Row 2: 1-Tap Action Buttons */}
                      <div className="grid grid-cols-5 gap-1.5 pt-1.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => onStatusClick(t)}
                          className="col-span-2 flex items-center justify-center gap-1 py-2 px-2 bg-slate-900 active:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                        >
                          <Banknote className="w-3.5 h-3.5 text-[#38CE3C]" />
                          <span>Pay / Status</span>
                        </button>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center py-2 bg-emerald-50 active:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs border border-emerald-200"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>

                        <a
                          href={`tel:${(t.phone || '').replace(/\s+/g, '')}`}
                          className="flex items-center justify-center py-2 bg-slate-100 active:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200"
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </a>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditTenant(t)}
                            className="flex-1 flex items-center justify-center py-2 bg-slate-100 active:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
                            title="Edit Tenant / Change Room"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onCheckOutTenant(t)}
                            className="flex-1 flex items-center justify-center py-2 bg-rose-50 active:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 cursor-pointer"
                            title="Check Out"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ DESKTOP VIEW: CLEAN SPREADSHEET TABLE (`hidden md:block`) ═════════════ */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse select-none">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs">
              <th className="py-2.5 px-1 border-r border-slate-200/60 text-center w-8 font-medium">#</th>
              <th className="py-2.5 px-2.5 border-r border-slate-200/60 min-w-[120px] font-semibold">Tenant</th>
              <th className="py-2.5 px-1.5 border-r border-slate-200/60 min-w-[65px] font-medium">Place</th>
              <th className="py-2.5 px-1.5 border-r border-slate-200/60 text-center min-w-[65px] font-medium">Deposit</th>
              <th className="py-2.5 px-1.5 border-r border-slate-200/60 text-center min-w-[78px] font-medium">Joining</th>
              <th className="py-2.5 px-1.5 border-r border-slate-200/60 text-center min-w-[65px] font-medium">Duration</th>
              <th className="py-2.5 px-1.5 border-r border-slate-200/60 text-center min-w-[85px] font-semibold">{selectedMonth} Rent</th>
              <th className="py-2.5 px-0.5 border-r border-slate-200/60 text-center w-8 font-medium" title="Cupboard Key">Cu/k</th>
              <th className="py-2.5 px-0.5 border-r border-slate-200/60 text-center w-8 font-medium" title="Door Key">D/k</th>
              <th className="py-2.5 px-0.5 border-r border-slate-200/60 text-center w-8 font-medium" title="Partition Key">P/k</th>
              <th className="py-2.5 px-1.5 border-r border-slate-200/60 min-w-[95px] text-center font-semibold">Partition &amp; Bed</th>
              <th className="py-2.5 px-2 border-r border-slate-200/60 min-w-[90px] font-medium">Remarks</th>
              <th className="py-2.5 px-1 text-center min-w-[105px] font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/70">
            {sections.map((sectionName) => {
              const sectionTenants = filteredTenants
                .filter(t => (t.section || 'HALL') === sectionName)
                .sort(compareTenantsForSequence);

              const secActive = sectionTenants.filter(t => t.status === 'Active');
              const secTotal = secActive.reduce((s, t) => s + (Number(t.rentAmount) || 0), 0);
              const secCollected = secActive.reduce((s, t) => {
                const status = getTenantStatusForMonth(t, selectedMonth);
                const rent = Number(t.rentAmount) || 0;
                const paid = t.monthPaymentAmounts?.[selectedMonth] !== undefined
                  ? Number(t.monthPaymentAmounts[selectedMonth]) || 0
                  : (status === 'Paid' ? rent : 0);
                return s + paid;
              }, 0);
              const secPending = Math.max(0, secTotal - secCollected);

              return (
                <React.Fragment key={sectionName}>
                  <tr className="bg-slate-100/90 border-y border-slate-200">
                    <td colSpan={13} className="py-2 px-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                          {sectionName}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-medium text-slate-500">
                            {secActive.length} active • <span className="text-emerald-700 font-bold">AED {secCollected.toLocaleString()} Paid</span> • <span className="text-rose-600 font-bold">AED {secPending.toLocaleString()} Due</span>
                          </span>
                          {onAddTenantToSection && (
                            <button
                              onClick={() => onAddTenantToSection(sectionName)}
                              className="text-[11px] font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 bg-white hover:bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shadow-xs transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {sectionTenants.map((t, idx) => {
                    const monthStatus = getTenantStatusForMonth(t, selectedMonth);
                    const dueInfo = calculateRentDueInfo(t.joiningDate, t.lastPaidDate, monthStatus);
                    const isEven = idx % 2 === 0;
                    const waUrl = generateWhatsAppLink(
                      t.phone,
                      t.name,
                      building.name,
                      t.partition,
                      t.rentAmount,
                      dueInfo.status === 'overdue' ? `${Math.abs(dueInfo.daysDiff)} days overdue` : `${selectedMonth} Rent`
                    );

                    const isSelected = activeSelectedId === t.id;

                    return (
                      <tr 
                        key={t.id}
                        onClick={() => handleSelectTenant(t.id)}
                        onDoubleClick={() => onEditTenant(t)}
                        onMouseEnter={() => setHoveredTenantId(t.id)}
                        className={`transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-emerald-50/80 border-l-4 border-l-[#38CE3C]' 
                            : isEven 
                              ? 'bg-white hover:bg-slate-50' 
                              : 'bg-slate-50/40 hover:bg-slate-100/60'
                        }`}
                      >
                        <td className="py-2 px-1 text-center border-r border-slate-200/60 font-medium text-slate-500 text-xs">
                          {t.sno}
                        </td>

                        {/* Clean Tenant Name + Phone */}
                        <td className="py-2 px-2.5 border-r border-slate-200/60 font-semibold text-slate-900">
                          <div className="flex items-center justify-between gap-1">
                            <span>{t.name}</span>
                            {t.phone && (
                              <span className="text-[10px] font-mono text-slate-400 font-normal">
                                {t.phone}
                              </span>
                            )}
                          </div>
                          {t.status === 'Waiting for new tenant' && (
                            <span className="inline-block text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-900 border border-amber-300 mt-0.5">
                              ⏳ Waiting
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-1.5 border-r border-slate-200/60 font-medium text-slate-700 text-xs">
                          {t.place || '-'}
                        </td>

                        <td className="py-2 px-1.5 text-center border-r border-slate-200/60 text-xs font-semibold text-slate-800">
                          {Number(t.deposit) > 0 ? `AED ${Number(t.deposit).toLocaleString()}` : <span className="text-slate-400 font-normal">AED 0</span>}
                        </td>

                        <td className="py-2 px-1.5 text-center border-r border-slate-200/60 font-medium text-slate-600 text-xs font-mono whitespace-nowrap">
                          {t.joiningDate || '-'}
                        </td>

                        <td className="py-2 px-1.5 text-center border-r border-slate-200/60 font-medium text-slate-600 text-xs whitespace-nowrap">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                            {t.status === 'Waiting for new tenant' ? `Starts ${t.joiningDate}` : calculateStayDuration(t.joiningDate, t.leavingDate)}
                          </span>
                        </td>

                        {/* 1-Tap Rent / Monthly Status */}
                        <td 
                          onClick={() => onStatusClick(t)}
                          className="py-2 px-1.5 text-center border-r border-slate-200/60 cursor-pointer transition hover:bg-slate-100/80"
                        >
                          {(() => {
                            const rent = Number(t.rentAmount) || 0;
                            const isPaid = monthStatus === 'Paid';
                            const isPartial = monthStatus === 'Partial';
                            const amountPaid = t.monthPaymentAmounts?.[selectedMonth] !== undefined
                              ? Math.max(0, Number(t.monthPaymentAmounts[selectedMonth]) || 0)
                              : (isPaid ? rent : 0);
                            const balance = Math.max(0, rent - amountPaid);

                            if (isPaid) {
                              return (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs font-bold text-slate-900">AED {rent.toLocaleString()}</span>
                                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border mt-0.5 bg-[#EAFBF0] text-[#1B8020] border-[#38CE3C]/60 flex items-center gap-1">
                                    <Check className="w-3 h-3 stroke-[3]" /> Paid
                                  </span>
                                </div>
                              );
                            }

                            if (isPartial) {
                              return (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="text-xs font-bold text-amber-900">AED {amountPaid.toLocaleString()} / {rent.toLocaleString()}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-amber-50 text-amber-800 border-amber-300">
                                    Bal: AED {balance.toLocaleString()}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-slate-900">AED {rent.toLocaleString()}</span>
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border mt-0.5 bg-[#FFF0F3] text-[#D1183E] border-[#FF4D6B]/40">
                                  Due
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Keys */}
                        <td onClick={() => onToggleKey(t.id, 'cupboard')} className="py-2 px-0.5 text-center border-r border-slate-200/60 cursor-pointer hover:bg-slate-100">
                          <button className={`w-4 h-4 mx-auto rounded flex items-center justify-center border transition ${t.cupboardKey ? 'bg-[#181824] text-[#38CE3C] border-[#181824]' : 'bg-white text-transparent border-slate-300'}`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>
                        </td>

                        <td onClick={() => onToggleKey(t.id, 'door')} className="py-2 px-0.5 text-center border-r border-slate-200/60 cursor-pointer hover:bg-slate-100">
                          <button className={`w-4 h-4 mx-auto rounded flex items-center justify-center border transition ${t.doorKey ? 'bg-[#181824] text-[#38CE3C] border-[#181824]' : 'bg-white text-transparent border-slate-300'}`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>
                        </td>

                        {(() => {
                          const inPartition = isTenantInPartition(t, room?.roomType);
                          return (
                            <td onClick={() => inPartition && onToggleKey(t.id, 'partition')} className={`py-2 px-0.5 text-center border-r border-slate-200/60 ${inPartition ? 'cursor-pointer hover:bg-slate-100' : 'bg-slate-50/40'}`}>
                              {inPartition ? (
                                <button className={`w-4 h-4 mx-auto rounded flex items-center justify-center border transition ${t.partitionKey ? 'bg-[#181824] text-[#38CE3C] border-[#181824]' : 'bg-white text-transparent border-slate-300'}`}>
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </button>
                              ) : (
                                <span className="text-slate-300 font-mono text-xs">-</span>
                              )}
                            </td>
                          );
                        })()}

                        {/* Partition & Bed */}
                        <td className="py-2 px-1.5 text-center border-r border-slate-200/60">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="inline-block font-extrabold text-slate-900 text-xs uppercase px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300">
                              {formatPartitionLabel(t.partition)}
                            </span>
                            {t.bedType && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap border ${
                                t.bedType === 'Upper Bed'
                                  ? 'bg-[#FFF9E6] text-[#8C6B00] border-[#FFDE73]'
                                  : 'bg-[#F0F2FD] text-[#2F3E76] border-[#BAC3F1]'
                              }`}>
                                {t.bedType === 'Upper Bed' ? '⬆️ Upper' : t.bedType === 'Lower Bed' ? '⬇️ Lower' : t.bedType}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2 px-2 border-r border-slate-200/60 text-xs text-slate-600 break-words max-w-[160px]">
                          {t.remarks || '-'}
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-1.5 text-center">
                          <div className="flex items-center justify-center gap-1 shrink-0">
                            <a
                              href={`tel:${(t.phone || '').replace(/\s+/g, '')}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-md bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition shadow-2xs"
                              title="Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={waUrl}
                              onClick={(e) => e.stopPropagation()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md bg-white text-slate-600 hover:text-emerald-700 hover:bg-slate-100 border border-slate-200 transition shadow-2xs"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCheckOutTenant(t);
                              }}
                              className="p-1.5 rounded-md bg-white text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition shadow-2xs cursor-pointer"
                              title="Check Out"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTenant(t.id);
                                onEditTenant(t);
                              }}
                              className="p-1.5 rounded-md bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition shadow-2xs cursor-pointer"
                              title="Edit Tenant / Room"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  Phone, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Key, 
  Check, 
  AlertCircle, 
  Clock,
  ExternalLink,
  Plus,
  LogOut,
  Bed,
  Calendar,
  FastForward,
  ChevronLeft,
  ChevronRight,
  Search,
  FolderArchive
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

interface TenantSheetProps {
  building: Building;
  room?: RoomUnit;
  tenants: Tenant[];
  searchQuery: string;
  selectedMonth?: string;
  activeStayMonth?: string;
  availableMonths?: string[];
  onMonthChange?: (month: string) => void;
  onOpenMonthHistory?: () => void;
  onCarryForwardMonth?: () => void;
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
  onMonthChange,
  onOpenMonthHistory,
  onCarryForwardMonth,
  onEditTenant,
  onDeleteTenant,
  onCheckOutTenant,
  onToggleKey,
  onStatusClick,
  onAddTenantToSection,
}) => {
  const filteredTenants = tenants.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.place.toLowerCase().includes(q) ||
      t.partition.toLowerCase().includes(q) ||
      t.remarks.toLowerCase().includes(q) ||
      t.section.toLowerCase().includes(q) ||
      (t.bedType && t.bedType.toLowerCase().includes(q)) ||
      (t.spaceType && t.spaceType.toLowerCase().includes(q))
    );
  });

  // Only display sections that actually contain tenants in this filtered list (or fallback to ['MAIN'] if empty)
  const rawSections = Array.from(new Set(filteredTenants.map(t => (t.section || '').trim()).filter(Boolean))) as string[];
  const sections = rawSections.length > 0 ? rawSections : ['MAIN'];

  const capacity = room?.capacity || 10;
  const activeCount = filteredTenants.filter(t => t.status === 'Active').length;
  const vacancyCount = Math.max(0, capacity - activeCount);

  const rawRoomNum = room?.roomNumber || '';
  const isUnitOrNamed = /unit|hall/i.test(rawRoomNum);
  const cleanRoomNum = rawRoomNum.replace(/^(room|flat)\s*/i, '').replace(/\s*\(.*\)$/, '').trim();
  const formattedRoomLabel = isUnitOrNamed 
    ? rawRoomNum.toUpperCase() 
    : `FLAT ${cleanRoomNum}`;
  const roomTypeLabel = room?.roomType
    ? room.roomType.toUpperCase().replace(/\s*FLAT$/i, '')
    : 'PARTITION';
  const sheetTitle = room 
    ? `${building.name.toUpperCase()} - ${formattedRoomLabel} - ${roomTypeLabel}` 
    : `${building.name.toUpperCase()} - PARTITION`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      {/* Title Header: Executive Stellar Dark Banner + Capacity & Vacancy Badge */}
      <div className="bg-[#181824] py-3.5 px-4 sm:px-6 border-b border-[#262638] flex items-center justify-between flex-wrap gap-2 text-white">
        <div>
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-white uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38CE3C]"></span>
            {sheetTitle}
          </h2>
          <p className="text-[11px] text-slate-400 font-normal">Live Tenant Registry & Bedspace/Partition Allocation</p>
        </div>

        {/* Capacity & Vacancy Indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-[#222234] text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#2f2f45]">
            <span className="text-slate-400 font-normal">Capacity:</span>
            <span className="font-semibold text-white">{capacity} Beds</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">{activeCount} Occupied</span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            vacancyCount > 0 
              ? 'bg-[#FFDE73]/15 text-[#FFDE73] border-[#FFDE73]/40' 
              : 'bg-[#38CE3C]/15 text-[#38CE3C] border-[#38CE3C]/40'
          }`}>
            {vacancyCount > 0 ? `⚠️ ${vacancyCount} Vacant Bed${vacancyCount > 1 ? 's' : ''}` : '✓ Fully Occupied'}
          </div>
        </div>
      </div>

      {/* Historical Mode Alert Banner if viewing past or future reference month */}
      {selectedMonth !== activeStayMonth && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px] uppercase tracking-wider">
              Reference Mode
            </span>
            <span className="font-semibold text-amber-900">
              You are currently viewing archived reference data for <strong>{selectedMonth}</strong>.
            </span>
          </div>
          {onMonthChange && (
            <button
              onClick={() => onMonthChange(activeStayMonth)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs"
            >
              Back to Active Month ({activeStayMonth}) ➔
            </button>
          )}
        </div>
      )}

      {/* Month Navigation & Carry Forward Action Bar */}
      <div className="bg-slate-50 px-4 sm:px-6 py-2.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Viewing Month:</span>
          
          {/* Interactive Month Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange?.(e.target.value)}
              aria-label="Select month to view"
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m} {m === activeStayMonth ? '★ (Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Stepper Buttons: Previous & Next */}
          <div className="flex items-center gap-0.5 bg-white border border-slate-300 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => {
                const prev = getPreviousMonth(selectedMonth, availableMonths);
                if (prev && onMonthChange) onMonthChange(prev);
              }}
              disabled={!getPreviousMonth(selectedMonth, availableMonths)}
              title="Previous Month"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                const next = getNextMonth(selectedMonth, availableMonths);
                if (next && onMonthChange) onMonthChange(next);
              }}
              disabled={!getNextMonth(selectedMonth, availableMonths)}
              title="Next Month"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search & Review Archive Button */}
          {onOpenMonthHistory && (
            <button
              type="button"
              onClick={onOpenMonthHistory}
              title="Search and review any historical month's collections, vacancy, and utility bills"
              className="flex items-center gap-1.5 px-3 py-1 bg-[#181824] hover:bg-slate-800 text-[#38CE3C] hover:text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer border border-[#262638]"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search & Review Months</span>
            </button>
          )}

          <span className="text-[11px] text-slate-400 hidden lg:inline">
            • Displaying tenant occupancy & collections for {selectedMonth}
          </span>
        </div>

        {onCarryForwardMonth && (
          <div className="flex items-center gap-2">
            <button
              onClick={onCarryForwardMonth}
              title="Carry forward all active tenants and their room/bed allocations to next month"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer border border-indigo-500"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Carry Forward to Next Month</span>
            </button>
          </div>
        )}
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse select-none">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs">
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-center w-12 font-medium">#</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 min-w-[170px] font-semibold">Tenant</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 min-w-[110px] font-medium">Place</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-center min-w-[100px] font-medium">Deposit</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-center min-w-[110px] font-medium">Joining Date</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-center min-w-[110px] font-medium">Duration</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-center min-w-[120px] font-semibold">{selectedMonth} Rent</th>
              <th className="py-2.5 px-2 border-r border-slate-200/60 text-center w-14 font-medium" title="Cupboard Key">Cu/k</th>
              <th className="py-2.5 px-2 border-r border-slate-200/60 text-center w-14 font-medium" title="Door Key">D/k</th>
              <th className="py-2.5 px-2 border-r border-slate-200/60 text-center w-14 font-medium" title="Partition Key (only for Partition tenants)">P/k</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 min-w-[120px] font-medium">Partition</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 min-w-[140px] font-medium">Remarks</th>
              <th className="py-2.5 px-3 text-center min-w-[140px] font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/70">
            {sections.map((sectionName) => {
              const sectionTenants = filteredTenants.filter(t => (t.section || 'HALL') === sectionName);

              return (
                <React.Fragment key={sectionName}>
                  {/* Subtle Section Divider */}
                  <tr className="bg-slate-100/90 border-y border-slate-200">
                    <td colSpan={13} className="py-2 px-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                          {sectionName}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-medium text-slate-500">
                            {sectionTenants.length} tenants • AED {sectionTenants.filter(t => getTenantStatusForMonth(t, selectedMonth) === 'Paid').reduce((s, t) => s + (t.rentAmount || 0), 0).toLocaleString()} Paid / AED {sectionTenants.reduce((s, t) => s + (t.rentAmount || 0), 0).toLocaleString()} Total
                          </span>
                          {onAddTenantToSection && (
                            <button
                              onClick={() => onAddTenantToSection(sectionName)}
                              className="text-[11px] font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 bg-white hover:bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shadow-xs transition"
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {sectionTenants.length === 0 ? (
                    <tr className="bg-white">
                      <td colSpan={13} className="py-4 px-4 text-center text-xs text-slate-400 italic">
                        No tenants currently listed in {sectionName}
                      </td>
                    </tr>
                  ) : (
                    sectionTenants.map((t, idx) => {
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

                      return (
                        <tr 
                          key={t.id}
                          className={`transition-colors hover:bg-slate-50 ${
                            isEven ? 'bg-white' : 'bg-slate-50/40'
                          }`}
                        >
                          {/* Sno */}
                          <td className="py-2.5 px-3 text-center border-r border-slate-200/60 font-medium text-slate-500 text-xs">
                            {t.sno}
                          </td>

                          {/* Tenant Name & Bed/Space Badges */}
                          <td className="py-2.5 px-3 border-r border-slate-200/60 font-semibold text-slate-900">
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span>{t.name}</span>
                                {t.phone && (
                                  <span className="text-[10px] font-mono text-slate-400 font-normal hidden xl:inline">
                                    {t.phone}
                                  </span>
                                )}
                              </div>
                              {/* Space & Bed Type Tag with Tasteful Colors */}
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                {t.bedType === 'Upper Bed' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#FFF9E6] text-[#8C6B00] border border-[#FFDE73]">
                                    Upper Bed
                                  </span>
                                )}
                                {t.bedType === 'Lower Bed' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                    Lower Bed
                                  </span>
                                )}
                                {t.bedType && t.bedType !== 'Upper Bed' && t.bedType !== 'Lower Bed' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                    {t.bedType}
                                  </span>
                                )}
                                {t.spaceType && t.spaceType !== 'Partition' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-[#8E32E9]/10 text-[#7116CE] border border-[#8E32E9]/30">
                                    {t.spaceType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Place / Origin */}
                          <td className="py-2.5 px-3 border-r border-slate-200/60 font-medium text-slate-700 text-xs">
                            {t.place || '-'}
                          </td>

                          {/* Deposit */}
                          <td className="py-2.5 px-3 text-center border-r border-slate-200/60 text-xs">
                            {t.depositNote ? (
                              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#FFF0F3] text-[#D1183E] border border-[#FF4D6B]/40">
                                {t.depositNote}
                              </span>
                            ) : t.deposit > 0 ? (
                              <span className="text-slate-900 font-semibold">AED {t.deposit}</span>
                            ) : (
                              <span className="text-slate-400 font-normal italic">-</span>
                            )}
                          </td>

                          {/* Joining Date */}
                          <td className="py-2.5 px-3 text-center border-r border-slate-200/60 font-medium text-slate-600 text-xs font-mono">
                            {t.joiningDate || '-'}
                          </td>

                          {/* Stay Duration */}
                          <td className="py-2.5 px-3 text-center border-r border-slate-200/60 font-medium text-slate-600 text-xs">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                              {calculateStayDuration(t.joiningDate, t.leavingDate)}
                            </span>
                          </td>

                          {/* Rent / Monthly Status */}
                          <td 
                            onClick={() => onStatusClick(t)}
                            title={`Click to update payment status for ${selectedMonth}`}
                            className="py-2 px-2 text-center border-r border-slate-200/60 cursor-pointer transition hover:bg-slate-100/80"
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-bold text-slate-900">
                                AED {t.rentAmount || '0'}
                              </span>
                              <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border mt-0.5 ${
                                monthStatus === 'Paid' 
                                  ? 'bg-[#EAFBF0] text-[#1B8020] border-[#38CE3C]/60' 
                                  : dueInfo.status === 'overdue'
                                    ? 'bg-[#FFF0F3] text-[#D1183E] border-[#FF4D6B]/40'
                                    : 'bg-[#FFF9E6] text-[#8C6B00] border border-[#FFDE73]/60'
                              }`}>
                                {monthStatus || 'Due'}
                              </span>
                            </div>
                          </td>

                          {/* Cupboard Key (Cu/k) */}
                          <td 
                            onClick={() => onToggleKey(t.id, 'cupboard')}
                            title="Click to toggle Cupboard Key status"
                            className="py-2.5 px-1 text-center border-r border-slate-200/60 cursor-pointer hover:bg-slate-100"
                          >
                            <button className={`w-4 h-4 mx-auto rounded flex items-center justify-center border transition ${
                              t.cupboardKey 
                                ? 'bg-[#181824] text-[#38CE3C] border-[#181824]' 
                                : 'bg-white text-transparent border-slate-300 hover:border-slate-400'
                            }`}>
                              <Check className="w-3 h-3 stroke-[3]" />
                            </button>
                          </td>

                          {/* Door Key (D/k) */}
                          <td 
                            onClick={() => onToggleKey(t.id, 'door')}
                            title="Click to toggle Door Key status"
                            className="py-2.5 px-1 text-center border-r border-slate-200/60 cursor-pointer hover:bg-slate-100"
                          >
                            <button className={`w-4 h-4 mx-auto rounded flex items-center justify-center border transition ${
                              t.doorKey 
                                ? 'bg-[#181824] text-[#38CE3C] border-[#181824]' 
                                : 'bg-white text-transparent border-slate-300 hover:border-slate-400'
                            }`}>
                              <Check className="w-3 h-3 stroke-[3]" />
                            </button>
                          </td>

                          {/* Partition Key (P/k) - ONLY FOR CUSTOMERS IN PARTITION */}
                          {(() => {
                            const inPartition = isTenantInPartition(t, room?.roomType);
                            return (
                              <td 
                                onClick={() => inPartition && onToggleKey(t.id, 'partition')}
                                title={inPartition ? "Click to toggle Partition Key status" : "Not applicable for Bed Space"}
                                className={`py-2.5 px-1 text-center border-r border-slate-200/60 ${
                                  inPartition ? 'cursor-pointer hover:bg-slate-100' : 'bg-slate-50/40 select-none'
                                }`}
                              >
                                {inPartition ? (
                                  <button className={`w-4 h-4 mx-auto rounded flex items-center justify-center border transition ${
                                    t.partitionKey 
                                      ? 'bg-[#181824] text-[#38CE3C] border-[#181824]' 
                                      : 'bg-white text-transparent border-slate-300 hover:border-slate-400'
                                  }`}>
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </button>
                                ) : (
                                  <span className="text-slate-300 font-mono text-xs select-none" title="Partition Key only applies to Partition tenants">-</span>
                                )}
                              </td>
                            );
                          })()}

                          {/* Partition */}
                          <td className="py-2.5 px-2 text-center border-r border-slate-200/60">
                            <span className="inline-block font-bold text-slate-900 text-xs uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {t.partition || '-'}
                            </span>
                          </td>

                          {/* Remarks */}
                          <td className="py-2.5 px-3 border-r border-slate-200/60 text-xs text-slate-600 font-normal">
                            {t.remarks || '-'}
                          </td>

                          {/* Actions: Call, WhatsApp, Tenant Out (Check-Out), Edit */}
                          <td className="py-2.5 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Direct Phone Call */}
                              <a
                                href={`tel:${t.phone.replace(/\s+/g, '')}`}
                                title={`Call ${t.name}`}
                                className="p-1.5 rounded-md bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition shadow-sm"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>

                              {/* WhatsApp Reminder */}
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Send WhatsApp message to ${t.name}`}
                                className="p-1.5 rounded-md bg-white text-slate-600 hover:text-emerald-700 hover:bg-slate-100 border border-slate-200 transition shadow-sm"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>

                              {/* TENANT OUT (CHECK-OUT & GIVE BACK REFUND) */}
                              <button
                                onClick={() => onCheckOutTenant(t)}
                                title="Tenant Out: Check-out, return keys & give back deposit refund"
                                className="p-1.5 rounded-md bg-white text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition shadow-sm"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Modal */}
                              <button
                                onClick={() => onEditTenant(t)}
                                title="Edit Tenant Details"
                                className="p-1.5 rounded-md bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition shadow-sm"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Bottom Legend */}
      <div className="bg-slate-50 p-3.5 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
            Paid
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 bg-slate-400 rounded-full"></span>
            Due / Pending
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 bg-slate-900 rounded-sm"></span>
            Key Handed Over (Cu/k: Cupboard, D/k: Door, P/k: Partition)
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            Tenant Out (Check-out & Refund)
          </span>
        </div>

        <div className="text-[11px] text-slate-400 font-normal">
          Click <strong>Tenant Out</strong> to process checkout, verify keys, and settle deposit give-back.
        </div>
      </div>
    </div>
  );
};

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
  Bed
} from 'lucide-react';
import { Tenant, Building, RoomUnit } from '../types/crm';
import { calculateStayDuration, calculateRentDueInfo, generateWhatsAppLink } from '../utils/dateUtils';

interface TenantSheetProps {
  building: Building;
  room?: RoomUnit;
  tenants: Tenant[];
  searchQuery: string;
  onEditTenant: (tenant: Tenant) => void;
  onDeleteTenant: (tenantId: string) => void;
  onCheckOutTenant: (tenant: Tenant) => void;
  onToggleKey: (tenantId: string, keyType: 'cupboard' | 'door') => void;
  onStatusClick: (tenant: Tenant) => void;
  onAddTenantToSection?: (section: string) => void;
}

export const TenantSheet: React.FC<TenantSheetProps> = ({
  building,
  room,
  tenants,
  searchQuery,
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

  const sections = Array.from(new Set(tenants.map(t => t.section || 'HALL')));
  if (!sections.includes('HALL')) sections.unshift('HALL');
  if (!sections.includes('ROOM')) sections.push('ROOM');

  const capacity = room?.capacity || 10;
  const activeCount = filteredTenants.filter(t => t.status === 'Active').length;
  const vacancyCount = Math.max(0, capacity - activeCount);

  const sheetTitle = room 
    ? `${building.name.toUpperCase()} - ROOM ${room.roomNumber} - PARTITION` 
    : `${building.name.toUpperCase()} - PARTITION`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      {/* Title Header: Executive Slate Banner + Capacity & Vacancy Badge */}
      <div className="bg-slate-900 py-3.5 px-4 sm:px-6 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-white">
        <div>
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-white uppercase">
            {sheetTitle}
          </h2>
          <p className="text-[11px] text-slate-400 font-normal">Live Tenant Registry & Partition Management</p>
        </div>

        {/* Capacity & Vacancy Indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700">
            <span className="text-slate-400 font-normal">Capacity:</span>
            <span className="font-semibold text-white">{capacity} Beds</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">{activeCount} Occupied</span>
          </div>

          <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            vacancyCount > 0 
              ? 'bg-slate-800 text-slate-300 border-slate-700' 
              : 'bg-slate-800 text-emerald-400 border-slate-700'
          }`}>
            {vacancyCount > 0 ? `${vacancyCount} Vacant Bed${vacancyCount > 1 ? 's' : ''}` : 'Fully Occupied'}
          </div>
        </div>
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
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-center min-w-[100px] font-semibold">
                Rent / Status
              </th>
              <th className="py-2.5 px-2 border-r border-slate-200/60 text-center w-14 font-medium" title="Cupboard Key">
                Cu/k
              </th>
              <th className="py-2.5 px-2 border-r border-slate-200/60 text-center w-14 font-medium" title="Door Key">
                D/k
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 min-w-[160px] font-medium">Remarks</th>
              <th className="py-2.5 px-2.5 border-r border-slate-200/60 text-center min-w-[80px] font-semibold">Partition</th>
              <th className="py-2.5 px-3 text-center min-w-[170px] font-medium">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/70">
            {sections.map((sectionName) => {
              const sectionTenants = filteredTenants.filter(t => (t.section || 'HALL') === sectionName);

              return (
                <React.Fragment key={sectionName}>
                  {/* Clean Section Divider (HALL / ROOM) */}
                  <tr className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-xs border-y border-slate-200">
                    <td colSpan={12} className="py-2 px-4 text-center">
                      <div className="flex items-center justify-between">
                        <span className="w-1/4"></span>
                        <span className="text-slate-800 font-bold text-center tracking-wide">{sectionName}</span>
                        <div className="w-1/4 text-right">
                          {onAddTenantToSection && (
                            <button
                              onClick={() => onAddTenantToSection(sectionName)}
                              className="text-[11px] text-slate-700 hover:text-slate-900 font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition"
                            >
                              + Add to {sectionName}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {sectionTenants.length === 0 ? (
                    <tr className="bg-white">
                      <td colSpan={12} className="py-4 px-4 text-center text-xs text-slate-400 italic">
                        No tenants currently listed in {sectionName}
                      </td>
                    </tr>
                  ) : (
                    sectionTenants.map((t, idx) => {
                      const dueInfo = calculateRentDueInfo(t.joiningDate, t.lastPaidDate, t.currentMonthStatus);
                      const isEven = idx % 2 === 0;
                      const waUrl = generateWhatsAppLink(
                        t.phone,
                        t.name,
                        building.name,
                        t.partition,
                        t.rentAmount,
                        dueInfo.status === 'overdue' ? `${Math.abs(dueInfo.daysDiff)} days overdue` : 'Rent Cycle'
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
                              {/* Space & Bed Type Tag */}
                              <div className="flex items-center gap-1 mt-0.5">
                                {t.bedType && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    {t.bedType}
                                  </span>
                                )}
                                {t.spaceType && t.spaceType !== 'Partition' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200">
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
                          <td className={`py-2.5 px-3 text-center border-r border-slate-200/60 text-xs ${
                            t.depositNote === 'No Advance' || t.deposit === 0 
                              ? 'text-slate-400 font-normal italic' 
                              : 'text-slate-900 font-semibold'
                          }`}>
                            {t.depositNote ? t.depositNote : t.deposit > 0 ? `AED ${t.deposit}` : '-'}
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
                            title="Click to update payment status"
                            className="py-2 px-2 text-center border-r border-slate-200/60 cursor-pointer transition hover:bg-slate-100/80"
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-bold text-slate-900">
                                AED {t.rentAmount || '0'}
                              </span>
                              <span className={`text-[10px] px-2 py-0.2 rounded-full font-medium border mt-0.5 ${
                                t.currentMonthStatus === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : dueInfo.status === 'overdue'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {t.currentMonthStatus || 'Due'}
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
                                ? 'bg-slate-900 text-white border-slate-900' 
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
                                ? 'bg-slate-900 text-white border-slate-900' 
                                : 'bg-white text-transparent border-slate-300 hover:border-slate-400'
                            }`}>
                              <Check className="w-3 h-3 stroke-[3]" />
                            </button>
                          </td>

                          {/* Remarks */}
                          <td className="py-2.5 px-3 border-r border-slate-200/60 text-xs text-slate-600 font-normal">
                            {t.remarks || '-'}
                          </td>

                          {/* Partition */}
                          <td className="py-2.5 px-2 text-center border-r border-slate-200/60">
                            <span className="inline-block font-bold text-slate-900 text-xs uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {t.partition || '-'}
                            </span>
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
            Key Handed Over (Cu/k: Cupboard, D/k: Door)
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

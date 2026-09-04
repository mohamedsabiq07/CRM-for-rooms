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
  Plus
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
      t.section.toLowerCase().includes(q)
    );
  });

  // Group tenants by section (e.g. HALL, ROOM)
  const sections = Array.from(new Set(tenants.map(t => t.section || 'HALL')));
  if (!sections.includes('HALL')) sections.unshift('HALL');
  if (!sections.includes('ROOM')) sections.push('ROOM');

  const sheetTitle = room 
    ? `${building.name.toUpperCase()} - ROOM ${room.roomNumber} - PARTITION` 
    : `${building.name.toUpperCase()} - PARTITION`;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden mb-8">
      {/* Title Header: Golden Banner matching the reference photo */}
      <div className="bg-amber-400 py-2.5 px-6 border-b-2 border-amber-500/80 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-black tracking-widest text-slate-900 uppercase mx-auto text-center">
          {sheetTitle}
        </h2>
      </div>

      {/* Spreadsheet Table Container with horizontal scrolling */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse select-none">
          <thead>
            <tr className="bg-amber-100/90 text-slate-900 font-bold border-b border-amber-300">
              <th className="py-2.5 px-3 border-r border-amber-200 text-center w-12">Sno</th>
              <th className="py-2.5 px-3 border-r border-amber-200 min-w-[150px]">Tenants</th>
              <th className="py-2.5 px-3 border-r border-amber-200 min-w-[110px]">Place</th>
              <th className="py-2.5 px-3 border-r border-amber-200 text-center min-w-[100px]">Deposit</th>
              <th className="py-2.5 px-3 border-r border-amber-200 text-center min-w-[110px]">Joining date</th>
              <th className="py-2.5 px-3 border-r border-amber-200 text-center min-w-[110px]">Stay Duration</th>
              <th className="py-2.5 px-3 border-r border-amber-200 text-center min-w-[100px] bg-amber-200/60">
                Rent / Due
              </th>
              <th className="py-2.5 px-2 border-r border-amber-200 text-center w-14" title="Cupboard Key">
                Cu/k
              </th>
              <th className="py-2.5 px-2 border-r border-amber-200 text-center w-14" title="Door Key">
                D/k
              </th>
              <th className="py-2.5 px-3 border-r border-amber-200 min-w-[160px]">Remarks</th>
              <th className="py-2.5 px-2.5 border-r border-amber-200 text-center min-w-[70px]">Partition</th>
              <th className="py-2.5 px-3 text-center min-w-[140px]">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sections.map((sectionName) => {
              const sectionTenants = filteredTenants.filter(t => (t.section || 'HALL') === sectionName);

              return (
                <React.Fragment key={sectionName}>
                  {/* Black Section Divider matching image (HALL / ROOM) */}
                  <tr className="bg-black text-white font-extrabold uppercase tracking-wider text-xs">
                    <td colSpan={12} className="py-1.5 px-4 text-center">
                      <div className="flex items-center justify-between">
                        <span className="w-1/4"></span>
                        <span className="text-amber-400 text-center">{sectionName}</span>
                        <div className="w-1/4 text-right">
                          {onAddTenantToSection && (
                            <button
                              onClick={() => onAddTenantToSection(sectionName)}
                              className="text-[10px] text-slate-300 hover:text-amber-300 font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 hover:border-amber-400"
                            >
                              + Add to {sectionName}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {sectionTenants.length === 0 ? (
                    <tr className="bg-emerald-50/40">
                      <td colSpan={12} className="py-3 px-4 text-center text-xs text-slate-400 italic">
                        No tenants currently listed in {sectionName}
                      </td>
                    </tr>
                  ) : (
                    sectionTenants.map((t, idx) => {
                      const dueInfo = calculateRentDueInfo(t.joiningDate, t.lastPaidDate, t.currentMonthStatus);
                      const isEven = idx % 2 === 0;
                      const isSunandaSpecial = t.name.toLowerCase().includes('sunanda') || t.currentMonthStatus === 'Due';
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
                          className={`border-b border-emerald-200/80 transition-colors hover:bg-emerald-100/90 ${
                            isEven ? 'bg-[#c6efce]/70' : 'bg-[#d8f4de]/90'
                          }`}
                        >
                          {/* Sno */}
                          <td className="py-2.5 px-3 text-center border-r border-emerald-300/70 font-semibold text-slate-700">
                            {t.sno}
                          </td>

                          {/* Tenant Name */}
                          <td className="py-2.5 px-3 border-r border-emerald-300/70 font-bold text-slate-900">
                            <div className="flex items-center justify-between gap-1">
                              <span>{t.name}</span>
                              {t.phone && (
                                <span className="text-[10px] font-mono text-slate-500 font-normal hidden lg:inline">
                                  {t.phone}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Place / Origin */}
                          <td className="py-2.5 px-3 border-r border-emerald-300/70 font-medium text-slate-800">
                            {t.place || '-'}
                          </td>

                          {/* Deposit */}
                          <td className={`py-2.5 px-3 text-center border-r border-emerald-300/70 font-bold ${
                            t.depositNote === 'No Advance' || t.deposit === 0 
                              ? 'text-rose-600 font-semibold text-xs' 
                              : 'text-slate-900'
                          }`}>
                            {t.depositNote ? t.depositNote : t.deposit > 0 ? t.deposit : '-'}
                          </td>

                          {/* Joining Date */}
                          <td className="py-2.5 px-3 text-center border-r border-emerald-300/70 font-medium text-slate-800 text-xs">
                            {t.joiningDate || '-'}
                          </td>

                          {/* Stay Duration */}
                          <td className="py-2.5 px-3 text-center border-r border-emerald-300/70 font-medium text-slate-700 text-xs">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-700/10 text-emerald-900 font-semibold">
                              {calculateStayDuration(t.joiningDate, t.leavingDate)}
                            </span>
                          </td>

                          {/* Rent / Monthly Status (e.g. Sep-26) */}
                          <td 
                            onClick={() => onStatusClick(t)}
                            title="Click to update payment status"
                            className={`py-2.5 px-2 text-center border-r border-emerald-300/70 cursor-pointer font-bold transition ${
                              isSunandaSpecial 
                                ? 'bg-amber-300 text-amber-950 hover:bg-amber-400' 
                                : t.currentMonthStatus === 'Paid'
                                  ? 'bg-emerald-600/20 text-emerald-900 hover:bg-emerald-300'
                                  : dueInfo.status === 'overdue'
                                    ? 'bg-rose-200 text-rose-900 hover:bg-rose-300 animate-pulse'
                                    : 'hover:bg-amber-200 text-slate-800'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs">
                                AED {t.rentAmount || 'Rent'}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                t.currentMonthStatus === 'Paid' 
                                  ? 'bg-emerald-700 text-white' 
                                  : 'bg-amber-500 text-slate-950'
                              }`}>
                                {t.currentMonthStatus || 'Due'}
                              </span>
                            </div>
                          </td>

                          {/* Cupboard Key (Cu/k) */}
                          <td 
                            onClick={() => onToggleKey(t.id, 'cupboard')}
                            title="Click to toggle Cupboard Key status"
                            className="py-2.5 px-1 text-center border-r border-emerald-300/70 cursor-pointer hover:bg-emerald-200/60"
                          >
                            <button className={`w-5 h-5 mx-auto rounded flex items-center justify-center border transition ${
                              t.cupboardKey 
                                ? 'bg-indigo-600 text-white border-indigo-700' 
                                : 'bg-white text-transparent border-slate-300 hover:border-slate-400'
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </td>

                          {/* Door Key (D/k) */}
                          <td 
                            onClick={() => onToggleKey(t.id, 'door')}
                            title="Click to toggle Door Key status"
                            className="py-2.5 px-1 text-center border-r border-emerald-300/70 cursor-pointer hover:bg-emerald-200/60"
                          >
                            <button className={`w-5 h-5 mx-auto rounded flex items-center justify-center border transition ${
                              t.doorKey 
                                ? 'bg-indigo-600 text-white border-indigo-700' 
                                : 'bg-white text-transparent border-slate-300 hover:border-slate-400'
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </td>

                          {/* Remarks */}
                          <td className="py-2.5 px-3 border-r border-emerald-300/70 text-xs text-slate-800 italic font-medium">
                            {t.remarks || ''}
                          </td>

                          {/* Partition (p1, p2, p3... p8 in red text matching picture) */}
                          <td className="py-2.5 px-2 text-center border-r border-emerald-300/70 font-extrabold text-rose-700 text-xs sm:text-sm uppercase tracking-wider">
                            {t.partition || '-'}
                          </td>

                          {/* Actions: Call, WhatsApp, Edit, Delete */}
                          <td className="py-2.5 px-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Direct Phone Call */}
                              <a
                                href={`tel:${t.phone.replace(/\s+/g, '')}`}
                                title={`Call ${t.name}`}
                                className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>

                              {/* WhatsApp Reminder */}
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Send WhatsApp message to ${t.name}`}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>

                              {/* Edit Modal */}
                              <button
                                onClick={() => onEditTenant(t)}
                                title="Edit Tenant Details"
                                className="p-1.5 rounded-lg bg-slate-700 text-white hover:bg-slate-900 transition shadow-sm"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete / Vacate */}
                              <button
                                onClick={() => onDeleteTenant(t.id)}
                                title="Delete or Vacate Tenant"
                                className="p-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
      <div className="bg-slate-50 p-3.5 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#c6efce] border border-emerald-400 rounded"></span>
            Active Room Tenant
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-amber-300 border border-amber-400 rounded"></span>
            Payment Due / Attention
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-indigo-600 rounded"></span>
            Key Handed Over (Cu/k: Cupboard, D/k: Door)
          </span>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          💡 Click any <strong>Rent cell</strong> to record payment or adjust balance. Click <strong>Cu/k</strong> or <strong>D/k</strong> to toggle key handover.
        </div>
      </div>
    </div>
  );
};

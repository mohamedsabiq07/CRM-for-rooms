import React, { useState, useMemo } from 'react';
import {
  Users,
  Phone,
  MessageSquare,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit3,
  Copy,
  X,
  MapPin,
  ChevronDown,
  ChevronUp,
  Send,
  Smartphone,
} from 'lucide-react';
import { CustomerInquiry } from '../types/crm';
import { formatWhatsAppNumber, normalizePhoneForStorage } from '../utils/dateUtils';

// ─── Known areas strictly restricted to where rooms are operated ─────────────
const AREA_OPTIONS = [
  'Al Barsha 1',
  'Deira',
  'Sharjah',
  'Khor Al Anz',
] as const;

// ─── Colour palette per area ───────────────────────────────────────────────────
const AREA_COLORS: Record<string, string> = {
  'Al Barsha 1': 'bg-indigo-50 border-indigo-200 text-indigo-800',
  'Deira':       'bg-amber-50  border-amber-200  text-amber-800',
  'Sharjah':     'bg-emerald-50 border-emerald-200 text-emerald-800',
  'Khor Al Anz': 'bg-sky-50    border-sky-200    text-sky-800',
  'Other':       'bg-slate-100 border-slate-300  text-slate-700',
};
const AREA_DOT: Record<string, string> = {
  'Al Barsha 1': 'bg-indigo-500',
  'Deira':       'bg-amber-500',
  'Sharjah':     'bg-emerald-500',
  'Khor Al Anz': 'bg-sky-500',
  'Other':       'bg-slate-500',
};
const areaColor  = (a?: string) => AREA_COLORS[a ?? 'Other']  ?? AREA_COLORS['Other'];
const areaDot    = (a?: string) => AREA_DOT[a ?? 'Other']     ?? AREA_DOT['Other'];
const areaLabel  = (a?: string) => a && a.trim() ? a : 'Unspecified';

// ─── Status badge ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  'New':           'bg-amber-50   text-amber-800  border-amber-200',
  'Followed Up':   'bg-sky-50     text-sky-800    border-sky-200',
  'Interested':    'bg-purple-50  text-purple-800 border-purple-200',
  'Converted':     'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Not Interested':'bg-slate-100  text-slate-600  border-slate-200',
};

// ─── Helper: effective WhatsApp number (prefer whatsappPhone, fall back to phone) ─
const waPhone = (inq: CustomerInquiry) =>
  formatWhatsAppNumber(inq.whatsappPhone?.trim() || inq.phone);

// ─── Component ──────────────────────────────────────────────────────────────────
interface FollowUpPageProps {
  inquiries: CustomerInquiry[];
  selectedMonth: string;
  onAddInquiry: (inquiry: CustomerInquiry) => void;
  onUpdateInquiry: (inquiry: CustomerInquiry) => void;
  onDeleteInquiry: (inquiryId: string) => void;
  onBatchUpdateStatus: (ids: string[], status: string, date: string) => void;
  onConvertToTenant?: (inquiry: CustomerInquiry) => void;
}

export const FollowUpPage: React.FC<FollowUpPageProps> = ({
  inquiries,
  selectedMonth,
  onAddInquiry,
  onUpdateInquiry,
  onDeleteInquiry,
  onBatchUpdateStatus,
  onConvertToTenant,
}) => {
  // ── Filter state ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]         = useState('');
  const [statusFilter, setStatusFilter]       = useState<string>('all');
  const [requirementFilter, setRequirementFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter]           = useState<string>('all');
  const [sourceFilter, setSourceFilter]       = useState<'all' | 'former_tenants' | 'direct_inquiries'>('all');
  const [groupByArea, setGroupByArea]         = useState(true);
  const [collapsedAreas, setCollapsedAreas]   = useState<Set<string>>(new Set());

  // ── Modal / form state ────────────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen]           = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastAreaFilter, setBroadcastAreaFilter] = useState<string>('all');
  const [editingInquiry, setEditingInquiry]           = useState<CustomerInquiry | null>(null);

  const todayStr = () => new Date().toLocaleDateString('en-GB').replace(/\//g, '.');

  // ── Form fields ───────────────────────────────────────────────────────────────
  const [formName, setFormName]             = useState('');
  const [formPhone, setFormPhone]           = useState('');
  const [formWaPhone, setFormWaPhone]       = useState('');
  const [formDate, setFormDate]             = useState(todayStr());
  const [formLookingFor, setFormLookingFor] = useState<CustomerInquiry['lookingFor']>('Bed Space (Lower)');
  const [formLocation, setFormLocation]     = useState('Al Barsha 1');
  const [formBudget, setFormBudget]         = useState<number>(750);
  const [formStatus, setFormStatus]         = useState<CustomerInquiry['status']>('New');
  const [formNotes, setFormNotes]           = useState('');

  // ── Broadcast state ───────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds]         = useState<string[]>([]);
  const [broadcastTemplate, setBroadcastTemplate] = useState(
    `Hi {name}, hope you're doing well! 😊\n\nWe have availability for a {lookingFor} in {area}. Our rooms are clean, fully furnished with DEWA, high-speed Wi-Fi, weekly cleaning, and a secure environment.\n\nIf you're still looking for accommodation, feel free to reach out and we can arrange a viewing! 🏠\n\n– Mohamed | Tenant Management`
  );
  const [broadcastFeedback, setBroadcastFeedback] = useState('');

  // ── KPIs ──────────────────────────────────────────────────────────────────────
  const totalLeads       = inquiries.length;
  const newLeads         = inquiries.filter(i => i.status === 'New').length;
  const interestedLeads  = inquiries.filter(i => i.status === 'Interested').length;
  const convertedLeads   = inquiries.filter(i => i.status === 'Converted').length;
  const formerCount      = inquiries.filter(i => i.leadSource === 'Former Tenant' || !!i.tenantId).length;
  const directCount      = inquiries.filter(i => i.leadSource !== 'Former Tenant' && !i.tenantId).length;

  // ── Unique areas for filter bar ────────────────────────────────────────────────
  const allAreas = useMemo(() => {
    const s = new Set<string>();
    inquiries.forEach(i => s.add(i.preferredLocation?.trim() || 'Unspecified'));
    return Array.from(s).sort();
  }, [inquiries]);

  // ── Filtered leads ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => inquiries.filter(item => {
    if (sourceFilter === 'former_tenants'   && item.leadSource !== 'Former Tenant' && !item.tenantId) return false;
    if (sourceFilter === 'direct_inquiries' && (item.leadSource === 'Former Tenant' || item.tenantId)) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (requirementFilter !== 'all' && item.lookingFor !== requirementFilter) return false;
    if (areaFilter !== 'all') {
      const loc = item.preferredLocation?.trim() || 'Unspecified';
      if (loc !== areaFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        (item.whatsappPhone || '').toLowerCase().includes(q) ||
        (item.notes || '').toLowerCase().includes(q) ||
        (item.preferredLocation || '').toLowerCase().includes(q)
      );
    }
    return true;
  }), [inquiries, sourceFilter, statusFilter, requirementFilter, areaFilter, searchQuery]);

  // ── Grouped by area ────────────────────────────────────────────────────────────
  const groupedByArea = useMemo(() => {
    const map = new Map<string, CustomerInquiry[]>();
    filtered.forEach(item => {
      const key = item.preferredLocation?.trim() || 'Unspecified';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  // ── Area toggle collapse ───────────────────────────────────────────────────────
  const toggleCollapse = (area: string) => {
    setCollapsedAreas(prev => {
      const n = new Set(prev);
      n.has(area) ? n.delete(area) : n.add(area);
      return n;
    });
  };

  // ── Open Add modal ─────────────────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setEditingInquiry(null);
    setFormName(''); setFormPhone(''); setFormWaPhone('');
    setFormDate(todayStr()); setFormLookingFor('Bed Space (Lower)');
    setFormLocation('Al Barsha 1'); setFormBudget(750);
    setFormStatus('New'); setFormNotes('');
    setIsAddModalOpen(true);
  };

  // ── Open Edit modal ────────────────────────────────────────────────────
  const handleOpenEditModal = (item: CustomerInquiry) => {
    setEditingInquiry(item);
    setFormName(item.name); setFormPhone(item.phone);
    setFormWaPhone(item.whatsappPhone || '');
    setFormDate(item.inquiryDate); setFormLookingFor(item.lookingFor);
    setFormLocation(item.preferredLocation || 'Al Barsha 1');
    setFormBudget(item.budget || 0); setFormStatus(item.status);
    setFormNotes(item.notes || '');
    setIsAddModalOpen(true);
  };

  // ── Save form ──────────────────────────────────────────────────────────────────
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;
    const cleanPhone = normalizePhoneForStorage(formPhone);
    const cleanWaPhone = formWaPhone.trim() ? normalizePhoneForStorage(formWaPhone) : undefined;
    const base = {
      name: formName.trim(),
      phone: cleanPhone,
      whatsappPhone: cleanWaPhone,
      inquiryDate: formDate,
      lookingFor: formLookingFor,
      preferredLocation: formLocation,
      budget: Number(formBudget) || 0,
      status: formStatus,
      notes: formNotes.trim(),
    };
    if (editingInquiry) {
      onUpdateInquiry({ ...editingInquiry, ...base });
    } else {
      onAddInquiry({ id: `inq-${Date.now()}`, ...base });
    }
    setIsAddModalOpen(false);
  };

  // ── Single WhatsApp ────────────────────────────────────────────────────────────
  const formatMsg = (item: CustomerInquiry, template?: string) =>
    (template || broadcastTemplate)
      .replace(/{name}/g, item.name)
      .replace(/{lookingFor}/g, item.lookingFor)
      .replace(/{area}/g, item.preferredLocation || 'Dubai')
      .replace(/{month}/g, selectedMonth)
      .replace(/{budget}/g, String(item.budget || ''));

  const handleSingleWhatsApp = (item: CustomerInquiry) => {
    const num = waPhone(item);
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(formatMsg(item))}`, '_blank');
    onUpdateInquiry({ ...item, status: 'Followed Up', lastContactedDate: todayStr() });
  };

  // ── Broadcast helpers ──────────────────────────────────────────────────────────
  const handleOpenBroadcast = (area?: string) => {
    const pool = area
      ? inquiries.filter(i => (i.preferredLocation?.trim() || 'Unspecified') === area)
      : filtered;
    setSelectedIds(pool.filter(i => i.status !== 'Converted' && i.status !== 'Not Interested').map(i => i.id));
    setBroadcastAreaFilter(area || 'all');
    setIsBroadcastModalOpen(true);
  };

  const broadcastPool = useMemo(() => {
    if (broadcastAreaFilter === 'all') return filtered;
    return inquiries.filter(i => (i.preferredLocation?.trim() || 'Unspecified') === broadcastAreaFilter);
  }, [inquiries, filtered, broadcastAreaFilter]);

  const handleToggleSelectAll = () => {
    setSelectedIds(prev =>
      prev.length === broadcastPool.length ? [] : broadcastPool.map(i => i.id)
    );
  };

  const handleToggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleCopyNumbers = () => {
    const nums = inquiries.filter(i => selectedIds.includes(i.id)).map(i => waPhone(i)).join(', ');
    navigator.clipboard.writeText(nums);
    setBroadcastFeedback(`Copied ${selectedIds.length} WhatsApp numbers to clipboard!`);
    setTimeout(() => setBroadcastFeedback(''), 4000);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(broadcastTemplate);
    setBroadcastFeedback('Broadcast message template copied to clipboard!');
    setTimeout(() => setBroadcastFeedback(''), 4000);
  };

  const handleMarkFollowedUp = () => {
    onBatchUpdateStatus(selectedIds, 'Followed Up', todayStr());
    setBroadcastFeedback(`Marked ${selectedIds.length} leads as Followed Up!`);
    setTimeout(() => setBroadcastFeedback(''), 4000);
  };

  // ── Row renderer ───────────────────────────────────────────────────────────────
  const renderRow = (item: CustomerInquiry) => {
    const waNum = waPhone(item);
    const hasSeperateWa = !!(item.whatsappPhone?.trim() && item.whatsappPhone.trim() !== item.phone.trim());
    return (
      <tr key={item.id} className="hover:bg-slate-50/70 transition">
        {/* Name */}
        <td className="py-2.5 px-3 border-r border-slate-200/60 font-bold text-slate-900">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>{item.name}</span>
            {(item.leadSource === 'Former Tenant' || !!item.tenantId) && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                🏠 Former
              </span>
            )}
          </div>
          {item.preferredLocation && (
            <span className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold border ${areaColor(item.preferredLocation)}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${areaDot(item.preferredLocation)}`} />
              {item.preferredLocation}
            </span>
          )}
        </td>

        {/* Phones */}
        <td className="py-2.5 px-3 border-r border-slate-200/60 text-slate-700 font-medium text-xs">
          {/* Calling number */}
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-mono">{item.phone}</span>
          </div>
          {/* WhatsApp number — shown only if different */}
          {hasSeperateWa ? (
            <div className="flex items-center gap-1 mt-0.5">
              <MessageSquare className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="font-mono text-emerald-700">{item.whatsappPhone}</span>
              <span className="text-[9px] text-emerald-600 font-bold">WA</span>
            </div>
          ) : (
            <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-0.5">
              <MessageSquare className="w-2.5 h-2.5" />
              Same as calling
            </div>
          )}
        </td>

        {/* Date */}
        <td className="py-2.5 px-3 border-r border-slate-200/60 text-center text-slate-600 text-xs">
          {item.inquiryDate}
          {item.lastContactedDate && (
            <span className="block text-[10px] text-slate-400">Last: {item.lastContactedDate}</span>
          )}
        </td>

        {/* Looking For */}
        <td className="py-2.5 px-3 border-r border-slate-200/60">
          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            {item.lookingFor}
          </span>
        </td>

        {/* Budget */}
        <td className="py-2.5 px-3 border-r border-slate-200/60 text-center font-bold text-slate-900 text-xs">
          {item.budget ? `AED ${item.budget}` : '-'}
        </td>

        {/* Status */}
        <td className="py-2.5 px-3 border-r border-slate-200/60 text-center">
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[item.status] || 'bg-slate-100 text-slate-700'}`}>
            {item.status}
          </span>
        </td>

        {/* Notes */}
        <td className="py-2.5 px-3 border-r border-slate-200/60 text-slate-600 text-xs max-w-[160px]">
          {item.notes || '-'}
        </td>

        {/* Actions */}
        <td className="py-2.5 px-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => handleSingleWhatsApp(item)}
              title={`WhatsApp ${hasSeperateWa ? item.whatsappPhone : item.phone}`}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold transition shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button onClick={() => handleOpenEditModal(item)} title="Edit" className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDeleteInquiry(item.id)} title="Delete" className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // ── Mobile card renderer ───────────────────────────────────────────────────────
  const renderMobileCard = (item: CustomerInquiry) => {
    const hasSeperateWa = !!(item.whatsappPhone?.trim() && item.whatsappPhone.trim() !== item.phone.trim());
    return (
      <div key={item.id} className="p-3.5 bg-white hover:bg-slate-50 transition border-b border-slate-200/80 last:border-b-0 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
              {(item.leadSource === 'Former Tenant' || !!item.tenantId) && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-200">
                  🏠 Former
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {item.preferredLocation && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${areaColor(item.preferredLocation)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${areaDot(item.preferredLocation)}`} />
                  {item.preferredLocation}
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-semibold border border-indigo-200">
                {item.lookingFor}
              </span>
              {item.budget ? (
                <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  AED {item.budget}
                </span>
              ) : null}
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS[item.status] || 'bg-slate-100 text-slate-700'}`}>
            {item.status}
          </span>
        </div>

        {/* Contact info */}
        <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
          <div className="space-y-0.5 font-mono text-xs">
            <div className="flex items-center gap-1.5 text-slate-800">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold">{item.phone}</span>
            </div>
            {hasSeperateWa && (
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>WA: {item.whatsappPhone}</span>
              </div>
            )}
          </div>
          <div className="text-right text-[10px] text-slate-500">
            <div>Added: {item.inquiryDate}</div>
            {item.lastContactedDate && <div className="text-slate-400">Contacted: {item.lastContactedDate}</div>}
          </div>
        </div>

        {item.notes && (
          <p className="text-[11px] text-slate-600 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60 leading-relaxed">
            {item.notes}
          </p>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-5 gap-1.5 pt-0.5">
          <button
            onClick={() => handleSingleWhatsApp(item)}
            className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <a
            href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
            className="col-span-1 flex items-center justify-center gap-1 py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition text-center"
          >
            <Phone className="w-3.5 h-3.5 text-slate-600" />
            <span>Call</span>
          </a>
          <button
            onClick={() => handleOpenEditModal(item)}
            title="Edit Inquiry"
            className="col-span-1 flex items-center justify-center gap-1 py-2 px-2 text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDeleteInquiry(item.id)}
            title="Delete Inquiry"
            className="col-span-1 flex items-center justify-center py-2 px-2 text-rose-500 hover:bg-rose-50 border border-slate-200 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // ── Table header ───────────────────────────────────────────────────────────────
  const tableHead = (
    <thead>
      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs">
        <th className="py-2.5 px-3 border-r border-slate-200/60 min-w-[160px]">Customer</th>
        <th className="py-2.5 px-3 border-r border-slate-200/60 min-w-[150px]">Phone Numbers</th>
        <th className="py-2.5 px-3 border-r border-slate-200/60 text-center min-w-[100px]">Date</th>
        <th className="py-2.5 px-3 border-r border-slate-200/60 min-w-[130px]">Looking For</th>
        <th className="py-2.5 px-3 border-r border-slate-200/60 text-center min-w-[80px]">Budget</th>
        <th className="py-2.5 px-3 border-r border-slate-200/60 text-center min-w-[110px]">Status</th>
        <th className="py-2.5 px-3 border-r border-slate-200/60 min-w-[140px]">Notes</th>
        <th className="py-2.5 px-3 text-center min-w-[170px]">Actions</th>
      </tr>
    </thead>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">

      {/* ── TOP BANNER ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#181824] text-white p-6 rounded-2xl shadow-sm border border-[#262638]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#38CE3C] uppercase tracking-widest">
              <Users className="w-4 h-4" />
              <span>Customer Inquiries &amp; Lead Pipeline</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Follow-Up &amp; Area-Based WhatsApp Broadcast
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Leads grouped by preferred area — target all customers in a specific area when a vacancy opens there.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#38CE3C] hover:bg-[#30b533] text-[#181824] font-bold rounded-lg text-xs shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Add Inquiry
            </button>
            <button
              onClick={() => handleOpenBroadcast()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#222234] hover:bg-[#2c2c42] text-[#38CE3C] font-semibold rounded-lg text-xs shadow-sm transition cursor-pointer border border-[#2f2f45]"
            >
              <Send className="w-4 h-4" />
              WhatsApp Broadcast
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6">
          {[
            { label: 'Total Leads',     value: totalLeads,      color: 'text-white',          sub: 'All registered' },
            { label: '🏠 Former Tenants', value: formerCount,   color: 'text-purple-300',     sub: 'Left rooms' },
            { label: 'Direct Inquiries',value: directCount,     color: 'text-sky-300',        sub: 'Called / walked in' },
            { label: 'New',             value: newLeads,        color: 'text-amber-300',      sub: 'Pending contact' },
            { label: 'Interested',      value: interestedLeads, color: 'text-emerald-300',    sub: 'Viewing scheduled' },
            { label: 'Converted',       value: convertedLeads,  color: 'text-[#38CE3C]',     sub: 'Moved in' },
          ].map(k => (
            <div key={k.label} className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
              <span className={`text-[10px] font-semibold uppercase tracking-wider block ${k.color}`}>{k.label}</span>
              <span className={`text-xl font-bold mt-0.5 block ${k.color}`}>{k.value}</span>
              <span className="text-[11px] text-slate-400">{k.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── AREA SUMMARY CARDS ──────────────────────────────────────────────────── */}
      {groupedByArea.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              Leads by Preferred Area
            </h3>
            <span className="text-xs text-slate-500">{groupedByArea.length} areas • click a card to target that area</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {groupedByArea.map(([area, leads]) => {
              const active = leads.filter(i => i.status !== 'Converted' && i.status !== 'Not Interested').length;
              return (
                <button
                  key={area}
                  onClick={() => handleOpenBroadcast(area)}
                  title={`Send WhatsApp to all ${area} leads`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition hover:shadow-md cursor-pointer ${areaColor(area)}`}
                >
                  <span className={`w-2 h-2 rounded-full ${areaDot(area)}`} />
                  <span>{area}</span>
                  <span className="font-extrabold">{leads.length}</span>
                  {active > 0 && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-white/70 text-[10px] font-bold border border-current opacity-80">
                      <MessageSquare className="w-2.5 h-2.5" />
                      {active}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FILTER / SEARCH BAR ─────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        {/* Row 1: source + area filter */}
        <div className="flex items-center gap-2 flex-wrap border-b border-slate-100 pb-3">
          <span className="text-xs text-slate-500 font-semibold">Source:</span>
          {(['all', 'former_tenants', 'direct_inquiries'] as const).map(f => (
            <button key={f} onClick={() => setSourceFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                sourceFilter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {f === 'all' ? `All (${totalLeads})` : f === 'former_tenants' ? `🏠 Former (${formerCount})` : `Direct (${directCount})`}
            </button>
          ))}

          <span className="text-xs text-slate-400 mx-1">|</span>
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-semibold">Area:</span>
          <select
            value={areaFilter}
            onChange={e => setAreaFilter(e.target.value)}
            className="bg-slate-50 text-xs font-medium text-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none"
          >
            <option value="all">All Areas</option>
            {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <button
            onClick={() => setGroupByArea(g => !g)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
              groupByArea ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-3 h-3" />
            {groupByArea ? 'Grouped by Area ✓' : 'Group by Area'}
          </button>
        </div>

        {/* Row 2: search + status + requirement */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, area, notes…"
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {['all', 'New', 'Followed Up', 'Interested', 'Converted', 'Not Interested'].map(st => (
              <button key={st} onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  statusFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {st === 'all' ? 'All Statuses' : st}
              </button>
            ))}
          </div>
          <select
            value={requirementFilter} onChange={e => setRequirementFilter(e.target.value)}
            className="bg-slate-50 text-xs font-medium text-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none"
          >
            <option value="all">Any Room Type</option>
            <option value="Bed Space (Lower)">Lower Bed</option>
            <option value="Bed Space (Upper)">Upper Bed</option>
            <option value="Partition">Partition</option>
            <option value="Private Room">Private Room</option>
            <option value="Any">Any / Flexible</option>
          </select>
        </div>
      </div>

      {/* ── INQUIRIES TABLE (flat or grouped) ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>No customer inquiries match your filters.</p>
          </div>
        ) : groupByArea ? (
          /* ── GROUPED VIEW ─────────────────────────────────────────────────── */
          <div className="divide-y divide-slate-200">
            {groupedByArea.map(([area, leads]) => {
              const isCollapsed = collapsedAreas.has(area);
              const active = leads.filter(i => i.status !== 'Converted' && i.status !== 'Not Interested').length;
              return (
                <div key={area}>
                  {/* Area header row */}
                  <div className={`flex items-center justify-between px-4 py-2.5 ${areaColor(area)} border-b`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${areaDot(area)}`} />
                      <span className="text-sm font-bold">{area}</span>
                      <span className="text-[11px] font-semibold opacity-70">{leads.length} leads · {active} contactable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenBroadcast(area)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-bold transition shadow-sm"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Broadcast to {area}
                      </button>
                      <button onClick={() => toggleCollapse(area)} className="p-1 rounded hover:bg-black/10 transition">
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {!isCollapsed && (
                    <>
                      {/* Mobile Cards (Phones / small screens) */}
                      <div className="md:hidden divide-y divide-slate-100">
                        {leads.map(renderMobileCard)}
                      </div>
                      {/* Desktop Table (Tablets & desktops) */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          {tableHead}
                          <tbody className="divide-y divide-slate-200/70">{leads.map(renderRow)}</tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── FLAT VIEW ────────────────────────────────────────────────────── */
          <>
            {/* Mobile Cards (Phones / small screens) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map(renderMobileCard)}
            </div>
            {/* Desktop Table (Tablets & desktops) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                {tableHead}
                <tbody className="divide-y divide-slate-200/70">{filtered.map(renderRow)}</tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ══ ADD / EDIT MODAL ═══════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">{editingInquiry ? 'Edit Customer Inquiry' : 'Add New Customer Inquiry'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="inquiry-form" onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-sm sm:text-xs">

              {/* Customer Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Phone numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Calling Number */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    Calling Number *
                  </label>
                  <div className="flex rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                    <span className="inline-flex items-center px-2.5 bg-slate-100 text-slate-700 text-xs font-semibold border-r border-slate-200 select-none">
                      🇦🇪 +971
                    </span>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="50 123 4567 or 050..."
                      className="w-full px-3 py-2.5 sm:py-2 text-sm text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Accepts 050..., 50..., or full international number</p>
                </div>

                {/* WhatsApp Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      WhatsApp Number
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormWaPhone(formPhone)}
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition cursor-pointer"
                      title="Copy calling number to WhatsApp field"
                    >
                      Same as Calling
                    </button>
                  </div>
                  <div className="flex rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                    <span className="inline-flex items-center px-2.5 bg-emerald-50 text-emerald-800 text-xs font-semibold border-r border-emerald-200 select-none">
                      WA
                    </span>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={formWaPhone}
                      onChange={e => setFormWaPhone(e.target.value)}
                      placeholder="Leave blank if same as calling"
                      className="w-full px-3 py-2.5 sm:py-2 text-sm text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formWaPhone ? 'WhatsApp messages will be sent to this number' : 'Leave empty to automatically use calling number'}
                  </p>
                </div>
              </div>

              {/* Inquiry Date + Room Requirement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inquiry Date</label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    placeholder="DD.MM.YYYY"
                    className="w-full px-3 py-2.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Looking For (Room Type)</label>
                  <select
                    value={formLookingFor}
                    onChange={e => setFormLookingFor(e.target.value as any)}
                    className="w-full px-3 py-2.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Bed Space (Lower)">Bed Space (Lower)</option>
                    <option value="Bed Space (Upper)">Bed Space (Upper)</option>
                    <option value="Partition">Partition</option>
                    <option value="Private Room">Private Room</option>
                    <option value="Any">Any / Flexible</option>
                  </select>
                </div>
              </div>

              {/* Preferred Area: Restricted strictly to the 4 operational areas */}
              <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    Preferred Area * (Select One)
                  </label>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${areaColor(formLocation)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${areaDot(formLocation)}`} />
                    {formLocation}
                  </span>
                </div>
                {/* 1-tap Area Selection Chips */}
                <div className="grid grid-cols-2 gap-2">
                  {AREA_OPTIONS.map(a => {
                    const isSelected = formLocation === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setFormLocation(a)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                            : `${AREA_COLORS[a] || 'bg-white text-slate-700 border-slate-200'} hover:opacity-90`
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : AREA_DOT[a] || 'bg-slate-400'}`} />
                        <span>{a}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Budget (AED / month)</label>
                  <input
                    type="number"
                    value={formBudget || ''}
                    onChange={e => setFormBudget(Number(e.target.value))}
                    placeholder="e.g. 750"
                    className="w-full px-3 py-2.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lead Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="New">New Inquiry</option>
                    <option value="Followed Up">Followed Up</option>
                    <option value="Interested">Interested (Viewing)</option>
                    <option value="Converted">Converted (Moved In)</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </div>
              </div>

              {/* Notes & Requirements */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes &amp; Requirements</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. Looking for room next month, works in Barsha, wants lower bed..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

            </form>

            {/* Sticky Action Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 sm:py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition text-sm sm:text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="inquiry-form"
                className="px-5 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-sm transition text-sm sm:text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {editingInquiry ? 'Save Changes' : 'Create Inquiry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ BROADCAST MODAL ════════════════════════════════════════════════════════ */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {broadcastAreaFilter === 'all'
                      ? 'WhatsApp Broadcast — All Leads'
                      : `WhatsApp Broadcast — ${broadcastAreaFilter}`}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {broadcastAreaFilter !== 'all' && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mr-2 ${areaColor(broadcastAreaFilter)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${areaDot(broadcastAreaFilter)}`} />
                        {broadcastAreaFilter}
                      </span>
                    )}
                    {selectedIds.length} recipients selected
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {broadcastFeedback && (
                <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{broadcastFeedback}</span>
                </div>
              )}

              {/* Area selector inside broadcast modal */}
              <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-3 rounded-xl border border-slate-200">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="font-semibold text-slate-700 shrink-0">Target Area:</span>
                <button
                  type="button"
                  onClick={() => { setBroadcastAreaFilter('all'); setSelectedIds(filtered.filter(i => i.status !== 'Converted' && i.status !== 'Not Interested').map(i => i.id)); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${broadcastAreaFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                >
                  All Areas
                </button>
                {AREA_OPTIONS.map(area => (
                  <button key={area} type="button" onClick={() => {
                    setBroadcastAreaFilter(area);
                    const areaLeads = inquiries.filter(i => (i.preferredLocation?.trim() || 'Unspecified') === area);
                    setSelectedIds(areaLeads.filter(i => i.status !== 'Converted' && i.status !== 'Not Interested').map(i => i.id));
                  }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${broadcastAreaFilter === area ? 'bg-slate-900 text-white border-slate-900' : `${areaColor(area)} hover:opacity-80`}`}>
                    {area}
                  </button>
                ))}
              </div>

              {/* Message template */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">Message Template</label>
                  <span className="text-[10px] text-slate-400">Variables: {'{name}'}, {'{lookingFor}'}, {'{area}'}, {'{month}'}</span>
                </div>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <button type="button" onClick={() => setBroadcastTemplate(`Hi {name}, hope you're doing well! 😊\n\nWe have availability for a {lookingFor} in {area}. Our rooms are fully furnished with DEWA, Wi-Fi, weekly cleaning included.\n\nInterested? Reach out and we'll arrange a viewing! 🏠\n\n– Mohamed | Tenant Management`)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300 transition cursor-pointer">
                    Standard
                  </button>
                  <button type="button" onClick={() => setBroadcastTemplate(`Hi {name}! 😊 We have a {lookingFor} available in {area} – perfect for your requirement!\n\nFurnished, DEWA + Wi-Fi included, safe environment. Available immediately.\n\nShall we arrange a viewing? – Mohamed | Tenant Management`)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200 transition cursor-pointer">
                    Short &amp; Direct
                  </button>
                  <button type="button" onClick={() => setBroadcastTemplate(`Hi {name}, as our former resident, we'd love to welcome you back! 🏠\n\nWe have a {lookingFor} available in {area} with all facilities – DEWA, Wi-Fi, weekly cleaning, and a friendly environment.\n\nPriority viewing for returning tenants. Just reach out! – Mohamed | Tenant Management`)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-md border border-purple-200 transition cursor-pointer">
                    🏠 Former Tenant
                  </button>
                </div>
                <textarea rows={4} value={broadcastTemplate} onChange={e => setBroadcastTemplate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-sans focus:bg-white focus:outline-none focus:border-emerald-500" />
              </div>

              {/* Recipient list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700">
                    Recipients ({selectedIds.length} of {broadcastPool.length})
                  </span>
                  <button onClick={handleToggleSelectAll} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer">
                    {selectedIds.length === broadcastPool.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                  {broadcastPool.map(inq => {
                    const isSelected = selectedIds.includes(inq.id);
                    const hasWa = !!(inq.whatsappPhone?.trim() && inq.whatsappPhone.trim() !== inq.phone.trim());
                    return (
                      <div key={inq.id} onClick={() => handleToggleSelect(inq.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={isSelected} onChange={() => {}} className="rounded text-indigo-600" />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900">{inq.name}</span>
                              {(inq.preferredLocation) && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${areaColor(inq.preferredLocation)}`}>
                                  {inq.preferredLocation}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <Phone className="w-2.5 h-2.5" /> {inq.phone}
                              </span>
                              {hasWa && (
                                <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                                  <MessageSquare className="w-2.5 h-2.5" /> WA: {inq.whatsappPhone}
                                </span>
                              )}
                              <span>· {inq.lookingFor}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${STATUS_COLORS[inq.status] || 'bg-slate-100 text-slate-600'}`}>
                          {inq.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">Broadcast Options:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button onClick={handleCopyNumbers} disabled={selectedIds.length === 0}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded-lg shadow-2xs transition disabled:opacity-40 cursor-pointer">
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    Copy {selectedIds.length} WA Numbers
                  </button>
                  <button onClick={handleCopyTemplate}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded-lg shadow-2xs transition cursor-pointer">
                    <Copy className="w-3.5 h-3.5" />
                    Copy Message
                  </button>
                  <button onClick={handleMarkFollowedUp} disabled={selectedIds.length === 0}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-40 cursor-pointer">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Followed Up
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 pt-1">
                  Tip: Copy the numbers → paste into a new WhatsApp Broadcast List on your phone. Or click <b>WhatsApp</b> on individual leads for a personalised 1-click message.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button onClick={() => setIsBroadcastModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition cursor-pointer">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  Send,
} from 'lucide-react';
import { CustomerInquiry } from '../types/crm';
import { formatWhatsAppNumber, normalizePhoneForStorage } from '../utils/dateUtils';

// ─── Strictly restricted to our 4 operational areas ───────────────────────────
const AREA_OPTIONS = [
  'Al Barsha 1',
  'Deira',
  'Sharjah',
  'Khor Al Anz',
] as const;

const AREA_COLORS: Record<string, string> = {
  'Al Barsha 1': 'bg-indigo-50 border-indigo-200 text-indigo-800',
  'Deira':       'bg-amber-50 border-amber-200 text-amber-800',
  'Sharjah':     'bg-emerald-50 border-emerald-200 text-emerald-800',
  'Khor Al Anz': 'bg-sky-50 border-sky-200 text-sky-800',
  'Other':       'bg-slate-100 border-slate-300 text-slate-700',
};
const AREA_DOT: Record<string, string> = {
  'Al Barsha 1': 'bg-indigo-500',
  'Deira':       'bg-amber-500',
  'Sharjah':     'bg-emerald-500',
  'Khor Al Anz': 'bg-sky-500',
  'Other':       'bg-slate-500',
};
const areaColor = (a?: string) => AREA_COLORS[a ?? 'Other'] ?? AREA_COLORS['Other'];
const areaDot   = (a?: string) => AREA_DOT[a ?? 'Other']   ?? AREA_DOT['Other'];

const STATUS_OPTIONS: CustomerInquiry['status'][] = [
  'New',
  'Followed Up',
  'Interested',
  'Converted',
  'Not Interested',
];

const STATUS_COLORS: Record<string, string> = {
  'New':            'bg-amber-50 text-amber-800 border-amber-300',
  'Followed Up':    'bg-sky-50 text-sky-800 border-sky-300',
  'Interested':     'bg-purple-50 text-purple-800 border-purple-300',
  'Converted':      'bg-emerald-50 text-emerald-800 border-emerald-300',
  'Not Interested': 'bg-slate-100 text-slate-600 border-slate-300',
};

const waPhone = (inq: CustomerInquiry) =>
  formatWhatsAppNumber(inq.whatsappPhone?.trim() || inq.phone);

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
}) => {
  // ── Filter state ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]   = useState('');
  const [areaFilter, setAreaFilter]     = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ── Modal / form state ────────────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen]             = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastAreaFilter, setBroadcastAreaFilter]   = useState<string>('all');
  const [editingInquiry, setEditingInquiry]             = useState<CustomerInquiry | null>(null);

  const todayStr = () => new Date().toLocaleDateString('en-GB').replace(/\//g, '.');

  // ── Core Form Fields ──────────────────────────────────────────────────────────
  const [formName, setFormName]             = useState('');
  const [formPhone, setFormPhone]           = useState('');
  const [formWaPhone, setFormWaPhone]       = useState('');
  const [formLookingFor, setFormLookingFor] = useState<CustomerInquiry['lookingFor']>('Bed Space (Lower)');
  const [formLocation, setFormLocation]     = useState('Al Barsha 1');
  const [formBudget, setFormBudget]         = useState<number>(750);
  const [formStatus, setFormStatus]         = useState<CustomerInquiry['status']>('New');
  const [formNotes, setFormNotes]           = useState('');

  // ── Default WhatsApp Message ──────────────────────────────────────────────────
  const DEFAULT_WHATSAPP_MESSAGE = `Hi! 👋\n\nWe have bed spaces and partition rooms available for rent. If you or anyone you know is looking for accommodation, please feel free to contact us.\n\nKindly let us know your requirements, including the preferred location, budget, and type of accommodation needed. We will be happy to arrange a visit to the apartment so you can check the facilities and choose a suitable option.\n\nPlease feel free to message us anytime. We will do our best to assist you. Thank you! 😊`;

  const [selectedIds, setSelectedIds]             = useState<string[]>([]);
  const [broadcastTemplate, setBroadcastTemplate] = useState(DEFAULT_WHATSAPP_MESSAGE);
  const [broadcastFeedback, setBroadcastFeedback] = useState('');

  // ── Filtered leads ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => inquiries.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
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
        (item.preferredLocation || '').toLowerCase().includes(q) ||
        (item.notes || '').toLowerCase().includes(q)
      );
    }
    return true;
  }), [inquiries, statusFilter, areaFilter, searchQuery]);

  // ── Open Add modal ─────────────────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setEditingInquiry(null);
    setFormName('');
    setFormPhone('');
    setFormWaPhone('');
    setFormLookingFor('Bed Space (Lower)');
    setFormLocation(areaFilter !== 'all' && AREA_OPTIONS.includes(areaFilter as any) ? areaFilter : 'Al Barsha 1');
    setFormBudget(750);
    setFormStatus('New');
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  // ── Open Edit modal ────────────────────────────────────────────────────────────
  const handleOpenEditModal = (item: CustomerInquiry) => {
    setEditingInquiry(item);
    setFormName(item.name);
    setFormPhone(item.phone);
    setFormWaPhone(item.whatsappPhone || '');
    setFormLookingFor(item.lookingFor);
    setFormLocation(
      AREA_OPTIONS.includes((item.preferredLocation || '') as any)
        ? item.preferredLocation!
        : 'Al Barsha 1'
    );
    setFormBudget(item.budget || 0);
    setFormStatus(item.status);
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
      inquiryDate: editingInquiry?.inquiryDate || todayStr(),
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

  // ── Instant 1-Tap Status Save ──────────────────────────────────────────────────
  const handleQuickStatusChange = (item: CustomerInquiry, newStatus: CustomerInquiry['status']) => {
    onUpdateInquiry({
      ...item,
      status: newStatus,
      lastContactedDate: todayStr(),
    });
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
    if (item.status === 'New') {
      onUpdateInquiry({ ...item, status: 'Followed Up', lastContactedDate: todayStr() });
    }
  };

  // ── Broadcast helpers ──────────────────────────────────────────────────────────
  const handleOpenBroadcast = (area?: string) => {
    const targetArea = area || (areaFilter !== 'all' ? areaFilter : 'all');
    const pool = targetArea !== 'all'
      ? inquiries.filter(i => (i.preferredLocation?.trim() || 'Unspecified') === targetArea)
      : filtered;
    setSelectedIds(pool.filter(i => i.status !== 'Converted' && i.status !== 'Not Interested').map(i => i.id));
    setBroadcastAreaFilter(targetArea);
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
    setBroadcastFeedback(`Copied ${selectedIds.length} WhatsApp numbers!`);
    setTimeout(() => setBroadcastFeedback(''), 3500);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(broadcastTemplate);
    setBroadcastFeedback('Message copied!');
    setTimeout(() => setBroadcastFeedback(''), 3500);
  };

  const handleMarkFollowedUp = () => {
    onBatchUpdateStatus(selectedIds, 'Followed Up', todayStr());
    setBroadcastFeedback(`Marked ${selectedIds.length} leads as Followed Up!`);
    setTimeout(() => setBroadcastFeedback(''), 3500);
  };

  return (
    <div className="space-y-3">
      {/* ══ COMPACT TOP CONTROL BAR (Cut, Clear & Mobile-First) ══════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
        {/* Top Row: Title + Primary 1-Tap Buttons */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-[#38CE3C]" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Follow-ups &amp; Leads
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {filtered.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenBroadcast()}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4 text-[#38CE3C] stroke-[2.5]" />
              <span>Add Lead</span>
            </button>
          </div>
        </div>

        {/* Search + Area Filter Pills */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search name or phone..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 1-Tap Area Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setAreaFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition cursor-pointer ${
                areaFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Areas ({inquiries.length})
            </button>
            {AREA_OPTIONS.map(area => {
              const count = inquiries.filter(i => (i.preferredLocation?.trim() || '') === area).length;
              const active = areaFilter === area;
              return (
                <button
                  key={area}
                  onClick={() => setAreaFilter(active ? 'all' : area)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : `${areaColor(area)} hover:opacity-85`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#38CE3C]' : areaDot(area)}`} />
                  <span>{area}</span>
                  <span className="opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5">
          {(['all', 'New', 'Followed Up', 'Interested', 'Converted', 'Not Interested'] as const).map(st => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border shrink-0 transition cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st === 'all' ? 'All Status' : st}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ CORE ACTION LIST (Mobile Cards + Clean Desktop Table) ════════════════ */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm font-bold text-slate-700">No leads found</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#38CE3C]" />
            <span>Add New Lead</span>
          </button>
        </div>
      ) : (
        <>
          {/* ── MOBILE VIEW: Compact Core Action Cards (`md:hidden`) ── */}
          <div className="md:hidden space-y-2.5">
            {filtered.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5"
              >
                {/* Row 1: Name + Phone + Instant Status Select */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">
                      {item.name}
                    </h4>
                    <a
                      href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold text-slate-700 mt-0.5 hover:text-indigo-600"
                    >
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{item.phone}</span>
                    </a>
                  </div>

                  {/* 1-Tap Instant Status Dropdown */}
                  <select
                    value={item.status}
                    onChange={e => handleQuickStatusChange(item, e.target.value as CustomerInquiry['status'])}
                    aria-label="Lead Status"
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                      STATUS_COLORS[item.status] || 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {STATUS_OPTIONS.map(st => (
                      <option key={st} value={st} className="bg-white text-slate-900">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 2: Area + Room Type + Budget */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border ${areaColor(item.preferredLocation)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${areaDot(item.preferredLocation)}`} />
                    {item.preferredLocation || 'Al Barsha 1'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {item.lookingFor}
                  </span>
                  {(item.budget ?? 0) > 0 && (
                    <span className="px-2 py-0.5 rounded-md font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      AED {item.budget}
                    </span>
                  )}
                </div>

                {item.notes && (
                  <p className="text-xs text-slate-500 truncate">
                    {item.notes}
                  </p>
                )}

                {/* Row 3: 1-Tap Action Bar (WhatsApp, Call, Edit, Delete) */}
                <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSingleWhatsApp(item)}
                    className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-2xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <a
                    href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                    className="flex items-center justify-center gap-1 py-2 px-2 bg-slate-100 active:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-200"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>Call</span>
                  </a>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="flex-1 flex items-center justify-center py-2 bg-slate-100 active:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete ${item.name}?`)) onDeleteInquiry(item.id);
                      }}
                      className="flex-1 flex items-center justify-center py-2 bg-rose-50 active:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── DESKTOP VIEW: Clean 6-Column Core Table (`hidden md:block`) ── */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Area &amp; Room</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Status (1-Tap)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{item.name}</div>
                      {item.notes && (
                        <div className="text-[11px] font-normal text-slate-500 truncate max-w-xs">
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      <a href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-indigo-600">
                        {item.phone}
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${areaColor(item.preferredLocation)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${areaDot(item.preferredLocation)}`} />
                          {item.preferredLocation || 'Al Barsha 1'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.lookingFor}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      {item.budget ? `AED ${item.budget}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={item.status}
                        onChange={e => handleQuickStatusChange(item, e.target.value as CustomerInquiry['status'])}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                          STATUS_COLORS[item.status] || 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {STATUS_OPTIONS.map(st => (
                          <option key={st} value={st} className="bg-white text-slate-900">
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleSingleWhatsApp(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${item.name}?`)) onDeleteInquiry(item.id);
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══ STREAMLINED ADD / EDIT MODAL (Core Action Box Only) ══════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between shrink-0">
              <h3 className="text-sm sm:text-base font-bold">
                {editingInquiry ? 'Edit Lead' : 'Add Lead'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Fields Form */}
            <form id="inquiry-form" onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {/* 1. Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* 2. Phone / WhatsApp */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone / WhatsApp Number *</label>
                <div className="flex rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-slate-900">
                  <span className="inline-flex items-center px-3 bg-slate-100 text-slate-700 text-xs font-bold border-r border-slate-200 select-none">
                    +971
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="50 123 4567"
                    className="w-full px-3 py-2.5 text-sm text-slate-900 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* 3. Preferred Area (4 1-Tap Buttons) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Area *</label>
                <div className="grid grid-cols-2 gap-2">
                  {AREA_OPTIONS.map(a => {
                    const isSelected = formLocation === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setFormLocation(a)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#38CE3C]' : AREA_DOT[a]}`} />
                        <span>{a}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Room Type & Budget */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Room Type</label>
                  <select
                    value={formLookingFor}
                    onChange={e => setFormLookingFor(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:bg-white focus:outline-none"
                  >
                    <option value="Bed Space (Lower)">Bed Space (Lower)</option>
                    <option value="Bed Space (Upper)">Bed Space (Upper)</option>
                    <option value="Partition">Partition</option>
                    <option value="Private Room">Private Room</option>
                    <option value="Any">Any</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Budget (AED)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formBudget || ''}
                    onChange={e => setFormBudget(Number(e.target.value))}
                    placeholder="750"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-extrabold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* 5. Status & Short Note */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:bg-white focus:outline-none"
                  >
                    {STATUS_OPTIONS.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Short Note</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder="Optional note..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="inquiry-form"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                {editingInquiry ? 'Save' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ WHATSAPP BROADCAST MODAL ═════════════════════════════════════════════ */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-[#38CE3C]" />
                <h3 className="text-sm sm:text-base font-bold">
                  WhatsApp Broadcast ({selectedIds.length} selected)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {broadcastFeedback && (
                <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{broadcastFeedback}</span>
                </div>
              )}

              {/* Area selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setBroadcastAreaFilter('all');
                    setSelectedIds(filtered.filter(i => i.status !== 'Converted' && i.status !== 'Not Interested').map(i => i.id));
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    broadcastAreaFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  All Areas
                </button>
                {AREA_OPTIONS.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => {
                      setBroadcastAreaFilter(area);
                      const areaLeads = inquiries.filter(i => (i.preferredLocation?.trim() || '') === area);
                      setSelectedIds(areaLeads.filter(i => i.status !== 'Converted' && i.status !== 'Not Interested').map(i => i.id));
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      broadcastAreaFilter === area ? 'bg-slate-900 text-white border-slate-900' : `${areaColor(area)}`
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>

              {/* Message Box */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">WhatsApp Message</label>
                <textarea
                  rows={5}
                  value={broadcastTemplate}
                  onChange={e => setBroadcastTemplate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Recipients */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700">
                    Recipients ({selectedIds.length} / {broadcastPool.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs font-bold text-indigo-600 cursor-pointer"
                  >
                    {selectedIds.length === broadcastPool.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                  {broadcastPool.map(inq => {
                    const isSelected = selectedIds.includes(inq.id);
                    return (
                      <div
                        key={inq.id}
                        onClick={() => handleToggleSelect(inq.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                          isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={isSelected} onChange={() => {}} className="rounded text-indigo-600" />
                          <span className="font-bold text-slate-900">{inq.name}</span>
                          <span className="text-slate-500 font-mono text-[11px]">{inq.phone}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${areaColor(inq.preferredLocation)}`}>
                          {inq.preferredLocation}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 1-Tap Broadcast Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyNumbers}
                  disabled={selectedIds.length === 0}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Numbers</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Message</span>
                </button>
                <button
                  type="button"
                  onClick={handleMarkFollowedUp}
                  disabled={selectedIds.length === 0}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-40 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Followed Up</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

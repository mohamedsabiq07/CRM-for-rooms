import React, { useState } from 'react';
import { 
  Users, 
  Phone, 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit3, 
  Send, 
  Copy, 
  ExternalLink, 
  UserCheck, 
  UserX, 
  HelpCircle,
  X,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { CustomerInquiry } from '../types/crm';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [requirementFilter, setRequirementFilter] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<CustomerInquiry | null>(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDate, setFormDate] = useState(() => {
    return new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
  });
  const [formLookingFor, setFormLookingFor] = useState<CustomerInquiry['lookingFor']>('Bed Space (Lower)');
  const [formLocation, setFormLocation] = useState('Al Barsha 1');
  const [formBudget, setFormBudget] = useState<number>(750);
  const [formStatus, setFormStatus] = useState<CustomerInquiry['status']>('New');
  const [formNotes, setFormNotes] = useState('');

  // Bulk Broadcast State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [broadcastTemplate, setBroadcastTemplate] = useState(
    `Hi {name}, hope you are doing well! Are you still looking for a {lookingFor} in Dubai for ${selectedMonth}? We have clean, fully furnished spaces available starting from AED 650/month with DEWA, high-speed Wi-Fi, and cleaning included. Please let me know if you would like to view or reserve today! - Mohamed Room Management`
  );
  const [broadcastFeedback, setBroadcastFeedback] = useState('');

  // KPIs
  const totalLeads = inquiries.length;
  const newLeads = inquiries.filter(i => i.status === 'New').length;
  const followedUpLeads = inquiries.filter(i => i.status === 'Followed Up').length;
  const interestedLeads = inquiries.filter(i => i.status === 'Interested').length;
  const convertedLeads = inquiries.filter(i => i.status === 'Converted').length;

  // Filtered List
  const filteredInquiries = inquiries.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (requirementFilter !== 'all' && item.lookingFor !== requirementFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.preferredLocation && item.preferredLocation.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingInquiry(null);
    setFormName('');
    setFormPhone('+971 ');
    setFormDate(new Date().toLocaleDateString('en-GB').replace(/\//g, '.'));
    setFormLookingFor('Bed Space (Lower)');
    setFormLocation('Al Barsha 1');
    setFormBudget(750);
    setFormStatus('New');
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: CustomerInquiry) => {
    setEditingInquiry(item);
    setFormName(item.name);
    setFormPhone(item.phone);
    setFormDate(item.inquiryDate);
    setFormLookingFor(item.lookingFor);
    setFormLocation(item.preferredLocation || 'Al Barsha 1');
    setFormBudget(item.budget || 0);
    setFormStatus(item.status);
    setFormNotes(item.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    if (editingInquiry) {
      const updated: CustomerInquiry = {
        ...editingInquiry,
        name: formName.trim(),
        phone: formPhone.trim(),
        inquiryDate: formDate,
        lookingFor: formLookingFor,
        preferredLocation: formLocation,
        budget: Number(formBudget) || 0,
        status: formStatus,
        notes: formNotes.trim(),
      };
      onUpdateInquiry(updated);
    } else {
      const created: CustomerInquiry = {
        id: `inq-${Date.now()}`,
        name: formName.trim(),
        phone: formPhone.trim(),
        inquiryDate: formDate,
        lookingFor: formLookingFor,
        preferredLocation: formLocation,
        budget: Number(formBudget) || 0,
        status: formStatus,
        notes: formNotes.trim(),
      };
      onAddInquiry(created);
    }
    setIsAddModalOpen(false);
  };

  // WhatsApp Helpers
  const formatWhatsAppMessage = (item: CustomerInquiry) => {
    return broadcastTemplate
      .replace(/\{name\}/g, item.name)
      .replace(/\{lookingFor\}/g, item.lookingFor)
      .replace(/\{month\}/g, selectedMonth)
      .replace(/\{budget\}/g, String(item.budget || ''));
  };

  const handleSingleWhatsApp = (item: CustomerInquiry) => {
    const cleanPhone = item.phone.replace(/[^0-9]/g, '');
    const message = formatWhatsAppMessage(item);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    // Automatically update status to Followed Up
    const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
    onUpdateInquiry({
      ...item,
      status: 'Followed Up',
      lastContactedDate: todayStr,
    });
  };

  const handleOpenBroadcastModal = () => {
    // Select all non-converted, non-not-interested inquiries by default
    const defaultSelected = filteredInquiries
      .filter(i => i.status !== 'Converted' && i.status !== 'Not Interested')
      .map(i => i.id);
    setSelectedIds(defaultSelected);
    setIsBroadcastModalOpen(true);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredInquiries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInquiries.map(i => i.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCopyNumbers = () => {
    const selectedLeads = inquiries.filter(i => selectedIds.includes(i.id));
    const numbers = selectedLeads.map(i => i.phone.replace(/[^0-9+]/g, '')).join(', ');
    navigator.clipboard.writeText(numbers);
    setBroadcastFeedback(`Copied ${selectedLeads.length} phone numbers to clipboard!`);
    setTimeout(() => setBroadcastFeedback(''), 4000);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(broadcastTemplate);
    setBroadcastFeedback('Copied broadcast template message to clipboard!');
    setTimeout(() => setBroadcastFeedback(''), 4000);
  };

  const handleMarkAllFollowedUp = () => {
    const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
    onBatchUpdateStatus(selectedIds, 'Followed Up', todayStr);
    setBroadcastFeedback(`Marked ${selectedIds.length} customer inquiries as Followed Up!`);
    setTimeout(() => setBroadcastFeedback(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-widest">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Customer Inquiries & Lead Pipeline</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Follow-Up & Month-End WhatsApp Broadcast
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Track leads looking for bed spaces or partitions. Send bulk WhatsApp follow-up messages at month-end to fill vacancies quickly.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-sm transition cursor-pointer border border-indigo-500"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Customer Inquiry</span>
            </button>

            <button
              onClick={handleOpenBroadcastModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs shadow-sm transition cursor-pointer border border-emerald-500"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              <span>Month-End WhatsApp Broadcast</span>
            </button>
          </div>
        </div>

        {/* Lead KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Inquiries
            </span>
            <span className="text-xl font-bold text-white mt-0.5 block">{totalLeads}</span>
            <span className="text-[11px] text-slate-400">All registered leads</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">
              New Inquiries
            </span>
            <span className="text-xl font-bold text-amber-300 mt-0.5 block">{newLeads}</span>
            <span className="text-[11px] text-slate-400">Pending first contact</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider block">
              Followed Up
            </span>
            <span className="text-xl font-bold text-sky-300 mt-0.5 block">{followedUpLeads}</span>
            <span className="text-[11px] text-slate-400">Contacted via WhatsApp</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider block">
              Interested
            </span>
            <span className="text-xl font-bold text-purple-300 mt-0.5 block">{interestedLeads}</span>
            <span className="text-[11px] text-slate-400">Viewing scheduled</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
              Converted
            </span>
            <span className="text-xl font-bold text-emerald-300 mt-0.5 block">{convertedLeads}</span>
            <span className="text-[11px] text-slate-400">Moved in as tenants</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, phone, notes..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {['all', 'New', 'Followed Up', 'Interested', 'Converted', 'Not Interested'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? 'All Leads' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Requirement Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Looking For:</span>
          <select
            value={requirementFilter}
            onChange={(e) => setRequirementFilter(e.target.value)}
            className="bg-slate-50 text-xs font-medium text-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Any Requirement</option>
            <option value="Bed Space (Lower)">Bed Space (Lower)</option>
            <option value="Bed Space (Upper)">Bed Space (Upper)</option>
            <option value="Partition">Partition</option>
            <option value="Private Room">Private Room</option>
          </select>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs">
                <th className="py-2.5 px-3 border-r border-slate-200/60 min-w-[150px]">Customer Name</th>
                <th className="py-2.5 px-3 border-r border-slate-200/60 min-w-[130px]">Phone Number</th>
                <th className="py-2.5 px-3 border-r border-slate-200/60 text-center min-w-[100px]">Inquiry Date</th>
                <th className="py-2.5 px-3 border-r border-slate-200/60 min-w-[140px]">Looking For</th>
                <th className="py-2.5 px-3 border-r border-slate-200/60 text-center min-w-[90px]">Budget</th>
                <th className="py-2.5 px-3 border-r border-slate-200/60 text-center min-w-[120px]">Status</th>
                <th className="py-2.5 px-3 border-r border-slate-200/60 min-w-[160px]">Notes</th>
                <th className="py-2.5 px-3 text-center min-w-[180px]">Quick Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/70">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <span>No customer inquiries match your filter criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((item) => {
                  const statusColors: Record<string, string> = {
                    'New': 'bg-amber-50 text-amber-800 border-amber-200',
                    'Followed Up': 'bg-sky-50 text-sky-800 border-sky-200',
                    'Interested': 'bg-purple-50 text-purple-800 border-purple-200',
                    'Converted': 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    'Not Interested': 'bg-slate-100 text-slate-600 border-slate-200',
                  };

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      {/* Name */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60 font-bold text-slate-900">
                        {item.name}
                        {item.preferredLocation && (
                          <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                            Prefers: {item.preferredLocation}
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60 text-slate-700 font-medium">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.phone}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60 text-center text-slate-600 text-xs">
                        {item.inquiryDate}
                        {item.lastContactedDate && (
                          <span className="block text-[10px] text-slate-400">
                            Last: {item.lastContactedDate}
                          </span>
                        )}
                      </td>

                      {/* Looking For */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                          {item.lookingFor}
                        </span>
                      </td>

                      {/* Budget */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60 text-center font-bold text-slate-900">
                        {item.budget ? `AED ${item.budget}` : '-'}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[item.status] || 'bg-slate-100 text-slate-700'}`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-2.5 px-3 border-r border-slate-200/60 text-slate-600 text-xs">
                        {item.notes || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Send WhatsApp */}
                          <button
                            onClick={() => handleSingleWhatsApp(item)}
                            title="Send personalized follow-up WhatsApp message"
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold transition cursor-pointer shadow-2xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit inquiry details"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteInquiry(item.id)}
                            title="Delete inquiry"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT INQUIRY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm sm:text-base font-bold">
                  {editingInquiry ? 'Edit Customer Inquiry' : 'Add New Customer Inquiry'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block">WhatsApp / Phone *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+971 50 ..."
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block">Inquiry Date</label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="DD.MM.YYYY"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block">Looking For</label>
                  <select
                    value={formLookingFor}
                    onChange={(e) => setFormLookingFor(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Bed Space (Lower)">Bed Space (Lower Bed)</option>
                    <option value="Bed Space (Upper)">Bed Space (Upper Bed)</option>
                    <option value="Partition">Partition</option>
                    <option value="Private Room">Private Room</option>
                    <option value="Any">Any / Flexible</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block">Preferred Area / Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Al Barsha 1 or Deira"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block">Budget (AED)</label>
                  <input
                    type="number"
                    value={formBudget || ''}
                    onChange={(e) => setFormBudget(Number(e.target.value))}
                    placeholder="e.g. 700"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="New">New Inquiry</option>
                  <option value="Followed Up">Followed Up</option>
                  <option value="Interested">Interested (Visiting)</option>
                  <option value="Converted">Converted (Moved In)</option>
                  <option value="Not Interested">Not Interested</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block">Notes & Requirements</label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. needs move-in by next week, working in Dubai Media City, asked for lower bed..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm transition cursor-pointer"
                >
                  {editingInquiry ? 'Save Changes' : 'Create Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MONTH-END BULK WHATSAPP BROADCAST MODAL */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Month-End WhatsApp Follow-Up Broadcast</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Send follow-up messages all at once to leads inquiring about rooms and bedspaces.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {broadcastFeedback && (
                <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{broadcastFeedback}</span>
                </div>
              )}

              {/* Message Template Editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 block">WhatsApp Message Template</label>
                  <span className="text-[10px] text-slate-400">Variables: {'{name}'}, {'{lookingFor}'}, {'{month}'}</span>
                </div>
                <textarea
                  rows={4}
                  value={broadcastTemplate}
                  onChange={(e) => setBroadcastTemplate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-sans focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Recipients Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700">
                    Selected Recipients ({selectedIds.length} of {filteredInquiries.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {selectedIds.length === filteredInquiries.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                  {filteredInquiries.map((inq) => {
                    const isSelected = selectedIds.includes(inq.id);
                    return (
                      <div
                        key={inq.id}
                        onClick={() => handleToggleSelect(inq.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-indigo-600"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{inq.name}</span>
                            <span className="text-[10px] text-slate-500">{inq.phone} • {inq.lookingFor}</span>
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {inq.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-800 block">Broadcast Launch Options:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Option 1: Copy Numbers */}
                  <button
                    type="button"
                    onClick={handleCopyNumbers}
                    disabled={selectedIds.length === 0}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded-lg shadow-2xs transition disabled:opacity-40 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copy {selectedIds.length} Numbers</span>
                  </button>

                  {/* Option 2: Copy Message */}
                  <button
                    type="button"
                    onClick={handleCopyTemplate}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copy Message</span>
                  </button>

                  {/* Option 3: Mark All Followed Up */}
                  <button
                    type="button"
                    onClick={handleMarkAllFollowedUp}
                    disabled={selectedIds.length === 0}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-40 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Followed Up</span>
                  </button>
                </div>

                <div className="pt-2 text-[10px] text-slate-500">
                  Tip: Use <b>"Copy Numbers"</b> to create a WhatsApp Broadcast List on your mobile device, or click <b>"WhatsApp"</b> on individual leads to open 1-click personalized chats!
                </div>
              </div>

            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

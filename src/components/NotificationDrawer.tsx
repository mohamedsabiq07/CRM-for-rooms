import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  PhoneCall, 
  MessageSquare, 
  CheckCircle2, 
  Calendar, 
  AlertTriangle,
  Clock,
  Zap,
  Wifi,
  CreditCard,
  Building2,
  DoorOpen
} from 'lucide-react';
import { RentNotification, OwnerChequeNotification, UtilityNotification } from '../types/crm';
import { generateWhatsAppLink } from '../utils/dateUtils';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tenantNotifications: RentNotification[];
  chequeNotifications: OwnerChequeNotification[];
  utilityNotifications: UtilityNotification[];
  onMarkTenantPaid: (tenantId: string) => void;
  onMarkUtilityPaid: (roomId: string, type: 'DEWA' | 'Wi-Fi') => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  tenantNotifications,
  chequeNotifications,
  utilityNotifications,
  onMarkTenantPaid,
  onMarkUtilityPaid,
}) => {
  if (!isOpen) return null;

  const [filterTab, setFilterTab] = useState<'all' | 'tenants' | 'cheques' | 'utilities'>('all');

  const totalCount = tenantNotifications.length + chequeNotifications.length + utilityNotifications.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500 text-slate-950 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">Property Deadlines & Alerts</h2>
                <p className="text-xs text-slate-400">
                  {totalCount} total item{totalCount === 1 ? '' : 's'} requiring follow-up
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert Category Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-2 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setFilterTab('all')}
              className={`pb-2 px-2 border-b-2 transition ${
                filterTab === 'all' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilterTab('tenants')}
              className={`pb-2 px-2 border-b-2 transition flex items-center gap-1 ${
                filterTab === 'tenants' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500'
              }`}
            >
              <span>Tenants Rent</span>
              <span className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded text-[10px]">
                {tenantNotifications.length}
              </span>
            </button>
            <button
              onClick={() => setFilterTab('cheques')}
              className={`pb-2 px-2 border-b-2 transition flex items-center gap-1 ${
                filterTab === 'cheques' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500'
              }`}
            >
              <span>Owner Cheques</span>
              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded text-[10px]">
                {chequeNotifications.length}
              </span>
            </button>
            <button
              onClick={() => setFilterTab('utilities')}
              className={`pb-2 px-2 border-b-2 transition flex items-center gap-1 ${
                filterTab === 'utilities' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500'
              }`}
            >
              <span>DEWA & Wi-Fi</span>
              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded text-[10px]">
                {utilityNotifications.length}
              </span>
            </button>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {totalCount === 0 ? (
              <div className="text-center py-16 px-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                <h3 className="text-base font-bold text-slate-800">All Accounts & Bills Up to Date!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  No tenant rent, owner cheques, or utility bills currently due.
                </p>
              </div>
            ) : (
              <>
                {/* 1. OWNER CHEQUES SECTION */}
                {(filterTab === 'all' || filterTab === 'cheques') && chequeNotifications.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <span>Owner Rent Cheques Due ({chequeNotifications.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {chequeNotifications.map((c) => (
                        <div
                          key={c.buildingId}
                          className="bg-amber-50 border border-amber-300/80 p-3.5 rounded-2xl"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-slate-900">{c.buildingName}</span>
                                <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded">
                                  {c.paymentTerms}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Owner: {c.ownerName || 'Landlord'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black text-amber-950">
                                AED {c.amount.toLocaleString()}
                              </span>
                              <p className="text-[10px] font-bold text-rose-600">
                                Due: {c.dueDate}
                              </p>
                            </div>
                          </div>

                          {c.ownerPhone && (
                            <div className="mt-3 pt-2.5 border-t border-amber-200 flex justify-end">
                              <a
                                href={`tel:${c.ownerPhone.replace(/\s+/g, '')}`}
                                className="flex items-center gap-1 text-xs font-bold px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
                              >
                                <PhoneCall className="w-3 h-3" />
                                <span>Call Owner / Agent</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. UTILITY BILLS SECTION */}
                {(filterTab === 'all' || filterTab === 'utilities') && utilityNotifications.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <span>Room Utility Bills Due ({utilityNotifications.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {utilityNotifications.map((u, idx) => (
                        <div
                          key={`${u.roomId}-${u.type}-${idx}`}
                          className="bg-blue-50/70 border border-blue-200 p-3 rounded-2xl flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              {u.type === 'DEWA' ? (
                                <span className="p-1 bg-amber-100 text-amber-800 rounded">
                                  <Zap className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="p-1 bg-blue-100 text-blue-800 rounded">
                                  <Wifi className="w-3.5 h-3.5" />
                                </span>
                              )}
                              <span className="text-xs font-bold text-slate-900">
                                {u.type} • Room {u.roomNumber}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {u.buildingName} • Acc: {u.accountNumber || '-'}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-extrabold text-slate-900 block">
                              AED {u.amount}
                            </span>
                            <span className="text-[10px] text-rose-600 font-semibold block">
                              Due {u.dueDate}
                            </span>
                            <button
                              onClick={() => onMarkUtilityPaid(u.roomId, u.type)}
                              className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-blue-300 text-blue-800 hover:bg-blue-100 transition"
                            >
                              Mark Paid
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. TENANT 30-DAY RENT SECTION */}
                {(filterTab === 'all' || filterTab === 'tenants') && tenantNotifications.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-rose-600" />
                      <span>Tenant 30-Day Rent Due ({tenantNotifications.length})</span>
                    </h3>
                    <div className="space-y-2.5">
                      {tenantNotifications.map((item) => {
                        const isOverdue = item.status === 'overdue';
                        const waUrl = generateWhatsAppLink(
                          item.phone,
                          item.tenantName,
                          item.buildingName,
                          item.partition,
                          item.rentAmount,
                          isOverdue ? `${Math.abs(item.daysDiff)} days overdue` : 'Rent Cycle'
                        );

                        return (
                          <div
                            key={item.tenantId}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              isOverdue 
                                ? 'bg-rose-50/60 border-rose-200' 
                                : 'bg-amber-50/60 border-amber-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-900">{item.tenantName}</h4>
                                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-900 text-amber-300 uppercase">
                                    {item.partition}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {item.buildingName} • Room {item.roomNumber} ({item.section})
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-sm font-extrabold text-slate-900">
                                  AED {item.rentAmount}
                                </span>
                                <p className={`text-[10px] font-semibold ${isOverdue ? 'text-rose-600' : 'text-amber-600'}`}>
                                  {isOverdue ? `${Math.abs(item.daysDiff)}d overdue` : 'Due today'}
                                </p>
                              </div>
                            </div>

                            {item.remarks && (
                              <div className="mt-2 text-[11px] text-amber-800 bg-amber-100/70 px-2 py-1 rounded italic">
                                "{item.remarks}"
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <a
                                  href={`tel:${item.phone.replace(/\s+/g, '')}`}
                                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  <span>Call</span>
                                </a>

                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </a>
                              </div>

                              <button
                                onClick={() => onMarkTenantPaid(item.tenantId)}
                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Mark Paid</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
            Real-time tracking of Dubai tenant rent, property cheques, and DEWA/Wi-Fi utility bills.
          </div>
        </div>
      </div>
    </div>
  );
};

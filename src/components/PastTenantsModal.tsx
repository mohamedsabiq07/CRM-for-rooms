import React, { useState } from 'react';
import { X, History, Search, Calendar, User, Key, CheckCircle2 } from 'lucide-react';
import { Tenant, Building, RoomUnit } from '../types/crm';

interface PastTenantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastTenants: Tenant[];
  buildings: Building[];
  rooms: RoomUnit[];
}

export const PastTenantsModal: React.FC<PastTenantsModalProps> = ({
  isOpen,
  onClose,
  pastTenants,
  buildings,
  rooms,
}) => {
  if (!isOpen) return null;

  const [search, setSearch] = useState('');

  const filtered = pastTenants.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.place.toLowerCase().includes(q) ||
      t.partition.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-white rounded-lg border border-slate-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Past Tenants & Vacated History</h3>
              <p className="text-xs text-slate-400">
                {pastTenants.length} past stay record{pastTenants.length === 1 ? '' : 's'} archived
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search past tenant by name, nationality, or room..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
            />
          </div>
        </div>

        {/* List */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              No past checked-out tenants found. When tenants check out, their full stay history and refund receipts appear here.
            </div>
          ) : (
            filtered.map((t) => {
              const bld = buildings.find(b => b.id === t.buildingId);
              const rm = rooms.find(r => r.id === t.roomId);
              const co = t.checkOutRecord;

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                          {t.place || 'Tenant'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300 uppercase">
                          {t.partition}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {bld?.name || 'Building'} • Room {rm?.roomNumber || 'Unit'} ({t.section}) • {t.bedType || 'Bed Space'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800 block">
                        Stayed: {co?.stayDuration || 'Completed'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {t.joiningDate} ➔ {co?.checkOutDate || t.leavingDate || 'Vacated'}
                      </span>
                    </div>
                  </div>

                  {/* Give Back & Key Settlement Breakdown */}
                  {co && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Deposit Held:</span>
                        <span className="font-bold text-slate-700">AED {co.originalDeposit}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Key Status:</span>
                        <span className={`font-semibold ${
                          co.keyReturnedDoor && co.keyReturnedCupboard ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {co.lostKeyCharges > 0 ? `-AED ${co.lostKeyCharges} fee` : 'Both Keys Returned'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Rent / Damages:</span>
                        <span className="font-semibold text-slate-700">
                          {co.unpaidRentDeduction + co.damageCharges > 0 
                            ? `-AED ${co.unpaidRentDeduction + co.damageCharges}` 
                            : 'None (Clear)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold">Give Back Refund:</span>
                        <span className="font-bold text-emerald-700">
                          AED {co.giveBackAmount}
                        </span>
                      </div>
                    </div>
                  )}

                  {co?.notes && (
                    <p className="mt-2 text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                      "{co.notes}"
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

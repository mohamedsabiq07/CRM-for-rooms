import React, { useState } from 'react';
import { X, Building2, MapPin, DollarSign, Calendar, Phone, Plus } from 'lucide-react';
import { LocationItem, Building, PaymentTermsType } from '../types/crm';

interface AddBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationItem[];
  onAddBuilding: (
    building: Omit<Building, 'id'>, 
    initialRooms: { roomNumber: string; roomType: string }[]
  ) => void;
}

export const AddBuildingModal: React.FC<AddBuildingModalProps> = ({
  isOpen,
  onClose,
  locations,
  onAddBuilding,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState(locations[0]?.id || 'loc-barsha');
  const [address, setAddress] = useState('Al Barsha 1, Dubai');
  const [ownerRentAnnual, setOwnerRentAnnual] = useState('78000');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermsType>('Quarterly');
  const [nextChequeDueDate, setNextChequeDueDate] = useState('15.10.2026');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('+971 4 ');
  const [notes, setNotes] = useState('');

  // Initial Rooms
  const [room1, setRoom1] = useState('103');
  const [room2, setRoom2] = useState('601');

  const annualNum = Number(ownerRentAnnual) || 0;
  const chequeAmount = 
    paymentTerms === 'Quarterly' ? Math.round(annualNum / 4) :
    paymentTerms === 'Semi-Annually' ? Math.round(annualNum / 2) :
    paymentTerms === 'Monthly' ? Math.round(annualNum / 12) : annualNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initialRooms: { roomNumber: string; roomType: string }[] = [];
    if (room1.trim()) initialRooms.push({ roomNumber: room1.trim(), roomType: 'Partition Flat' });
    if (room2.trim()) initialRooms.push({ roomNumber: room2.trim(), roomType: 'Partition Flat' });

    onAddBuilding({
      name: name.trim(),
      locationId,
      address: address.trim(),
      ownerRentAnnual: annualNum,
      paymentTerms,
      chequeAmount,
      nextChequeDueDate: nextChequeDueDate.trim(),
      ownerName: ownerName.trim() || 'Property Owner',
      ownerPhone: ownerPhone.trim(),
      notes: notes.trim()
    }, initialRooms);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Add New Building & Rooms</h3>
              <p className="text-xs text-slate-400">Configure owner contract rent, payment terms, and room units</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Building Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Building Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vienna Building, Al Murad Tower"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Location / Area
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Building Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Al Barsha 1, Near Mall of the Emirates"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Owner Contract Rent & Terms */}
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-amber-600" />
              Owner Contract & Payment Terms
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Annual Rent to Owner (AED)
                </label>
                <input
                  type="number"
                  required
                  value={ownerRentAnnual}
                  onChange={(e) => setOwnerRentAnnual(e.target.value)}
                  placeholder="78000"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value as any)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold"
                >
                  <option value="Quarterly">Quarterly (4 Cheques)</option>
                  <option value="Semi-Annually">Semi-Annually (2 Cheques)</option>
                  <option value="Annually">Annually (1 Cheque)</option>
                  <option value="Monthly">Monthly (12 Cheques)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Per Cheque Amount
                </label>
                <div className="px-3 py-2 bg-amber-100/80 border border-amber-300 rounded-lg text-sm font-extrabold text-amber-950">
                  AED {chequeAmount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Next Owner Cheque Due Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={nextChequeDueDate}
                    onChange={(e) => setNextChequeDueDate(e.target.value)}
                    placeholder="15.10.2026"
                    className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Owner / Real Estate Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+971 4..."
                    className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Initial Room Numbers */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Room Numbers in this Building (e.g. 2 Rooms)
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Each room tracks its own DEWA & Wi-Fi bills and partition tenants.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Room #1</label>
                <input
                  type="text"
                  value={room1}
                  onChange={(e) => setRoom1(e.target.value)}
                  placeholder="e.g. 103"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Room #2</label>
                <input
                  type="text"
                  value={room2}
                  onChange={(e) => setRoom2(e.target.value)}
                  placeholder="e.g. 601"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Building & Rooms</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

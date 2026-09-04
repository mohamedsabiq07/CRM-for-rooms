export interface LocationItem {
  id: string;
  name: string;
  city: string;
}

export type PaymentTermsType = 'Quarterly' | 'Semi-Annually' | 'Annually' | 'Monthly';

export interface UtilityBill {
  provider?: string; // e.g. "DEWA" or "Du" / "Etisalat"
  accountNumber: string;
  amount: number;
  dueDate: string; // DD.MM.YYYY
  status: 'Paid' | 'Due' | 'Overdue';
  lastPaidDate?: string;
  notes?: string;
}

export interface RoomUnit {
  id: string;
  buildingId: string;
  roomNumber: string; // e.g. "103", "601"
  roomType: string; // e.g. "Partition Flat", "Master Bedspace", "Studio"
  dewaBill: UtilityBill;
  wifiBill: UtilityBill;
  notes?: string;
}

export interface Building {
  id: string;
  name: string; // e.g. "Vienna Building"
  locationId: string;
  address: string;
  ownerRentAnnual: number; // e.g. 78000 AED/year
  paymentTerms: PaymentTermsType; // Quarterly, Annually, etc.
  chequeAmount: number; // e.g. 19500 for quarterly
  nextChequeDueDate: string; // DD.MM.YYYY
  ownerName: string;
  ownerPhone: string;
  notes?: string;
}

// Backward compatibility alias
export type FlatItem = Building;

export interface PaymentRecord {
  id: string;
  tenantId: string;
  month: string; // e.g. "Sep-2026"
  amountPaid: number;
  datePaid: string;
  balance: number;
  status: 'Paid' | 'Partial' | 'Pending';
  remarks?: string;
}

export interface Tenant {
  id: string;
  sno: number;
  buildingId: string;
  roomId: string;
  flatId?: string; // for backward compatibility
  name: string;
  place: string; // e.g., Karnataka, Malayali, Indonesia, Tamil, Srilankan
  phone: string;
  deposit: number; // 0 if no advance
  depositNote?: string; // "No Advance", etc.
  joiningDate: string; // DD.MM.YYYY format
  leavingDate?: string | null;
  status: 'Active' | 'Vacated';
  section: string; // "HALL" or "ROOM"
  partition: string; // "p1", "p2", "p3", "p4", "p5", "p6", "p8" etc.
  rentAmount: number; // monthly rent in AED
  cupboardKey: boolean; // Cu/k
  doorKey: boolean; // D/k
  currentMonthStatus: 'Paid' | 'Pending' | 'Due' | 'Partial'; // e.g. Sep-26
  remarks: string; // "she has money", "she will do it before 10th", "she came at night", "500 balance"
  lastPaidDate?: string;
  history?: PaymentRecord[];
}

export interface RentNotification {
  tenantId: string;
  tenantName: string;
  buildingName: string;
  roomNumber: string;
  flatName?: string;
  partition: string;
  section: string;
  phone: string;
  place: string;
  rentAmount: number;
  dueDate: string;
  daysDiff: number; // negative = overdue, 0 = today, positive = due in X days
  status: 'overdue' | 'due_today' | 'due_soon';
  remarks: string;
}

export interface OwnerChequeNotification {
  buildingId: string;
  buildingName: string;
  ownerName: string;
  ownerPhone: string;
  amount: number;
  dueDate: string;
  paymentTerms: PaymentTermsType;
  daysDiff: number;
  status: 'overdue' | 'due_today' | 'due_soon';
}

export interface UtilityNotification {
  roomId: string;
  buildingName: string;
  roomNumber: string;
  type: 'DEWA' | 'Wi-Fi';
  accountNumber: string;
  amount: number;
  dueDate: string;
  daysDiff: number;
  status: 'overdue' | 'due_today' | 'due_soon';
}

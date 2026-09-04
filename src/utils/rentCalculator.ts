import { parseFlexibleDate } from './dateUtils';

export interface ProRataResult {
  joiningDate: Date;
  monthlyRent: number;
  dailyRate: number;
  daysRemainingInMonth: number;
  proRataAmount: number;
  calendarMonthNextBillingDate: string;
  thirtyDayCycleEndDate: string;
}

export function calculateProRataRent(
  monthlyRent: number,
  joiningDateStr: string
): ProRataResult | null {
  const date = parseFlexibleDate(joiningDateStr) || new Date();
  const dayOfMonth = date.getDate();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed

  // Total days in this current calendar month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - dayOfMonth + 1);

  // Standard UAE property daily calculation formula (Monthly / 30 or Monthly / daysInMonth)
  const dailyRate = Math.round((monthlyRent / 30) * 100) / 100;
  const proRataAmount = Math.round(dailyRate * daysRemaining);

  // Next calendar billing date (1st of next month)
  const nextMonthDate = new Date(year, month + 1, 1);
  const calendarMonthNextBillingDate = nextMonthDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // 30-day rolling cycle end date
  const thirtyDaysLater = new Date(date);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const thirtyDayCycleEndDate = thirtyDaysLater.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return {
    joiningDate: date,
    monthlyRent,
    dailyRate,
    daysRemainingInMonth: daysRemaining,
    proRataAmount,
    calendarMonthNextBillingDate,
    thirtyDayCycleEndDate
  };
}

export interface GiveBackSettlement {
  originalDeposit: number;
  unpaidRentDeduction: number;
  doorKeyCharge: number;
  cupboardKeyCharge: number;
  partitionKeyCharge?: number;
  totalKeyCharges: number;
  damageCharges: number;
  totalDeductions: number;
  giveBackAmount: number; // Net cash to return to tenant
  tenantOwesExtra: number; // If deductions exceed deposit
}

export function calculateGiveBack(
  deposit: number,
  unpaidRent: number = 0,
  doorKeyReturned: boolean = true,
  cupboardKeyReturned: boolean = true,
  doorKeyFee: number = 50,
  cupboardKeyFee: number = 30,
  damageCharges: number = 0,
  partitionKeyReturned?: boolean,
  partitionKeyFee: number = 50
): GiveBackSettlement {
  const doorKeyCharge = doorKeyReturned ? 0 : doorKeyFee;
  const cupboardKeyCharge = cupboardKeyReturned ? 0 : cupboardKeyFee;
  const partitionKeyCharge = (partitionKeyReturned !== undefined && !partitionKeyReturned) ? partitionKeyFee : 0;
  const totalKeyCharges = doorKeyCharge + cupboardKeyCharge + partitionKeyCharge;

  const totalDeductions = unpaidRent + totalKeyCharges + damageCharges;
  const diff = deposit - totalDeductions;

  const giveBackAmount = diff > 0 ? diff : 0;
  const tenantOwesExtra = diff < 0 ? Math.abs(diff) : 0;

  return {
    originalDeposit: deposit,
    unpaidRentDeduction: unpaidRent,
    doorKeyCharge,
    cupboardKeyCharge,
    partitionKeyCharge,
    totalKeyCharges,
    damageCharges,
    totalDeductions,
    giveBackAmount,
    tenantOwesExtra
  };
}

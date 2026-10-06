/**
 * Utility functions for date parsing, stay duration calculation, and 30-day rent cycles.
 */

// Parse DD.MM.YYYY, DD/MM/YYYY, or YYYY-MM-DD into a valid Date object
export function parseFlexibleDate(dateStr: string | undefined): Date | null {
  if (!dateStr || dateStr.trim() === '' || dateStr.includes('?') || dateStr.toLowerCase().includes('check')) {
    return null;
  }

  const cleaned = dateStr.trim();

  // Try DD.MM.YYYY or DD/MM/YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed
    const year = parseInt(dmyMatch[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }

  // Try YYYY-MM-DD
  const ymdMatch = cleaned.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }

  const fallback = new Date(cleaned);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDateDisplay(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  if (dateStr.includes('?') || dateStr.toLowerCase().includes('check')) return dateStr;

  const date = parseFlexibleDate(dateStr);
  if (!date) return dateStr;

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Calculate stay duration (e.g. "4 months 12 days" or "15 days")
export function calculateStayDuration(joiningDateStr: string | undefined, leavingDateStr?: string | null): string {
  const startDate = parseFlexibleDate(joiningDateStr);
  if (!startDate) return 'Unknown';

  const endDate = leavingDateStr ? parseFlexibleDate(leavingDateStr) || new Date() : new Date();

  // Difference in milliseconds
  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs < 0) return 'Upcoming';

  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (totalDays === 0) return 'Joined today';
  if (totalDays < 30) return `${totalDays} day${totalDays === 1 ? '' : 's'}`;

  const months = Math.floor(totalDays / 30);
  const remainingDays = totalDays % 30;

  if (remainingDays === 0) {
    return `${months} month${months === 1 ? '' : 's'}`;
  }

  return `${months}m ${remainingDays}d (${totalDays}d)`;
}

// Calculate 30-day rent cycle and next due date
export function calculateRentDueInfo(
  joiningDateStr: string | undefined,
  lastPaidDateStr?: string | undefined,
  currentStatus?: 'Paid' | 'Pending' | 'Due' | 'Partial'
): {
  dueDate: Date | null;
  dueDateFormatted: string;
  daysDiff: number; // negative = overdue, 0 = due today, positive = days left
  status: 'overdue' | 'due_today' | 'due_soon' | 'paid' | 'pending' | 'unknown';
} {
  const baseDate = parseFlexibleDate(lastPaidDateStr) || parseFlexibleDate(joiningDateStr);
  if (!baseDate) {
    return {
      dueDate: null,
      dueDateFormatted: 'Date missing',
      daysDiff: 0,
      status: 'unknown'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If already marked Paid for the current cycle
  if (currentStatus === 'Paid') {
    // Next cycle is 30 days after last payment
    const nextDue = new Date(baseDate);
    nextDue.setDate(nextDue.getDate() + 30);
    const diffMs = nextDue.getTime() - today.getTime();
    const daysDiff = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      dueDate: nextDue,
      dueDateFormatted: nextDue.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      daysDiff,
      status: 'paid'
    };
  }

  // Calculate 30-day recurring due date from base date
  // Keep adding 30 days until we reach the current or next cycle
  const cycleDate = new Date(baseDate);
  while (cycleDate <= today) {
    cycleDate.setDate(cycleDate.getDate() + 30);
  }

  // If current status is explicitly Due/Overdue or if joining date was > 30 days ago
  const diffDaysFromBase = Math.floor((today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysIntoCycle = diffDaysFromBase % 30;
  const daysUntilNext = 30 - daysIntoCycle;

  // If base date is past 30 days and not marked paid, rent is due!
  if (diffDaysFromBase >= 30) {
    const overdueDays = daysIntoCycle; // days past the 30-day mark
    if (overdueDays === 0) {
      return {
        dueDate: today,
        dueDateFormatted: 'Today',
        daysDiff: 0,
        status: 'due_today'
      };
    }
    return {
      dueDate: new Date(today.getTime() - overdueDays * 24 * 60 * 60 * 1000),
      dueDateFormatted: `${overdueDays} day${overdueDays === 1 ? '' : 's'} ago`,
      daysDiff: -overdueDays,
      status: 'overdue'
    };
  }

  // Within the first 30 days of joining
  if (daysUntilNext <= 3) {
    return {
      dueDate: cycleDate,
      dueDateFormatted: cycleDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      daysDiff: daysUntilNext,
      status: 'due_soon'
    };
  }

  return {
    dueDate: cycleDate,
    dueDateFormatted: cycleDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    daysDiff: daysUntilNext,
    status: 'pending'
  };
}

/**
 * Normalizes any phone number into an international format valid for WhatsApp wa.me links.
 * Handles local UAE numbers like 050..., 50..., +97150..., 0097150...
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/[^0-9]/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // UAE local number starting with 05 (e.g. 050, 052, 054, 055, 056, 058)
  if (digits.startsWith('05') && digits.length === 10) {
    digits = '971' + digits.slice(1);
  }
  // UAE local number entered without leading 0 (e.g. 501234567, 9 digits)
  else if (
    (digits.startsWith('50') || digits.startsWith('52') || digits.startsWith('54') ||
     digits.startsWith('55') || digits.startsWith('56') || digits.startsWith('58')) &&
    digits.length === 9
  ) {
    digits = '971' + digits;
  }
  // UAE number entered with 97105... (13 digits)
  else if (digits.startsWith('97105') && digits.length === 13) {
    digits = '971' + digits.slice(4);
  }

  return digits;
}

/**
 * Formats entered phone numbers into a standard UAE format (+971 5X XXX XXXX)
 * or preserves international numbers cleanly.
 * Handles inputs like '0501234567', '501234567', '050 123 4567', '+971501234567', etc.
 */
export function normalizePhoneForStorage(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^0-9]/g, '');

  // 10 digits starting with 05 (e.g. 0501234567)
  if (digits.startsWith('05') && digits.length === 10) {
    return `+971 ${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  // 9 digits starting with 5 (e.g. 501234567)
  if (digits.length === 9 && digits.startsWith('5')) {
    return `+971 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }

  // 12 digits starting with 9715...
  if (digits.length === 12 && digits.startsWith('9715')) {
    return `+971 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }

  // 13 digits starting with 97105...
  if (digits.length === 13 && digits.startsWith('97105')) {
    return `+971 ${digits.slice(4, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }

  return trimmed;
}

// Generate pre-filled polite WhatsApp rent reminder
export function generateWhatsAppLink(
  phone: string,
  tenantName: string,
  flatName: string,
  partition: string,
  rentAmount: number,
  dueText: string
): string {
  const cleanPhone = formatWhatsAppNumber(phone);
  const message = `Hello ${tenantName},\n\nThis is a gentle reminder regarding the room rent for ${flatName} (${partition.toUpperCase()}).\n\n💰 Amount: AED ${rentAmount || 'Rent'}\n📅 Due Status: ${dueText}\n\nKindly arrange the payment at your earliest convenience. Thank you! 🙏`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export const STANDARD_MONTHS = [
  'Jan-2026', 'Feb-2026', 'Mar-2026', 'Apr-2026', 'May-2026', 'Jun-2026',
  'Jul-2026', 'Aug-2026', 'Sep-2026', 'Oct-2026', 'Nov-2026', 'Dec-2026'
];

const MONTH_NAMES_MAP: Record<string, string[]> = {
  'jan': ['jan', 'january', '1', '01'],
  'feb': ['feb', 'february', '2', '02'],
  'mar': ['mar', 'march', '3', '03'],
  'apr': ['apr', 'april', '4', '04'],
  'may': ['may', '5', '05'],
  'jun': ['jun', 'june', '6', '06'],
  'jul': ['jul', 'july', '7', '07'],
  'aug': ['aug', 'august', '8', '08'],
  'sep': ['sep', 'september', '9', '09'],
  'oct': ['oct', 'october', '10'],
  'nov': ['nov', 'november', '11'],
  'dec': ['dec', 'december', '12']
};

/**
 * Checks if a search query matches a given month string (e.g. 'Aug-2026' matches 'aug', 'august', '8', '2026')
 */
export function searchMatchesMonth(monthString: string, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const mLower = monthString.toLowerCase();
  
  if (mLower.includes(q)) return true;

  const prefix = mLower.slice(0, 3);
  const aliases = MONTH_NAMES_MAP[prefix];
  if (aliases && aliases.some(alias => alias === q || q.includes(alias))) {
    return true;
  }

  return false;
}

/**
 * Accurately gets a tenant's payment status for a specific month.
 * If historical status exists for that month in monthStatusHistory, returns it.
 * If viewing the tenant's current stayMonth, returns currentMonthStatus.
 * Otherwise defaults to 'Due'.
 */
export function getTenantStatusForMonth(
  tenant: {
    currentMonthStatus?: 'Paid' | 'Pending' | 'Due' | 'Partial';
    stayMonth?: string;
    monthStatusHistory?: Record<string, 'Paid' | 'Pending' | 'Due' | 'Partial'>;
  },
  month: string
): 'Paid' | 'Pending' | 'Due' | 'Partial' {
  if (tenant.monthStatusHistory && tenant.monthStatusHistory[month]) {
    return tenant.monthStatusHistory[month];
  }
  if ((tenant.stayMonth || 'Sep-2026') === month && tenant.currentMonthStatus) {
    return tenant.currentMonthStatus;
  }
  return 'Due';
}

/**
 * Returns previous month from a list
 */
export function getPreviousMonth(currentMonth: string, list: string[] = STANDARD_MONTHS): string | null {
  const idx = list.indexOf(currentMonth);
  if (idx > 0) return list[idx - 1];
  return null;
}

/**
 * Returns next month from a list
 */
export function getNextMonth(currentMonth: string, list: string[] = STANDARD_MONTHS): string | null {
  const idx = list.indexOf(currentMonth);
  if (idx >= 0 && idx < list.length - 1) return list[idx + 1];
  return null;
}

/**
 * Checks if a date string is in the future (after today)
 */
export function isFutureDate(dateStr: string | undefined): boolean {
  if (!dateStr || dateStr.trim() === '') return false;
  const parsed = parseFlexibleDate(dateStr);
  if (!parsed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed.getTime() > today.getTime();
}

/**
 * Checks if a joining date falls in a future month compared to reference month or today
 */
export function isFutureMonth(dateStr: string | undefined, referenceMonth?: string): boolean {
  if (!dateStr) return false;
  const parsed = parseFlexibleDate(dateStr);
  if (!parsed) return false;

  if (referenceMonth) {
    const parts = referenceMonth.split('-');
    if (parts.length === 2) {
      const monthIdx = STANDARD_MONTHS.findIndex(m => m.startsWith(parts[0]));
      const year = parseInt(parts[1], 10);
      if (monthIdx !== -1 && !isNaN(year)) {
        if (parsed.getFullYear() > year) return true;
        if (parsed.getFullYear() === year && parsed.getMonth() > (monthIdx % 12)) return true;
        return false;
      }
    }
  }

  const today = new Date();
  if (parsed.getFullYear() > today.getFullYear()) return true;
  if (parsed.getFullYear() === today.getFullYear() && parsed.getMonth() > today.getMonth()) return true;
  return false;
}

/**
 * Returns the current calendar month formatted as 'Mon-YYYY' (e.g. 'Sep-2026')
 * strictly derived from the real-world live calendar clock.
 */
export function getLiveCalendarMonth(): string {
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[now.getMonth()]}-${now.getFullYear()}`;
}

/**
 * Checks whether a tenant is active in a specified month.
 * A tenant is visible in targetMonth if:
 * 1. monthStatusHistory explicitly contains an entry for targetMonth, OR
 * 2. Their current stayMonth equals targetMonth, OR
 * 3. For the current calendar month, they are active in the system.
 * 
 * If targetMonth is in the future (e.g. 'Oct-2026') and the user has NOT pressed
 * "Carry Forward to Next Month" into that month, this returns false so nothing is visible.
 */
export function isTenantInMonth(
  tenant: {
    status?: string;
    stayMonth?: string;
    monthStatusHistory?: Record<string, string>;
    joiningDate?: string;
  },
  targetMonth: string
): boolean {
  // If explicitly recorded in monthStatusHistory for this month
  if (tenant.monthStatusHistory && tenant.monthStatusHistory[targetMonth] !== undefined) {
    return true;
  }

  // If the tenant's current stayMonth is this month
  if (tenant.stayMonth === targetMonth) {
    return true;
  }

  // Fallback ONLY for legacy or newly added tenants that lack a stayMonth:
  // they belong to the live calendar month
  const liveMonth = getLiveCalendarMonth();
  if (targetMonth === liveMonth && !tenant.stayMonth) {
    return true;
  }

  return false;
}

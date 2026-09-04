import { supabase } from './supabaseClient';
import { LocationItem, Building, RoomUnit, Tenant, ExpenseItem, MonthlyUtilityBill, CustomerInquiry } from '../types/crm';

// --- LOCATIONS ---
export async function fetchLocationsFromDb(): Promise<LocationItem[]> {
  try {
    const { data, error } = await supabase.from('room_crm_locations').select('*').order('created_at', { ascending: true });
    if (error || !data) return [];
    return data.map(d => ({
      id: d.id,
      name: d.name,
      city: d.city || 'Dubai',
    }));
  } catch (err) {
    console.error('Error fetching locations from Supabase:', err);
    return [];
  }
}

export async function upsertLocationToDb(loc: LocationItem) {
  try {
    await supabase.from('room_crm_locations').upsert({
      id: loc.id,
      name: loc.name,
      city: loc.city,
    });
  } catch (err) {
    console.error('Error saving location:', err);
  }
}

// --- BUILDINGS ---
export async function fetchBuildingsFromDb(): Promise<Building[]> {
  try {
    const { data, error } = await supabase.from('room_crm_buildings').select('*').order('created_at', { ascending: true });
    if (error || !data) return [];
    return data.map(d => ({
      id: d.id,
      locationId: d.location_id,
      name: d.name,
      address: d.address || '',
      ownerRentAnnual: Number(d.owner_rent_annual) || 0,
      paymentTerms: d.payment_terms || 'Quarterly',
      chequeAmount: Number(d.cheque_amount) || 0,
      nextChequeDueDate: d.next_cheque_due_date || '',
      ownerName: d.owner_name || '',
      ownerPhone: d.owner_phone || '',
      notes: d.notes || '',
    }));
  } catch (err) {
    console.error('Error fetching buildings from Supabase:', err);
    return [];
  }
}

export async function upsertBuildingToDb(bld: Building) {
  try {
    await supabase.from('room_crm_buildings').upsert({
      id: bld.id,
      location_id: bld.locationId,
      name: bld.name,
      address: bld.address,
      owner_rent_annual: bld.ownerRentAnnual,
      payment_terms: bld.paymentTerms,
      cheque_amount: bld.chequeAmount,
      next_cheque_due_date: bld.nextChequeDueDate,
      owner_name: bld.ownerName,
      owner_phone: bld.ownerPhone,
      notes: bld.notes,
    });
  } catch (err) {
    console.error('Error saving building to Supabase:', err);
  }
}

export async function deleteBuildingFromDb(buildingId: string) {
  try {
    // Delete tenants in this building
    await supabase.from('room_crm_tenants').delete().eq('building_id', buildingId);
    // Delete rooms in this building
    await supabase.from('room_crm_rooms').delete().eq('building_id', buildingId);
    // Delete building
    await supabase.from('room_crm_buildings').delete().eq('id', buildingId);
  } catch (err) {
    console.error('Error deleting building from Supabase:', err);
  }
}

// --- ROOMS ---
export async function fetchRoomsFromDb(): Promise<RoomUnit[]> {
  try {
    const { data, error } = await supabase.from('room_crm_rooms').select('*').order('created_at', { ascending: true });
    if (error || !data) return [];
    return data.map(d => ({
      id: d.id,
      buildingId: d.building_id,
      roomNumber: d.room_number,
      roomType: d.room_type || 'Partition Flat',
      capacity: Number(d.capacity) || 10,
      actualRentAnnual: Number(d.actual_rent_annual) || 0,
      paymentTerms: d.payment_terms || 'Quarterly',
      realEstateName: d.real_estate_name || '',
      realEstatePhone: d.real_estate_phone || '',
      ejariNumber: d.ejari_number || '',
      securityDepositToOwner: Number(d.security_deposit_owner) || 0,
      contractStartDate: d.contract_start_date || '',
      contractEndDate: d.contract_end_date || '',
      notes: d.notes || '',
      dewaBill: d.dewa_bill || { provider: 'DEWA', amount: 0, status: 'Due', dueDate: '', accountNumber: '' },
      wifiBill: d.wifi_bill || { provider: 'Du', amount: 0, status: 'Due', dueDate: '', accountNumber: '' },
    }));
  } catch (err) {
    console.error('Error fetching rooms from Supabase:', err);
    return [];
  }
}

export async function upsertRoomToDb(room: RoomUnit) {
  try {
    await supabase.from('room_crm_rooms').upsert({
      id: room.id,
      building_id: room.buildingId,
      room_number: room.roomNumber,
      room_type: room.roomType,
      capacity: room.capacity || 10,
      actual_rent_annual: room.actualRentAnnual || 0,
      payment_terms: room.paymentTerms || 'Quarterly',
      real_estate_name: room.realEstateName || '',
      real_estate_phone: room.realEstatePhone || '',
      ejari_number: room.ejariNumber || '',
      security_deposit_owner: room.securityDepositToOwner || 0,
      contract_start_date: room.contractStartDate || '',
      contract_end_date: room.contractEndDate || '',
      notes: room.notes,
      dewa_bill: room.dewaBill,
      wifi_bill: room.wifiBill,
    });
  } catch (err) {
    console.error('Error saving room to Supabase:', err);
  }
}

export async function deleteRoomFromDb(roomId: string) {
  try {
    await supabase.from('room_crm_tenants').delete().eq('room_id', roomId);
    await supabase.from('room_crm_rooms').delete().eq('id', roomId);
  } catch (err) {
    console.error('Error deleting room from Supabase:', err);
  }
}

// --- TENANTS ---
export async function fetchTenantsFromDb(): Promise<Tenant[]> {
  try {
    const { data, error } = await supabase.from('room_crm_tenants').select('*').order('sno', { ascending: true });
    if (error || !data) return [];
    return data.map(d => ({
      id: d.id,
      sno: d.sno,
      buildingId: d.building_id,
      roomId: d.room_id,
      flatId: d.building_id,
      name: d.name,
      place: d.place || '',
      phone: d.phone || '',
      deposit: Number(d.deposit) || 0,
      depositNote: d.deposit_note || '',
      joiningDate: d.joining_date || '',
      leavingDate: d.leaving_date,
      status: d.status as any || 'Active',
      section: d.section || 'HALL',
      partition: d.partition || 'p1',
      spaceType: d.space_type || 'Partition',
      bedType: d.bed_type || 'Bed Space',
      rentAmount: Number(d.rent_amount) || 0,
      cupboardKey: !!d.cupboard_key,
      doorKey: !!d.door_key,
      currentMonthStatus: d.current_month_status as any || 'Pending',
      remarks: d.remarks || '',
      lastPaidDate: d.last_paid_date || '',
      history: d.history || [],
      checkOutRecord: d.checkout_record || undefined,
    }));
  } catch (err) {
    console.error('Error fetching tenants from Supabase:', err);
    return [];
  }
}

export async function upsertTenantToDb(tenant: Tenant) {
  try {
    await supabase.from('room_crm_tenants').upsert({
      id: tenant.id,
      sno: tenant.sno,
      building_id: tenant.buildingId,
      room_id: tenant.roomId,
      name: tenant.name,
      place: tenant.place,
      phone: tenant.phone,
      deposit: tenant.deposit,
      deposit_note: tenant.depositNote,
      joining_date: tenant.joiningDate,
      leaving_date: tenant.leavingDate,
      status: tenant.status,
      section: tenant.section,
      partition: tenant.partition,
      space_type: tenant.spaceType,
      bed_type: tenant.bedType,
      rent_amount: tenant.rentAmount,
      cupboard_key: tenant.cupboardKey,
      door_key: tenant.doorKey,
      current_month_status: tenant.currentMonthStatus,
      remarks: tenant.remarks,
      last_paid_date: tenant.lastPaidDate,
      history: tenant.history || [],
      checkout_record: tenant.checkOutRecord || null,
    });
  } catch (err) {
    console.error('Error saving tenant to Supabase:', err);
  }
}

export async function deleteTenantFromDb(tenantId: string) {
  try {
    await supabase.from('room_crm_tenants').delete().eq('id', tenantId);
  } catch (err) {
    console.error('Error deleting tenant from Supabase:', err);
  }
}

// --- EXPENSES ---
export async function fetchExpensesFromDb(): Promise<ExpenseItem[]> {
  try {
    const { data, error } = await supabase.from('room_crm_expenses').select('*').order('date', { ascending: false });
    if (error || !data) return [];
    return data.map(d => ({
      id: d.id,
      roomId: d.room_id,
      buildingId: d.building_id,
      title: d.title,
      category: d.category as any,
      amount: Number(d.amount) || 0,
      date: d.date,
      paidBy: d.paid_by || 'Cash',
      invoiceRef: d.invoice_ref || '',
      notes: d.notes || '',
      createdAt: d.created_at,
    }));
  } catch (err) {
    console.error('Error fetching expenses from Supabase:', err);
    return [];
  }
}

export async function upsertExpenseToDb(expense: ExpenseItem) {
  try {
    await supabase.from('room_crm_expenses').upsert({
      id: expense.id,
      room_id: expense.roomId,
      building_id: expense.buildingId,
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      paid_by: expense.paidBy || 'Cash',
      invoice_ref: expense.invoiceRef || '',
      notes: expense.notes || '',
    });
  } catch (err) {
    console.error('Error saving expense to Supabase:', err);
  }
}

export async function deleteExpenseFromDb(expenseId: string) {
  try {
    await supabase.from('room_crm_expenses').delete().eq('id', expenseId);
  } catch (err) {
    console.error('Error deleting expense from Supabase:', err);
  }
}

// --- MONTHLY UTILITY BILLS (DEWA / SEWA / Wi-Fi) ---
export async function fetchUtilityBillsFromDb(): Promise<MonthlyUtilityBill[]> {
  try {
    const { data, error } = await supabase.from('room_crm_utility_bills').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(d => ({
      id: d.id,
      roomId: d.room_id,
      month: d.month,
      utilityType: d.utility_type as any,
      amount: Number(d.amount) || 0,
      status: d.status as any || 'Due',
      dueDate: d.due_date || '',
      paidDate: d.paid_date || '',
      accountNumber: d.account_number || '',
      notes: d.notes || '',
      createdAt: d.created_at,
    }));
  } catch (err) {
    console.error('Error fetching utility bills from Supabase:', err);
    return [];
  }
}

export async function upsertUtilityBillToDb(bill: MonthlyUtilityBill) {
  try {
    await supabase.from('room_crm_utility_bills').upsert({
      id: bill.id,
      room_id: bill.roomId,
      month: bill.month,
      utility_type: bill.utilityType,
      amount: bill.amount,
      status: bill.status,
      due_date: bill.dueDate,
      paid_date: bill.paidDate,
      account_number: bill.accountNumber,
      notes: bill.notes,
    });
  } catch (err) {
    console.error('Error saving utility bill to Supabase:', err);
  }
}

export async function deleteUtilityBillFromDb(billId: string) {
  try {
    await supabase.from('room_crm_utility_bills').delete().eq('id', billId);
  } catch (err) {
    console.error('Error deleting utility bill from Supabase:', err);
  }
}

// --- CUSTOMER INQUIRIES & FOLLOW-UP LEADS ---
export async function fetchInquiriesFromDb(): Promise<CustomerInquiry[]> {
  try {
    const { data, error } = await supabase.from('room_crm_inquiries').select('*').order('inquiry_date', { ascending: false });
    if (error || !data) return [];
    return data.map(d => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      inquiryDate: d.inquiry_date,
      lookingFor: d.looking_for as any,
      preferredLocation: d.preferred_location || '',
      budget: Number(d.budget) || 0,
      status: d.status as any || 'New',
      notes: d.notes || '',
      lastContactedDate: d.last_contacted_date || '',
      createdAt: d.created_at,
    }));
  } catch (err) {
    console.error('Error fetching customer inquiries from Supabase:', err);
    return [];
  }
}

export async function upsertInquiryToDb(inquiry: CustomerInquiry) {
  try {
    await supabase.from('room_crm_inquiries').upsert({
      id: inquiry.id,
      name: inquiry.name,
      phone: inquiry.phone,
      inquiry_date: inquiry.inquiryDate,
      looking_for: inquiry.lookingFor,
      preferred_location: inquiry.preferredLocation,
      budget: inquiry.budget,
      status: inquiry.status,
      notes: inquiry.notes,
      last_contacted_date: inquiry.lastContactedDate,
    });
  } catch (err) {
    console.error('Error saving customer inquiry to Supabase:', err);
  }
}

export async function deleteInquiryFromDb(inquiryId: string) {
  try {
    await supabase.from('room_crm_inquiries').delete().eq('id', inquiryId);
  } catch (err) {
    console.error('Error deleting customer inquiry from Supabase:', err);
  }
}

export async function batchUpdateInquiryStatus(ids: string[], status: string, contactedDate: string) {
  try {
    for (const id of ids) {
      await supabase.from('room_crm_inquiries').update({
        status,
        last_contacted_date: contactedDate,
      }).eq('id', id);
    }
  } catch (err) {
    console.error('Error batch updating customer inquiries in Supabase:', err);
  }
}

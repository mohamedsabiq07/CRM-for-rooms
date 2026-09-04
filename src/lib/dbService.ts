import { supabase } from './supabaseClient';
import { LocationItem, Building, RoomUnit, Tenant } from '../types/crm';

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
      rentAmount: Number(d.rent_amount) || 0,
      cupboardKey: !!d.cupboard_key,
      doorKey: !!d.door_key,
      currentMonthStatus: d.current_month_status as any || 'Pending',
      remarks: d.remarks || '',
      lastPaidDate: d.last_paid_date || '',
      history: d.history || [],
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
      rent_amount: tenant.rentAmount,
      cupboard_key: tenant.cupboardKey,
      door_key: tenant.doorKey,
      current_month_status: tenant.currentMonthStatus,
      remarks: tenant.remarks,
      last_paid_date: tenant.lastPaidDate,
      history: tenant.history || [],
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

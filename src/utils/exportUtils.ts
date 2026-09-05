import * as XLSX from 'xlsx';
import { Tenant, FlatItem, LocationItem } from '../types/crm';
import { calculateStayDuration, getTenantStatusForMonth } from './dateUtils';
import { isTenantInPartition } from './tenantConversion';

export function exportFlatToExcel(
  flat: FlatItem,
  location: LocationItem | undefined,
  tenants: Tenant[],
  selectedMonth: string = 'Sep-2026'
) {
  // Filter tenants for this flat/building
  const flatTenants = tenants.filter(t => t.buildingId === flat.id || t.flatId === flat.id);

  const rows = flatTenants.map(t => ({
    'Sno': t.sno,
    'Section': t.section,
    'Partition': t.partition.toUpperCase(),
    'Tenants': t.name,
    'Place': t.place,
    'Deposit': t.depositNote || (t.deposit > 0 ? t.deposit : 'No Advance'),
    'Joining date': t.joiningDate,
    'Rent (AED)': t.rentAmount,
    'Stay Duration': calculateStayDuration(t.joiningDate, t.leavingDate),
    'Cu/k (Cupboard)': t.cupboardKey ? 'Yes' : 'No',
    'D/k (Door)': t.doorKey ? 'Yes' : 'No',
    'P/k (Partition)': isTenantInPartition(t) ? (t.partitionKey ? 'Yes' : 'No') : '-',
    [`${selectedMonth} / Status`]: getTenantStatusForMonth(t, selectedMonth),
    'Remarks': t.remarks,
    'Phone': t.phone
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, flat.name.substring(0, 30));

  const fileName = `${location ? location.name + '_' : ''}${flat.name.replace(/\s+/g, '_')}_Tenants_${selectedMonth}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportAllDataToJson(locations: LocationItem[], flats: FlatItem[], tenants: Tenant[]) {
  const data = {
    exportedAt: new Date().toISOString(),
    locations,
    flats,
    tenants
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `room_crm_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

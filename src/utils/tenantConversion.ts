import { Tenant, CheckOutRecord, CustomerInquiry } from '../types/crm';

/**
 * Converts a tenant who has left / checked out from our rooms into a CustomerInquiry
 * so their contact and stay preferences are never lost and can be followed up at month-end.
 */
export function convertVacatedTenantToInquiry(
  tenant: Tenant,
  checkoutRecord?: CheckOutRecord,
  buildingName?: string,
  roomNumber?: string
): CustomerInquiry {
  const cleanRoomNum = (roomNumber || '').replace(/^(room|flat)\s*/i, '').trim();
  
  // Determine lookingFor preference based on what they stayed in
  let lookingFor: CustomerInquiry['lookingFor'] = 'Bed Space (Lower)';
  if (tenant.spaceType === 'Partition') {
    lookingFor = 'Partition';
  } else if (tenant.bedType === 'Upper Bed') {
    lookingFor = 'Bed Space (Upper)';
  } else if (tenant.bedType === 'Lower Bed') {
    lookingFor = 'Bed Space (Lower)';
  } else if (tenant.spaceType === 'Bed Space') {
    lookingFor = 'Bed Space (Lower)';
  }

  const checkoutDate = checkoutRecord?.checkOutDate || tenant.leavingDate || new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
  const durationText = checkoutRecord?.stayDuration ? ' Stayed ' + checkoutRecord.stayDuration + '.' : '';
  const refundText = checkoutRecord?.giveBackAmount !== undefined ? ' Refund settled: AED ' + checkoutRecord.giveBackAmount + '.' : '';
  const userNotes = checkoutRecord?.notes ? ' Notes: ' + checkoutRecord.notes + '.' : (tenant.remarks ? ' ' + tenant.remarks : '');

  const bldLabel = buildingName || 'Property';
  const unitLabel = cleanRoomNum ? 'Flat ' + cleanRoomNum : tenant.partition;

  return {
    id: 'inq-former-' + tenant.id,
    tenantId: tenant.id,
    name: tenant.name,
    phone: tenant.phone || '',
    inquiryDate: checkoutDate,
    lookingFor,
    preferredLocation: buildingName ? buildingName + ' (Former Tenant)' : 'Al Barsha 1',
    budget: tenant.rentAmount || 700,
    status: 'New', // Placed into 'New' so they immediately appear in follow-up pipeline
    leadSource: 'Former Tenant',
    notes: ('Former resident of ' + bldLabel + ' ' + unitLabel + ' (' + tenant.partition + ').' + durationText + refundText + userNotes).trim(),
    lastContactedDate: checkoutDate,
    createdAt: new Date().toISOString()
  };
}

/**
 * Checks whether a tenant is in a Partition (as opposed to Bed Space).
 * Used to conditionally show Partition Key (P/k) only for partition tenants.
 */
export function isTenantInPartition(tenant: Tenant, roomType?: string): boolean {
  if (tenant.spaceType === 'Partition') return true;
  if (tenant.spaceType === 'Bed Space' || tenant.spaceType === 'Without Partition') return false;
  if (tenant.bedType === 'Upper Bed' || tenant.bedType === 'Lower Bed' || tenant.bedType === 'Single Bed') return false;
  if (tenant.bedType === 'Private Partition') return true;
  if (roomType && roomType.toLowerCase().includes('partition')) return true;
  if (/^p\d+/i.test(tenant.partition)) return true;
  return false;
}

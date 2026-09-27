import { Tenant } from '../types/crm';

export const SECTION_DISPLAY_PRIORITY = [
  'HALL',
  'ROOM',
  'MASTER ROOM',
  'BALCONY',
  'NEXT TO KITCHEN',
  'CENTRE ROOM',
  'HALL / BED SPACE',
  'KITCHEN'
];

/**
 * Compares two section names according to standard residential layout priority
 */
export const compareSections = (secA: string, secB: string): number => {
  const aUpper = (secA || 'HALL').toUpperCase().trim();
  const bUpper = (secB || 'HALL').toUpperCase().trim();
  const idxA = SECTION_DISPLAY_PRIORITY.indexOf(aUpper);
  const idxB = SECTION_DISPLAY_PRIORITY.indexOf(bUpper);
  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;
  return aUpper.localeCompare(bUpper);
};

/**
 * Natural comparator for tenant rows within a room:
 * 1. Section (HALL, ROOM, MASTER ROOM...)
 * 2. Partition number natural numeric sort (P1, P2, P10...)
 * 3. Bed position (Lower Bed first, then Upper Bed)
 * 4. Fallback to existing sno or name
 */
export const compareTenantsForSequence = (a: Tenant, b: Tenant): number => {
  // 1. Section
  const secDiff = compareSections(a.section || 'HALL', b.section || 'HALL');
  if (secDiff !== 0) return secDiff;

  // 2. Partition code numeric sort (P1, P2, P7, P8, P9, P10, Bed 1, Bed 2...)
  const numA = parseInt((a.partition || '').replace(/\D/g, ''), 10);
  const numB = parseInt((b.partition || '').replace(/\D/g, ''), 10);
  if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
    return numA - numB;
  }
  const partA = (a.partition || '').trim();
  const partB = (b.partition || '').trim();
  if (partA !== partB) {
    return partA.localeCompare(partB, undefined, { numeric: true });
  }

  // 3. Bed type: Lower Bed before Upper Bed
  const bedRank = (bType?: string) => {
    if (!bType) return 3;
    const lower = bType.toLowerCase();
    if (lower.includes('lower')) return 1;
    if (lower.includes('upper')) return 2;
    return 3;
  };
  const rankDiff = bedRank(a.bedType) - bedRank(b.bedType);
  if (rankDiff !== 0) return rankDiff;

  // 4. Stable tie-breaker: existing sno
  return (a.sno || 0) - (b.sno || 0);
};

/**
 * Normalizes tenant serial numbers across all rooms in all buildings:
 * Ensures active and incoming tenants are strictly numbered 1, 2, 3, ... N
 * with ZERO gaps and ZERO duplicates in every room.
 */
export const normalizeTenantsOrder = (
  tenantsList: Tenant[]
): { normalized: Tenant[]; updatedTenants: Tenant[]; hasChanges: boolean } => {
  // Group active and waiting tenants by room
  const roomGroups = new Map<string, Tenant[]>();
  const nonActiveTenants: Tenant[] = [];

  tenantsList.forEach(t => {
    if (t.status === 'Active' || t.status === 'Waiting for new tenant') {
      const roomKey = t.roomId || t.buildingId || 'unknown';
      if (!roomGroups.has(roomKey)) roomGroups.set(roomKey, []);
      roomGroups.get(roomKey)!.push(t);
    } else {
      nonActiveTenants.push(t);
    }
  });

  const updatedTenants: Tenant[] = [];
  const normalizedActive: Tenant[] = [];

  roomGroups.forEach((roomTenants) => {
    const sorted = [...roomTenants].sort(compareTenantsForSequence);

    sorted.forEach((tenant, idx) => {
      const correctSno = idx + 1;
      if (tenant.sno !== correctSno) {
        const updated = { ...tenant, sno: correctSno };
        normalizedActive.push(updated);
        updatedTenants.push(updated);
      } else {
        normalizedActive.push(tenant);
      }
    });
  });

  return {
    normalized: [...normalizedActive, ...nonActiveTenants],
    updatedTenants,
    hasChanges: updatedTenants.length > 0
  };
};

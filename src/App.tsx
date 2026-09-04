import React, { useState, useEffect, useMemo } from 'react';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { TenantSheet } from './components/TenantSheet';
import { BuildingsPage } from './components/BuildingsPage';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AddTenantModal } from './components/AddTenantModal';
import { EditTenantModal } from './components/EditTenantModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { AddBuildingModal } from './components/AddBuildingModal';
import { ManageRoomModal } from './components/ManageRoomModal';
import { CheckOutModal } from './components/CheckOutModal';
import { RentCalculatorModal } from './components/RentCalculatorModal';
import { PastTenantsModal } from './components/PastTenantsModal';
import { ProfitAndLossPage } from './components/ProfitAndLossPage';
import { AddExpenseModal } from './components/AddExpenseModal';
import { MonthlyBillsModal } from './components/MonthlyBillsModal';
import { FollowUpPage } from './components/FollowUpPage';
import { 
  LocationItem, 
  Building, 
  RoomUnit, 
  Tenant, 
  ExpenseItem,
  CheckOutRecord,
  RentNotification, 
  OwnerChequeNotification, 
  UtilityNotification,
  MonthlyUtilityBill,
  CustomerInquiry
} from './types/crm';
import { 
  INITIAL_LOCATIONS, 
  INITIAL_BUILDINGS, 
  INITIAL_ROOMS, 
  INITIAL_TENANTS, 
  INITIAL_EXPENSES,
  INITIAL_UTILITY_BILLS,
  INITIAL_INQUIRIES
} from './data/initialData';
import { calculateRentDueInfo, parseFlexibleDate } from './utils/dateUtils';
import { exportFlatToExcel } from './utils/exportUtils';
import { 
  fetchLocationsFromDb, 
  fetchBuildingsFromDb, 
  fetchRoomsFromDb, 
  fetchTenantsFromDb,
  fetchExpensesFromDb,
  fetchUtilityBillsFromDb,
  fetchInquiriesFromDb,
  upsertLocationToDb,
  upsertBuildingToDb,
  deleteBuildingFromDb,
  upsertRoomToDb,
  deleteRoomFromDb,
  upsertTenantToDb,
  deleteTenantFromDb,
  upsertExpenseToDb,
  deleteExpenseFromDb,
  upsertUtilityBillToDb,
  upsertInquiryToDb,
  deleteInquiryFromDb,
  batchUpdateInquiryStatus
} from './lib/dbService';
import { AlertTriangle, Plus, Building2, DoorOpen, ArrowLeft, Zap, Wifi, Database, Cloud, Users } from 'lucide-react';

export const App: React.FC = () => {
  // --- Authentication State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('room_crm_auth') === 'true';
  });

  // --- Current View State ('sheet' | 'buildings' | 'profit_loss' | 'followups') ---
  const [currentView, setCurrentView] = useState<'sheet' | 'buildings' | 'profit_loss' | 'followups'>('sheet');
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Active Month (defaults to Sep-2026 as per user requirement)
  const [selectedMonth, setSelectedMonth] = useState<string>('Sep-2026');

  // Cache buster to ensure 7 rooms, utilities, and inquiries load fresh
  const CRM_DATA_VERSION = 'v4_7rooms_utilities_followups';
  if (typeof window !== 'undefined' && localStorage.getItem('room_crm_version') !== CRM_DATA_VERSION) {
    localStorage.removeItem('room_crm_locations');
    localStorage.removeItem('room_crm_buildings');
    localStorage.removeItem('room_crm_rooms');
    localStorage.removeItem('room_crm_tenants');
    localStorage.removeItem('room_crm_expenses');
    localStorage.setItem('room_crm_version', CRM_DATA_VERSION);
  }

  // --- State with Fallback ---
  const [locations, setLocations] = useState<LocationItem[]>(() => {
    const saved = localStorage.getItem('room_crm_locations');
    return saved ? JSON.parse(saved) : INITIAL_LOCATIONS;
  });

  const [buildings, setBuildings] = useState<Building[]>(() => {
    const saved = localStorage.getItem('room_crm_buildings');
    return saved ? JSON.parse(saved) : INITIAL_BUILDINGS;
  });

  const [rooms, setRooms] = useState<RoomUnit[]>(() => {
    const saved = localStorage.getItem('room_crm_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('room_crm_tenants');
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('room_crm_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [utilityBills, setUtilityBills] = useState<MonthlyUtilityBill[]>(() => {
    const saved = localStorage.getItem('room_crm_utility_bills');
    return saved ? JSON.parse(saved) : INITIAL_UTILITY_BILLS;
  });

  const [inquiries, setInquiries] = useState<CustomerInquiry[]>(() => {
    const saved = localStorage.getItem('room_crm_inquiries');
    return saved ? JSON.parse(saved) : INITIAL_INQUIRIES;
  });

  // Selected Building & Room (Default: Loussane Building -> Room 202)
  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => {
    return locations[0]?.id || 'loc-barsha';
  });

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(() => {
    return buildings[0]?.id || 'bld-loussane';
  });

  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
    return 'room-loussane-202';
  });

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [addTenantSection, setAddTenantSection] = useState('HALL');
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [addExpenseRoomId, setAddExpenseRoomId] = useState<string | undefined>(undefined);
  const [isMonthlyBillsOpen, setIsMonthlyBillsOpen] = useState(false);

  // Manage Room Modal State
  const [isManageRoomOpen, setIsManageRoomOpen] = useState(false);
  const [roomModalBuilding, setRoomModalBuilding] = useState<Building | null>(null);
  const [roomModalTargetRoom, setRoomModalTargetRoom] = useState<RoomUnit | null>(null);

  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [paymentTenant, setPaymentTenant] = useState<Tenant | null>(null);
  const [checkoutTenant, setCheckoutTenant] = useState<Tenant | null>(null);
  const [isRentCalculatorOpen, setIsRentCalculatorOpen] = useState(false);
  const [isPastTenantsOpen, setIsPastTenantsOpen] = useState(false);

  // --- INITIAL LOAD FROM SUPABASE CLOUD DATABASE ---
  useEffect(() => {
    async function loadCloudData() {
      try {
        const [cloudLocs, cloudBlds, cloudRooms, cloudTenants, cloudExpenses, cloudBills, cloudInqs] = await Promise.all([
          fetchLocationsFromDb(),
          fetchBuildingsFromDb(),
          fetchRoomsFromDb(),
          fetchTenantsFromDb(),
          fetchExpensesFromDb(),
          fetchUtilityBillsFromDb(),
          fetchInquiriesFromDb(),
        ]);

        if (cloudLocs.length > 0) setLocations(cloudLocs);
        if (cloudBlds.length > 0) setBuildings(cloudBlds);
        if (cloudRooms.length > 0) setRooms(cloudRooms);
        if (cloudTenants.length > 0) setTenants(cloudTenants);
        if (cloudExpenses.length > 0) setExpenses(cloudExpenses);
        if (cloudBills.length > 0) setUtilityBills(cloudBills);
        if (cloudInqs.length > 0) setInquiries(cloudInqs);
        setIsDbLoaded(true);
      } catch (e) {
        console.error('Database connection notice:', e);
      }
    }
    loadCloudData();
  }, []);

  // Sync to LocalStorage as offline buffer
  useEffect(() => {
    localStorage.setItem('room_crm_locations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('room_crm_utility_bills', JSON.stringify(utilityBills));
  }, [utilityBills]);

  useEffect(() => {
    localStorage.setItem('room_crm_inquiries', JSON.stringify(inquiries));
  }, [inquiries]);

  useEffect(() => {
    localStorage.setItem('room_crm_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('room_crm_buildings', JSON.stringify(buildings));
  }, [buildings]);

  useEffect(() => {
    localStorage.setItem('room_crm_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('room_crm_tenants', JSON.stringify(tenants));
  }, [tenants]);

  // Keep selected room in sync with selected building
  useEffect(() => {
    const currentBuildingRooms = rooms.filter(r => r.buildingId === selectedBuildingId);
    if (currentBuildingRooms.length > 0 && !currentBuildingRooms.some(r => r.id === selectedRoomId)) {
      setSelectedRoomId(currentBuildingRooms[0].id);
    }
  }, [selectedBuildingId, rooms, selectedRoomId]);

  const currentBuilding = buildings.find(b => b.id === selectedBuildingId) || buildings[0];
  const currentRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];
  const currentLocation = locations.find(l => l.id === currentBuilding?.locationId) || locations[0];

  // Tenants in currently selected building & room
  const currentRoomTenants = useMemo(() => {
    if (!currentRoom) return [];
    return tenants.filter(t => 
      (t.roomId === currentRoom.id || (!t.roomId && t.buildingId === currentBuilding?.id)) &&
      t.status === 'Active'
    );
  }, [tenants, currentRoom, currentBuilding]);

  // Past checked-out tenants archive across all rooms
  const pastTenants = useMemo(() => {
    return tenants.filter(t => t.status === 'Checked Out' || !!t.leavingDate || !!t.checkOutRecord);
  }, [tenants]);

  // --- Dynamic Unified Notifications Engine ---
  const tenantNotifications: RentNotification[] = useMemo(() => {
    const alerts: RentNotification[] = [];

    tenants
      .filter(t => t.status === 'Active')
      .forEach(tenant => {
        const bld = buildings.find(b => b.id === (tenant.buildingId || tenant.flatId));
        const rm = rooms.find(r => r.id === tenant.roomId);
        const dueInfo = calculateRentDueInfo(tenant.joiningDate, tenant.lastPaidDate, tenant.currentMonthStatus);

        if (dueInfo.status === 'overdue' || dueInfo.status === 'due_today' || dueInfo.status === 'due_soon') {
          alerts.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            buildingName: bld?.name || 'Building',
            roomNumber: rm?.roomNumber || 'Unit',
            partition: tenant.partition,
            section: tenant.section,
            phone: tenant.phone || '',
            place: tenant.place,
            rentAmount: tenant.rentAmount,
            dueDate: dueInfo.dueDateFormatted,
            daysDiff: dueInfo.daysDiff,
            status: dueInfo.status,
            remarks: tenant.remarks
          });
        }
      });

    return alerts.sort((a, b) => a.daysDiff - b.daysDiff);
  }, [tenants, buildings, rooms]);

  const chequeNotifications: OwnerChequeNotification[] = useMemo(() => {
    const alerts: OwnerChequeNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    buildings.forEach(b => {
      const dueDate = parseFlexibleDate(b.nextChequeDueDate);
      if (dueDate) {
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 45) {
          alerts.push({
            buildingId: b.id,
            buildingName: b.name,
            ownerName: b.ownerName,
            ownerPhone: b.ownerPhone,
            amount: b.chequeAmount,
            dueDate: b.nextChequeDueDate,
            paymentTerms: b.paymentTerms,
            daysDiff: diffDays,
            status: diffDays < 0 ? 'overdue' : diffDays === 0 ? 'due_today' : 'due_soon'
          });
        }
      }
    });

    return alerts.sort((a, b) => a.daysDiff - b.daysDiff);
  }, [buildings]);

  const utilityNotifications: UtilityNotification[] = useMemo(() => {
    const alerts: UtilityNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    rooms.forEach(r => {
      const bld = buildings.find(b => b.id === r.buildingId);
      const bldName = bld?.name || 'Building';

      if (r.dewaBill && r.dewaBill.status !== 'Paid') {
        const dueDate = parseFlexibleDate(r.dewaBill.dueDate);
        const diffDays = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        alerts.push({
          roomId: r.id,
          buildingName: bldName,
          roomNumber: r.roomNumber,
          type: 'DEWA',
          accountNumber: r.dewaBill.accountNumber,
          amount: r.dewaBill.amount,
          dueDate: r.dewaBill.dueDate,
          daysDiff: diffDays,
          status: r.dewaBill.status === 'Overdue' || diffDays < 0 ? 'overdue' : diffDays === 0 ? 'due_today' : 'due_soon'
        });
      }

      if (r.wifiBill && r.wifiBill.status !== 'Paid') {
        const dueDate = parseFlexibleDate(r.wifiBill.dueDate);
        const diffDays = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        alerts.push({
          roomId: r.id,
          buildingName: bldName,
          roomNumber: r.roomNumber,
          type: 'Wi-Fi',
          accountNumber: r.wifiBill.accountNumber,
          amount: r.wifiBill.amount,
          dueDate: r.wifiBill.dueDate,
          daysDiff: diffDays,
          status: r.wifiBill.status === 'Overdue' || diffDays < 0 ? 'overdue' : diffDays === 0 ? 'due_today' : 'due_soon'
        });
      }
    });

    return alerts.sort((a, b) => a.daysDiff - b.daysDiff);
  }, [rooms, buildings]);

  // --- Handlers ---
  const handleLogout = () => {
    localStorage.removeItem('room_crm_auth');
    setIsAuthenticated(false);
  };

  const handleAddTenant = (newTenantData: Omit<Tenant, 'id'>) => {
    const newId = `t-${Date.now()}`;
    const newTenant: Tenant = {
      ...newTenantData,
      id: newId,
    };
    setTenants(prev => [...prev, newTenant]);
    upsertTenantToDb(newTenant);
  };

  const handleUpdateTenant = (updated: Tenant) => {
    setTenants(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    upsertTenantToDb(updated);
  };

  const handleDeleteTenant = (id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
    deleteTenantFromDb(id);
  };

  const handleConfirmCheckOut = (tenantId: string, checkoutRecord: CheckOutRecord) => {
    setTenants(prev =>
      prev.map(t => {
        if (t.id !== tenantId) return t;
        const updated: Tenant = {
          ...t,
          status: 'Checked Out',
          leavingDate: checkoutRecord.checkOutDate,
          doorKey: checkoutRecord.keyReturnedDoor,
          cupboardKey: checkoutRecord.keyReturnedCupboard,
          remarks: checkoutRecord.giveBackAmount >= 0
            ? `Give-back refund: AED ${checkoutRecord.giveBackAmount}${checkoutRecord.notes ? ` (${checkoutRecord.notes})` : ''}`
            : `Deduction settled${checkoutRecord.notes ? ` (${checkoutRecord.notes})` : ''}`,
          checkOutRecord: checkoutRecord,
        };
        upsertTenantToDb(updated);
        return updated;
      })
    );
  };

  const handleOpenAddExpense = (roomId?: string) => {
    setAddExpenseRoomId(roomId);
    setIsAddExpenseOpen(true);
  };

  const handleAddExpense = (newExpData: Omit<ExpenseItem, 'id'>) => {
    const newId = `exp-${Date.now()}`;
    const newExp: ExpenseItem = {
      ...newExpData,
      id: newId,
    };
    setExpenses(prev => [newExp, ...prev]);
    upsertExpenseToDb(newExp);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    deleteExpenseFromDb(expenseId);
  };

  const handleToggleKey = (tenantId: string, keyType: 'cupboard' | 'door') => {
    setTenants(prev =>
      prev.map(t => {
        if (t.id !== tenantId) return t;
        const updated = {
          ...t,
          [keyType === 'cupboard' ? 'cupboardKey' : 'doorKey']:
            keyType === 'cupboard' ? !t.cupboardKey : !t.doorKey,
        };
        upsertTenantToDb(updated);
        return updated;
      })
    );
  };

  const handleSavePayment = (
    tenantId: string,
    amount: number,
    status: 'Paid' | 'Partial' | 'Due' | 'Pending',
    remarks: string,
    date: string
  ) => {
    setTenants(prev =>
      prev.map(t => {
        if (t.id !== tenantId) return t;
        const updated: Tenant = {
          ...t,
          currentMonthStatus: status,
          remarks: remarks || t.remarks,
          lastPaidDate: date,
        };
        upsertTenantToDb(updated);
        return updated;
      })
    );
  };

  const handleMarkTenantPaid = (tenantId: string) => {
    const todayStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '.');

    handleSavePayment(tenantId, 0, 'Paid', 'Payment settled', todayStr);
  };

  const handleMarkUtilityPaid = (roomId: string, type: 'DEWA' | 'SEWA' | 'Wi-Fi') => {
    setRooms(prev =>
      prev.map(r => {
        if (r.id !== roomId) return r;
        const updated: RoomUnit = (type === 'DEWA' || type === 'SEWA')
          ? { ...r, dewaBill: { ...r.dewaBill, status: 'Paid' } }
          : { ...r, wifiBill: { ...r.wifiBill, status: 'Paid' } };
        upsertRoomToDb(updated);
        return updated;
      })
    );
  };

  const handleQuickToggleBillStatus = (roomId: string, billType: 'dewa' | 'wifi') => {
    setRooms(prev =>
      prev.map(r => {
        if (r.id !== roomId) return r;
        const updated: RoomUnit = billType === 'dewa'
          ? { ...r, dewaBill: { ...r.dewaBill, status: r.dewaBill?.status === 'Paid' ? 'Due' : 'Paid' } }
          : { ...r, wifiBill: { ...r.wifiBill, status: r.wifiBill?.status === 'Paid' ? 'Due' : 'Paid' } };
        upsertRoomToDb(updated);
        return updated;
      })
    );
  };

  const handleAddBuilding = (
    buildingData: Omit<Building, 'id'>, 
    initialRoomsData: { roomNumber: string; roomType: string }[]
  ) => {
    const newBldId = `bld-${Date.now()}`;
    const newBld: Building = {
      ...buildingData,
      id: newBldId,
    };

    const perRoomRent = initialRoomsData.length > 0 
      ? Math.round(newBld.ownerRentAnnual / initialRoomsData.length) 
      : 36000;

    const newRooms: RoomUnit[] = initialRoomsData.map((rm, idx) => ({
      id: `room-${Date.now()}-${idx}`,
      buildingId: newBldId,
      roomNumber: rm.roomNumber,
      roomType: rm.roomType,
      capacity: 10,
      actualRentAnnual: perRoomRent,
      paymentTerms: newBld.paymentTerms,
      realEstateName: newBld.ownerName,
      realEstatePhone: newBld.ownerPhone,
      dewaBill: {
        provider: 'DEWA',
        accountNumber: '',
        amount: 850,
        dueDate: '10.09.2026',
        status: 'Due'
      },
      wifiBill: {
        provider: 'Du',
        accountNumber: '',
        amount: 389,
        dueDate: '15.09.2026',
        status: 'Due'
      }
    }));

    setBuildings(prev => [...prev, newBld]);
    setRooms(prev => [...prev, ...newRooms]);
    setSelectedBuildingId(newBldId);
    if (newRooms.length > 0) {
      setSelectedRoomId(newRooms[0].id);
    }

    upsertBuildingToDb(newBld);
    newRooms.forEach(r => upsertRoomToDb(r));
  };

  const handleDeleteBuilding = (buildingId: string) => {
    setBuildings(prev => prev.filter(b => b.id !== buildingId));
    setRooms(prev => prev.filter(r => r.buildingId !== buildingId));
    setTenants(prev => prev.filter(t => t.buildingId !== buildingId));
    deleteBuildingFromDb(buildingId);

    const remaining = buildings.filter(b => b.id !== buildingId);
    if (remaining.length > 0) {
      setSelectedBuildingId(remaining[0].id);
    }
  };

  const handleSaveRoom = (roomData: Omit<RoomUnit, 'id'>, roomId?: string) => {
    if (roomId) {
      const updated: RoomUnit = { ...roomData, id: roomId };
      setRooms(prev => prev.map(r => (r.id === roomId ? updated : r)));
      upsertRoomToDb(updated);
    } else {
      const newRoom: RoomUnit = {
        ...roomData,
        id: `room-${Date.now()}`,
      };
      setRooms(prev => [...prev, newRoom]);
      setSelectedRoomId(newRoom.id);
      upsertRoomToDb(newRoom);
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
    deleteRoomFromDb(roomId);
  };

  // --- Monthly Utility Bill Handler ---
  const handleSaveUtilityBill = (bill: MonthlyUtilityBill) => {
    setUtilityBills(prev => {
      const existingIndex = prev.findIndex(b => b.id === bill.id || (b.roomId === bill.roomId && b.month === bill.month && b.utilityType === bill.utilityType));
      let updated: MonthlyUtilityBill[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = bill;
      } else {
        updated = [bill, ...prev];
      }
      return updated;
    });
    upsertUtilityBillToDb(bill);

    // If this bill is for the room's current month, sync room dewa/wifi state
    if (bill.month === selectedMonth) {
      setRooms(prev =>
        prev.map(r => {
          if (r.id !== bill.roomId) return r;
          const updatedRoom: RoomUnit = (bill.utilityType === 'DEWA' || bill.utilityType === 'SEWA')
            ? {
                ...r,
                dewaBill: {
                  provider: bill.utilityType,
                  accountNumber: bill.accountNumber || r.dewaBill.accountNumber,
                  amount: bill.amount,
                  dueDate: bill.dueDate || r.dewaBill.dueDate,
                  status: bill.status,
                }
              }
            : {
                ...r,
                wifiBill: {
                  provider: 'Du',
                  accountNumber: bill.accountNumber || r.wifiBill.accountNumber,
                  amount: bill.amount,
                  dueDate: bill.dueDate || r.wifiBill.dueDate,
                  status: bill.status,
                }
              };
          upsertRoomToDb(updatedRoom);
          return updatedRoom;
        })
      );
    }
  };

  // --- Carry Forward Month Handler ---
  const handleCarryForwardMonth = () => {
    const months = ['Jun-2026', 'Jul-2026', 'Aug-2026', 'Sep-2026', 'Oct-2026', 'Nov-2026', 'Dec-2026'];
    const currentIndex = months.indexOf(selectedMonth);
    const nextMonth = currentIndex >= 0 && currentIndex < months.length - 1 ? months[currentIndex + 1] : 'Oct-2026';

    const confirmed = window.confirm(
      `Carry forward all active tenants and their bed allocations from ${selectedMonth} to ${nextMonth}?\n\n` +
      `• Current ${selectedMonth} collection data will remain safely saved in history.\n` +
      `• For ${nextMonth}, payment statuses will start fresh as Due so you can track the new month's collections.`
    );
    if (!confirmed) return;

    setTenants(prev =>
      prev.map(t => {
        if (t.status !== 'Active') return t;
        const updatedHistory = {
          ...(t.monthStatusHistory || {}),
          [selectedMonth]: t.currentMonthStatus,
        };
        const updated: Tenant = {
          ...t,
          stayMonth: nextMonth,
          monthStatusHistory: updatedHistory,
          currentMonthStatus: 'Due',
        };
        upsertTenantToDb(updated);
        return updated;
      })
    );

    setSelectedMonth(nextMonth);
    alert(`Successfully carried forward all active tenants to ${nextMonth}!`);
  };

  // --- Customer Inquiry Handlers ---
  const handleAddInquiry = (inquiry: CustomerInquiry) => {
    setInquiries(prev => [inquiry, ...prev]);
    upsertInquiryToDb(inquiry);
  };

  const handleUpdateInquiry = (inquiry: CustomerInquiry) => {
    setInquiries(prev => prev.map(i => i.id === inquiry.id ? inquiry : i));
    upsertInquiryToDb(inquiry);
  };

  const handleDeleteInquiry = (inquiryId: string) => {
    setInquiries(prev => prev.filter(i => i.id !== inquiryId));
    deleteInquiryFromDb(inquiryId);
  };

  const handleBatchUpdateInquiryStatus = (ids: string[], status: string, date: string) => {
    setInquiries(prev =>
      prev.map(i => ids.includes(i.id) ? { ...i, status: status as any, lastContactedDate: date } : i)
    );
    batchUpdateInquiryStatus(ids, status, date);
  };

  const handleExportExcel = () => {
    if (!currentBuilding) return;
    exportFlatToExcel(currentBuilding, currentLocation, tenants);
  };

  // If not logged in, show Login Screen
  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const totalUrgentCount = 
    tenantNotifications.filter(n => n.status === 'overdue' || n.status === 'due_today').length +
    chequeNotifications.length +
    utilityNotifications.filter(u => u.status === 'overdue' || u.status === 'due_today').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onChangeView={setCurrentView}
        locations={locations}
        buildings={buildings}
        rooms={rooms}
        selectedLocationId={selectedLocationId}
        selectedBuildingId={selectedBuildingId}
        selectedRoomId={selectedRoomId}
        onSelectLocation={setSelectedLocationId}
        onSelectBuilding={setSelectedBuildingId}
        onSelectRoom={setSelectedRoomId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddTenant={() => {
          setAddTenantSection('HALL');
          setIsAddTenantOpen(true);
        }}
        onOpenAddBuilding={() => setIsAddBuildingOpen(true)}
        onOpenAddExpense={() => handleOpenAddExpense()}
        onOpenRentCalculator={() => setIsRentCalculatorOpen(true)}
        onOpenPastTenants={() => setIsPastTenantsOpen(true)}
        onOpenMonthlyBills={() => setIsMonthlyBillsOpen(true)}
        pastTenantsCount={pastTenants.length}
        inquiryCount={inquiries.length}
        onToggleNotifications={() => setIsNotificationOpen(prev => !prev)}
        onExportExcel={handleExportExcel}
        onLogout={handleLogout}
        tenantNotifications={tenantNotifications}
        chequeNotifications={chequeNotifications}
        utilityNotifications={utilityNotifications}
        isNotificationOpen={isNotificationOpen}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* Urgent Deadlines Alert Banner */}
        {totalUrgentCount > 0 && (
          <div className="mb-5 bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
                <AlertTriangle className="w-4 h-4 text-slate-300" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-white">
                  {totalUrgentCount} Action Items Requiring Attention
                </h3>
                <p className="text-xs text-slate-400">
                  {tenantNotifications.length > 0 && `${tenantNotifications.length} tenant rents • `}
                  {chequeNotifications.length > 0 && `${chequeNotifications.length} owner cheques • `}
                  {utilityNotifications.length > 0 && `${utilityNotifications.length} utility bills`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="px-3.5 py-1.5 bg-white text-slate-950 font-semibold rounded-lg text-xs hover:bg-slate-100 transition shadow-sm border border-slate-200 cursor-pointer"
            >
              View Alerts
            </button>
          </div>
        )}

        {/* --- VIEW 1: DEDICATED BUILDINGS PAGE --- */}
        {currentView === 'buildings' && (
          <BuildingsPage
            buildings={buildings}
            rooms={rooms}
            tenants={tenants}
            locations={locations}
            onOpenAddBuilding={() => setIsAddBuildingOpen(true)}
            onDeleteBuilding={handleDeleteBuilding}
            onOpenAddRoom={(building) => {
              setRoomModalBuilding(building);
              setRoomModalTargetRoom(null);
              setIsManageRoomOpen(true);
            }}
            onEditRoom={(building, room) => {
              setRoomModalBuilding(building);
              setRoomModalTargetRoom(room);
              setIsManageRoomOpen(true);
            }}
            onSelectRoomInSheet={(bldId, roomId) => {
              setSelectedBuildingId(bldId);
              setSelectedRoomId(roomId);
              setCurrentView('sheet');
            }}
            onQuickToggleBillStatus={handleQuickToggleBillStatus}
          />
        )}

        {/* --- VIEW 3: DEDICATED PROFIT & LOSS DASHBOARD --- */}
        {currentView === 'profit_loss' && (
          <ProfitAndLossPage
            rooms={rooms}
            buildings={buildings}
            tenants={tenants}
            expenses={expenses}
            onOpenAddExpense={handleOpenAddExpense}
            onDeleteExpense={handleDeleteExpense}
            onSelectRoomInSheet={(bldId, roomId) => {
              setSelectedBuildingId(bldId);
              setSelectedRoomId(roomId);
              setCurrentView('sheet');
            }}
          />
        )}

        {/* --- VIEW 4: CUSTOMER INQUIRIES & WHATSAPP BROADCAST --- */}
        {currentView === 'followups' && (
          <FollowUpPage
            inquiries={inquiries}
            selectedMonth={selectedMonth}
            onAddInquiry={handleAddInquiry}
            onUpdateInquiry={handleUpdateInquiry}
            onDeleteInquiry={handleDeleteInquiry}
            onBatchUpdateStatus={handleBatchUpdateInquiryStatus}
            onConvertToTenant={(inq) => {
              setAddTenantSection('HALL');
              setIsAddTenantOpen(true);
            }}
          />
        )}

        {/* --- VIEW 2: TENANTS SPREADSHEET VIEW --- */}
        {currentView === 'sheet' && (
          <>
            {/* Monthly Utility Alert Prompt */}
            {(currentRoom?.dewaBill?.status === 'Due' || currentRoom?.wifiBill?.status === 'Due') && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2.5 text-amber-900">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block">Monthly Utility Bills Notice ({selectedMonth})</span>
                    <span className="text-amber-800 text-[11px]">
                      {currentBuilding?.name} Room {currentRoom?.roomNumber} has pending {currentRoom?.dewaBill?.status === 'Due' ? 'DEWA/SEWA' : ''} {currentRoom?.wifiBill?.status === 'Due' ? 'Wi-Fi' : ''} bills for this month.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMonthlyBillsOpen(true)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-2xs transition cursor-pointer text-xs"
                >
                  Enter & Settle {selectedMonth} Bills
                </button>
              </div>
            )}

            {/* Building & Room Selector Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <span>{currentLocation?.name || 'Dubai'}</span>
                  <span>•</span>
                  <span>{currentBuilding?.name}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                  Room {currentRoom?.roomNumber || '103'} — {currentRoom?.roomType || 'Partition Flat'}
                </h2>
              </div>

              {/* Utility Badges for this Room */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <Zap className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-medium text-slate-700">DEWA: AED {currentRoom?.dewaBill?.amount}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                    currentRoom?.dewaBill?.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {currentRoom?.dewaBill?.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <Wifi className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-medium text-slate-700">Wi-Fi: AED {currentRoom?.wifiBill?.amount}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                    currentRoom?.wifiBill?.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {currentRoom?.wifiBill?.status}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setAddTenantSection('HALL');
                    setIsAddTenantOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Tenant</span>
                </button>
              </div>
            </div>

            {/* Room Stats Cards */}
            {currentBuilding && (
              <StatsCards
                tenants={currentRoomTenants}
                flatName={`${currentBuilding.name} - Room ${currentRoom?.roomNumber}`}
              />
            )}

            {/* The Live Interactive Spreadsheet View */}
            {currentBuilding && currentRoom ? (
              <TenantSheet
                building={currentBuilding}
                room={currentRoom}
                tenants={currentRoomTenants}
                searchQuery={searchQuery}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                onCarryForwardMonth={handleCarryForwardMonth}
                onEditTenant={setEditingTenant}
                onDeleteTenant={handleDeleteTenant}
                onCheckOutTenant={setCheckoutTenant}
                onToggleKey={handleToggleKey}
                onStatusClick={setPaymentTenant}
                onAddTenantToSection={(sec) => {
                  setAddTenantSection(sec);
                  setIsAddTenantOpen(true);
                }}
              />
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">No room selected</h3>
                <p className="text-xs text-slate-500 mt-1">Select or create a room to view tenant spreadsheet</p>
              </div>
            )}
          </>
        )}

      </main>

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        tenantNotifications={tenantNotifications}
        chequeNotifications={chequeNotifications}
        utilityNotifications={utilityNotifications}
        onMarkTenantPaid={handleMarkTenantPaid}
        onMarkUtilityPaid={handleMarkUtilityPaid}
      />

      {/* Modals */}
      {currentBuilding && currentRoom && (
        <AddTenantModal
          isOpen={isAddTenantOpen}
          onClose={() => setIsAddTenantOpen(false)}
          building={currentBuilding}
          room={currentRoom}
          nextSno={currentRoomTenants.length + 1}
          defaultSection={addTenantSection}
          onAddTenant={handleAddTenant}
        />
      )}

      <AddBuildingModal
        isOpen={isAddBuildingOpen}
        onClose={() => setIsAddBuildingOpen(false)}
        locations={locations}
        onAddBuilding={handleAddBuilding}
      />

      {roomModalBuilding && (
        <ManageRoomModal
          isOpen={isManageRoomOpen}
          onClose={() => {
            setIsManageRoomOpen(false);
            setRoomModalBuilding(null);
            setRoomModalTargetRoom(null);
          }}
          building={roomModalBuilding}
          room={roomModalTargetRoom}
          onSaveRoom={handleSaveRoom}
          onDeleteRoom={handleDeleteRoom}
        />
      )}

      <EditTenantModal
        isOpen={!!editingTenant}
        onClose={() => setEditingTenant(null)}
        tenant={editingTenant}
        onUpdateTenant={handleUpdateTenant}
        onDeleteTenant={handleDeleteTenant}
      />

      <RecordPaymentModal
        isOpen={!!paymentTenant}
        onClose={() => setPaymentTenant(null)}
        tenant={paymentTenant}
        onSavePayment={handleSavePayment}
      />

      {/* Tenant Out (Checkout) & Settlement Modal */}
      <CheckOutModal
        isOpen={!!checkoutTenant}
        onClose={() => setCheckoutTenant(null)}
        tenant={checkoutTenant}
        onConfirmCheckOut={handleConfirmCheckOut}
      />

      {/* Pro-Rata Rent Calculator Modal */}
      <RentCalculatorModal
        isOpen={isRentCalculatorOpen}
        onClose={() => setIsRentCalculatorOpen(false)}
      />

      {/* Past Tenants Archive Modal */}
      <PastTenantsModal
        isOpen={isPastTenantsOpen}
        onClose={() => setIsPastTenantsOpen(false)}
        pastTenants={pastTenants}
        buildings={buildings}
        rooms={rooms}
      />

      {/* Flat Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setAddExpenseRoomId(undefined);
        }}
        rooms={rooms}
        buildings={buildings}
        defaultRoomId={addExpenseRoomId || selectedRoomId}
        onAddExpense={handleAddExpense}
      />

      {/* Monthly Utility Bills (DEWA / SEWA / Wi-Fi) Modal */}
      <MonthlyBillsModal
        isOpen={isMonthlyBillsOpen}
        onClose={() => setIsMonthlyBillsOpen(false)}
        rooms={rooms}
        buildings={buildings}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        utilityBills={utilityBills}
        onSaveBill={handleSaveUtilityBill}
      />

      {/* Persistent Footer with Live Database Indicator */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
        <p>Dubai Property Management CRM • Buildings, Room Units, Utilities & Financial Ledger</p>
        <div className="flex items-center gap-2 text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span>PostgreSQL Cloud Synced</span>
        </div>
      </footer>
    </div>
  );
};

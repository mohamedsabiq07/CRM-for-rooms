import React, { useState, useEffect, useMemo } from 'react';
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
import { 
  LocationItem, 
  Building, 
  RoomUnit, 
  Tenant, 
  RentNotification, 
  OwnerChequeNotification, 
  UtilityNotification 
} from './types/crm';
import { INITIAL_LOCATIONS, INITIAL_BUILDINGS, INITIAL_ROOMS, INITIAL_TENANTS } from './data/initialData';
import { calculateRentDueInfo, parseFlexibleDate } from './utils/dateUtils';
import { exportFlatToExcel } from './utils/exportUtils';
import { AlertTriangle, Plus, Building2, DoorOpen, ArrowLeft, Zap, Wifi } from 'lucide-react';

export const App: React.FC = () => {
  // --- Current View State ('sheet' or 'buildings') ---
  const [currentView, setCurrentView] = useState<'sheet' | 'buildings'>('sheet');

  // --- Persistent Storage State ---
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

  // Selected Building & Room
  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => {
    return locations[0]?.id || 'loc-barsha';
  });

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(() => {
    return buildings[0]?.id || 'bld-vienna';
  });

  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
    return 'room-vienna-103';
  });

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [addTenantSection, setAddTenantSection] = useState('HALL');
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);

  // Manage Room Modal State
  const [isManageRoomOpen, setIsManageRoomOpen] = useState(false);
  const [roomModalBuilding, setRoomModalBuilding] = useState<Building | null>(null);
  const [roomModalTargetRoom, setRoomModalTargetRoom] = useState<RoomUnit | null>(null);

  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [paymentTenant, setPaymentTenant] = useState<Tenant | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('room_crm_locations', JSON.stringify(locations));
  }, [locations]);

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

  // --- Dynamic Unified Notifications Engine ---

  // 1. Tenant 30-Day Rent Due Notifications
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

  // 2. Owner Rent Cheque Notifications
  const chequeNotifications: OwnerChequeNotification[] = useMemo(() => {
    const alerts: OwnerChequeNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    buildings.forEach(b => {
      const dueDate = parseFlexibleDate(b.nextChequeDueDate);
      if (dueDate) {
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 45) { // Notify within 45 days of upcoming owner cheque
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

  // 3. Room DEWA & Wi-Fi Utility Due Notifications
  const utilityNotifications: UtilityNotification[] = useMemo(() => {
    const alerts: UtilityNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    rooms.forEach(r => {
      const bld = buildings.find(b => b.id === r.buildingId);
      const bldName = bld?.name || 'Building';

      // DEWA check
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

      // Wi-Fi check
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
  const handleAddTenant = (newTenantData: Omit<Tenant, 'id'>) => {
    const newId = `t-${Date.now()}`;
    const newTenant: Tenant = {
      ...newTenantData,
      id: newId,
    };
    setTenants(prev => [...prev, newTenant]);
  };

  const handleUpdateTenant = (updated: Tenant) => {
    setTenants(prev => prev.map(t => (t.id === updated.id ? updated : t)));
  };

  const handleDeleteTenant = (id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleKey = (tenantId: string, keyType: 'cupboard' | 'door') => {
    setTenants(prev =>
      prev.map(t => {
        if (t.id !== tenantId) return t;
        return {
          ...t,
          [keyType === 'cupboard' ? 'cupboardKey' : 'doorKey']:
            keyType === 'cupboard' ? !t.cupboardKey : !t.doorKey,
        };
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
        return {
          ...t,
          currentMonthStatus: status,
          remarks: remarks || t.remarks,
          lastPaidDate: date,
        };
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

  const handleMarkUtilityPaid = (roomId: string, type: 'DEWA' | 'Wi-Fi') => {
    setRooms(prev =>
      prev.map(r => {
        if (r.id !== roomId) return r;
        if (type === 'DEWA') {
          return { ...r, dewaBill: { ...r.dewaBill, status: 'Paid' } };
        } else {
          return { ...r, wifiBill: { ...r.wifiBill, status: 'Paid' } };
        }
      })
    );
  };

  const handleQuickToggleBillStatus = (roomId: string, billType: 'dewa' | 'wifi') => {
    setRooms(prev =>
      prev.map(r => {
        if (r.id !== roomId) return r;
        if (billType === 'dewa') {
          const nextStatus = r.dewaBill?.status === 'Paid' ? 'Due' : 'Paid';
          return { ...r, dewaBill: { ...r.dewaBill, status: nextStatus } };
        } else {
          const nextStatus = r.wifiBill?.status === 'Paid' ? 'Due' : 'Paid';
          return { ...r, wifiBill: { ...r.wifiBill, status: nextStatus } };
        }
      })
    );
  };

  // Add Building Handler
  const handleAddBuilding = (
    buildingData: Omit<Building, 'id'>, 
    initialRoomsData: { roomNumber: string; roomType: string }[]
  ) => {
    const newBldId = `bld-${Date.now()}`;
    const newBld: Building = {
      ...buildingData,
      id: newBldId,
    };

    const newRooms: RoomUnit[] = initialRoomsData.map((rm, idx) => ({
      id: `room-${Date.now()}-${idx}`,
      buildingId: newBldId,
      roomNumber: rm.roomNumber,
      roomType: rm.roomType,
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
  };

  // Add or Edit Room Handler
  const handleSaveRoom = (roomData: Omit<RoomUnit, 'id'>, roomId?: string) => {
    if (roomId) {
      // Edit existing
      setRooms(prev => prev.map(r => (r.id === roomId ? { ...roomData, id: roomId } : r)));
    } else {
      // Add new
      const newRoom: RoomUnit = {
        ...roomData,
        id: `room-${Date.now()}`,
      };
      setRooms(prev => [...prev, newRoom]);
      setSelectedRoomId(newRoom.id);
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!currentBuilding) return;
    exportFlatToExcel(currentBuilding, currentLocation, tenants);
  };

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
        onToggleNotifications={() => setIsNotificationOpen(prev => !prev)}
        onExportExcel={handleExportExcel}
        tenantNotifications={tenantNotifications}
        chequeNotifications={chequeNotifications}
        utilityNotifications={utilityNotifications}
        isNotificationOpen={isNotificationOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* Urgent Deadlines Alert Banner */}
        {totalUrgentCount > 0 && (
          <div className="mb-5 bg-gradient-to-r from-rose-500 via-amber-500 to-amber-600 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  {totalUrgentCount} Deadlines Requiring Action!
                </h3>
                <p className="text-xs text-white/90">
                  {tenantNotifications.length > 0 && `${tenantNotifications.length} tenant rents • `}
                  {chequeNotifications.length > 0 && `${chequeNotifications.length} owner cheques • `}
                  {utilityNotifications.length > 0 && `${utilityNotifications.length} DEWA/Wi-Fi bills`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="px-4 py-1.5 bg-white text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-50 transition shadow-sm"
            >
              View Alerts & Call
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

        {/* --- VIEW 2: TENANTS SPREADSHEET VIEW --- */}
        {currentView === 'sheet' && (
          <>
            {/* Building & Room Selector Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>{currentLocation?.name || 'Dubai'}</span>
                  <span>•</span>
                  <span>{currentBuilding?.name}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
                  Room {currentRoom?.roomNumber || '103'} — {currentRoom?.roomType || 'Partition Flat'}
                </h2>
              </div>

              {/* Utility Badges for this Room */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-semibold text-slate-700">DEWA: AED {currentRoom?.dewaBill?.amount}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    currentRoom?.dewaBill?.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {currentRoom?.dewaBill?.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                  <Wifi className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold text-slate-700">Wi-Fi: AED {currentRoom?.wifiBill?.amount}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    currentRoom?.wifiBill?.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {currentRoom?.wifiBill?.status}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setAddTenantSection('HALL');
                    setIsAddTenantOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
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
                onEditTenant={setEditingTenant}
                onDeleteTenant={handleDeleteTenant}
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

      {/* Add New Tenant Modal */}
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

      {/* Add New Building Modal */}
      <AddBuildingModal
        isOpen={isAddBuildingOpen}
        onClose={() => setIsAddBuildingOpen(false)}
        locations={locations}
        onAddBuilding={handleAddBuilding}
      />

      {/* Manage Room & Utility Bills Modal */}
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

      {/* Edit Tenant Details Modal */}
      <EditTenantModal
        isOpen={!!editingTenant}
        onClose={() => setEditingTenant(null)}
        tenant={editingTenant}
        onUpdateTenant={handleUpdateTenant}
        onDeleteTenant={handleDeleteTenant}
      />

      {/* Record Payment / Settle Rent Modal */}
      <RecordPaymentModal
        isOpen={!!paymentTenant}
        onClose={() => setPaymentTenant(null)}
        tenant={paymentTenant}
        onSavePayment={handleSavePayment}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400">
        <p>Dubai Property Management CRM • Buildings, Room Numbers, DEWA, Wi-Fi & Partitions</p>
      </footer>
    </div>
  );
};

import { LocationItem, Building, RoomUnit, Tenant } from '../types/crm';

export const INITIAL_LOCATIONS: LocationItem[] = [
  { id: 'loc-barsha', name: 'Barsha', city: 'Dubai' },
  { id: 'loc-deira', name: 'Deira', city: 'Dubai' },
  { id: 'loc-heights', name: 'Barsha Heights', city: 'Dubai' },
];

export const INITIAL_BUILDINGS: Building[] = [
  {
    id: 'bld-vienna',
    locationId: 'loc-barsha',
    name: 'Vienna Building',
    address: 'Al Barsha 1, Near Mall of the Emirates',
    ownerRentAnnual: 78000,
    paymentTerms: 'Quarterly',
    chequeAmount: 19500,
    nextChequeDueDate: '15.10.2026',
    ownerName: 'Al Futtaim Real Estate',
    ownerPhone: '+971 4 200 1000',
    notes: 'Main 6-story building with 2 rented room flats'
  },
  {
    id: 'bld-al-waleed',
    locationId: 'loc-barsha',
    name: 'Al Waleed Building',
    address: 'Al Barsha 1, Street 14',
    ownerRentAnnual: 76000,
    paymentTerms: 'Quarterly',
    chequeAmount: 19000,
    nextChequeDueDate: '01.11.2026',
    ownerName: 'Al Waleed Properties LLC',
    ownerPhone: '+971 4 330 2200',
    notes: 'Near Lulu Hypermarket'
  },
  {
    id: 'bld-al-shafar',
    locationId: 'loc-heights',
    name: 'Al Shafar Tower',
    address: 'Barsha Heights (TECOM), Block B',
    ownerRentAnnual: 84000,
    paymentTerms: 'Quarterly',
    chequeAmount: 21000,
    nextChequeDueDate: '20.09.2026',
    ownerName: 'Al Shafar Real Estate Management',
    ownerPhone: '+971 4 450 3300',
    notes: 'High-rise tower near Metro Station'
  },
  {
    id: 'bld-bin-thani',
    locationId: 'loc-barsha',
    name: 'Bin Thani Residence',
    address: 'Al Barsha 2, Near Pond Park',
    ownerRentAnnual: 75000,
    paymentTerms: 'Semi-Annually',
    chequeAmount: 37500,
    nextChequeDueDate: '05.12.2026',
    ownerName: 'Bin Thani Investment Group',
    ownerPhone: '+971 4 280 4400',
    notes: 'Quiet residential area'
  },
  {
    id: 'bld-al-habbai',
    locationId: 'loc-barsha',
    name: 'Al Habbai Building',
    address: 'Al Barsha 1, Behind Mashreq Metro',
    ownerRentAnnual: 72000,
    paymentTerms: 'Quarterly',
    chequeAmount: 18000,
    nextChequeDueDate: '10.10.2026',
    ownerName: 'Habbai Real Estate',
    ownerPhone: '+971 4 390 5500',
    notes: 'Prime location, easy transport'
  },
  {
    id: 'bld-arenco',
    locationId: 'loc-barsha',
    name: 'Arenco Building',
    address: 'Al Barsha 1, Sheikh Zayed Road side',
    ownerRentAnnual: 80000,
    paymentTerms: 'Annually',
    chequeAmount: 80000,
    nextChequeDueDate: '15.01.2027',
    ownerName: 'Arenco Real Estate Ltd',
    ownerPhone: '+971 4 320 6600',
    notes: 'Commercial/residential development'
  }
];

// Alias for backward compatibility
export const INITIAL_FLATS = INITIAL_BUILDINGS;

export const INITIAL_ROOMS: RoomUnit[] = [
  // --- VIENNA BUILDING ROOMS ---
  {
    id: 'room-vienna-103',
    buildingId: 'bld-vienna',
    roomNumber: '103',
    roomType: 'Partition Flat (Vienna - Partition)',
    notes: 'Main partition flat containing 15 bedspaces/partitions',
    dewaBill: {
      provider: 'DEWA',
      accountNumber: '2201948572',
      amount: 950,
      dueDate: '10.09.2026',
      status: 'Due',
      notes: 'Electricity & Water'
    },
    wifiBill: {
      provider: 'Du Home Fast 500Mbps',
      accountNumber: '04-892-1140',
      amount: 389,
      dueDate: '15.09.2026',
      status: 'Due',
      notes: 'High speed router in Hall'
    }
  },
  {
    id: 'room-vienna-601',
    buildingId: 'bld-vienna',
    roomNumber: '601',
    roomType: 'Master Bedspace & Partition',
    notes: 'Top floor 2BHK converted into partitions',
    dewaBill: {
      provider: 'DEWA',
      accountNumber: '2201948573',
      amount: 820,
      dueDate: '10.09.2026',
      status: 'Paid',
      lastPaidDate: '01.09.2026'
    },
    wifiBill: {
      provider: 'Etisalat eLife',
      accountNumber: '04-892-1141',
      amount: 409,
      dueDate: '15.09.2026',
      status: 'Paid',
      lastPaidDate: '01.09.2026'
    }
  },

  // --- AL WALEED BUILDING ROOMS ---
  {
    id: 'room-waleed-204',
    buildingId: 'bld-al-waleed',
    roomNumber: '204',
    roomType: 'Bedspace Unit',
    dewaBill: {
      provider: 'DEWA',
      accountNumber: '2202394801',
      amount: 890,
      dueDate: '12.09.2026',
      status: 'Paid',
      lastPaidDate: '02.09.2026'
    },
    wifiBill: {
      provider: 'Du',
      accountNumber: '04-712-3301',
      amount: 389,
      dueDate: '18.09.2026',
      status: 'Paid',
      lastPaidDate: '02.09.2026'
    }
  },
  {
    id: 'room-waleed-408',
    buildingId: 'bld-al-waleed',
    roomNumber: '408',
    roomType: 'Partition Flat',
    dewaBill: {
      provider: 'DEWA',
      accountNumber: '2202394802',
      amount: 780,
      dueDate: '12.09.2026',
      status: 'Due'
    },
    wifiBill: {
      provider: 'Du',
      accountNumber: '04-712-3302',
      amount: 389,
      dueDate: '18.09.2026',
      status: 'Due'
    }
  },

  // --- AL SHAFAR TOWER ROOMS ---
  {
    id: 'room-shafar-302',
    buildingId: 'bld-al-shafar',
    roomNumber: '302',
    roomType: 'Partition Unit',
    dewaBill: {
      provider: 'DEWA',
      accountNumber: '2203819201',
      amount: 920,
      dueDate: '08.09.2026',
      status: 'Overdue'
    },
    wifiBill: {
      provider: 'Etisalat',
      accountNumber: '04-981-4401',
      amount: 409,
      dueDate: '14.09.2026',
      status: 'Due'
    }
  },
  {
    id: 'room-shafar-705',
    buildingId: 'bld-al-shafar',
    roomNumber: '705',
    roomType: 'Studio Partition',
    dewaBill: {
      provider: 'DEWA',
      accountNumber: '2203819202',
      amount: 860,
      dueDate: '08.09.2026',
      status: 'Paid',
      lastPaidDate: '01.09.2026'
    },
    wifiBill: {
      provider: 'Du',
      accountNumber: '04-981-4402',
      amount: 389,
      dueDate: '14.09.2026',
      status: 'Paid',
      lastPaidDate: '01.09.2026'
    }
  },

  // --- BIN THANI RESIDENCE ROOMS ---
  {
    id: 'room-thani-105',
    buildingId: 'bld-bin-thani',
    roomNumber: '105',
    roomType: 'Partition Flat',
    dewaBill: {
      provider: 'DEWA',
      accountNumber: '2204928101',
      amount: 840,
      dueDate: '22.09.2026',
      status: 'Paid'
    },
    wifiBill: {
      provider: 'Du',
      accountNumber: '04-620-5501',
      amount: 389,
      dueDate: '25.09.2026',
      status: 'Paid'
    }
  },
  {
    id: 'room-thani-502',
    buildingId: 'bld-bin-thani',
    roomNumber: '502',
    roomType: 'Partition Flat',
    dewaBill: {
      provider: 'DEWA',
      accountNumber: '2204928102',
      amount: 790,
      dueDate: '22.09.2026',
      status: 'Due'
    },
    wifiBill: {
      provider: 'Du',
      accountNumber: '04-620-5502',
      amount: 389,
      dueDate: '25.09.2026',
      status: 'Due'
    }
  },

  // --- AL HABBAI BUILDING ROOMS ---
  {
    id: 'room-habbai-201',
    buildingId: 'bld-al-habbai',
    roomNumber: '201',
    roomType: 'Partition Unit',
    dewaBill: {
      provider: 'DEWA',
      accountNumber: '2205837201',
      amount: 810,
      dueDate: '16.09.2026',
      status: 'Paid'
    },
    wifiBill: {
      provider: 'Du',
      accountNumber: '04-510-6601',
      amount: 389,
      dueDate: '20.09.2026',
      status: 'Paid'
    }
  },
  {
    id: 'room-habbai-304',
    buildingId: 'bld-al-habbai',
    roomNumber: '304',
    roomType: 'Partition Unit',
    dewaBill: {
      provider: 'DEWA',
      accountNumber: '2205837202',
      amount: 830,
      dueDate: '16.09.2026',
      status: 'Due'
    },
    wifiBill: {
      provider: 'Du',
      accountNumber: '04-510-6602',
      amount: 389,
      dueDate: '20.09.2026',
      status: 'Due'
    }
  },

  // --- ARENCO BUILDING ROOMS ---
  {
    id: 'room-arenco-401',
    buildingId: 'bld-arenco',
    roomNumber: '401',
    roomType: 'Partition Flat',
    dewaBill: {
      provider: 'DEWA',
      accountNumber: '2206748301',
      amount: 880,
      dueDate: '18.09.2026',
      status: 'Paid'
    },
    wifiBill: {
      provider: 'Etisalat',
      accountNumber: '04-430-7701',
      amount: 409,
      dueDate: '22.09.2026',
      status: 'Paid'
    }
  },
  {
    id: 'room-arenco-802',
    buildingId: 'bld-arenco',
    roomNumber: '802',
    roomType: 'Partition Flat',
    dewaBill: {
      provider: 'DEWA',
      accountNumber: '2206748302',
      amount: 910,
      dueDate: '18.09.2026',
      status: 'Due'
    },
    wifiBill: {
      provider: 'Du',
      accountNumber: '04-430-7702',
      amount: 389,
      dueDate: '22.09.2026',
      status: 'Due'
    }
  }
];

export const INITIAL_TENANTS: Tenant[] = [
  // --- VIENNA BUILDING - ROOM 103 (15 REFERENCE TENANTS) ---
  {
    id: 't-1',
    sno: 1,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'Lavanya',
    place: 'Karnataka',
    phone: '+971501234501',
    deposit: 300,
    depositNote: '',
    joiningDate: '07.12.2025',
    status: 'Active',
    section: 'HALL',
    partition: 'p1',
    rentAmount: 750,
    cupboardKey: true,
    doorKey: true,
    currentMonthStatus: 'Paid',
    remarks: '',
    lastPaidDate: '07.08.2026'
  },
  {
    id: 't-2',
    sno: 2,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'Indonesian girl anita',
    place: 'Indonesia',
    phone: '+971501234502',
    deposit: 0,
    depositNote: 'No Advance',
    joiningDate: '31.03.2026',
    status: 'Active',
    section: 'HALL',
    partition: 'p2',
    rentAmount: 700,
    cupboardKey: true,
    doorKey: false,
    currentMonthStatus: 'Due',
    remarks: '',
    lastPaidDate: '31.07.2026'
  },
  {
    id: 't-3',
    sno: 3,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'jamuen wife',
    place: 'Malayali',
    phone: '+971501234503',
    deposit: 200,
    depositNote: '',
    joiningDate: '27.07.2026',
    status: 'Active',
    section: 'HALL',
    partition: 'p2',
    rentAmount: 750,
    cupboardKey: false,
    doorKey: false,
    currentMonthStatus: 'Due',
    remarks: '',
    lastPaidDate: '27.07.2026'
  },
  {
    id: 't-4',
    sno: 4,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'Sunanda',
    place: 'Malayali',
    phone: '+971501234504',
    deposit: 100,
    depositNote: '',
    joiningDate: '28.06.2026',
    status: 'Active',
    section: 'HALL',
    partition: 'p3',
    rentAmount: 800,
    cupboardKey: true,
    doorKey: true,
    currentMonthStatus: 'Due', // Highlighted yellow in photo
    remarks: '',
    lastPaidDate: '28.07.2026'
  },
  {
    id: 't-5',
    sno: 5,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'Sneha',
    place: 'Malayali',
    phone: '+971501234505',
    deposit: 200,
    depositNote: '',
    joiningDate: '01.05.2026',
    status: 'Active',
    section: 'HALL',
    partition: 'p3',
    rentAmount: 800,
    cupboardKey: false,
    doorKey: false,
    currentMonthStatus: 'Paid',
    remarks: '',
    lastPaidDate: '01.08.2026'
  },
  {
    id: 't-6',
    sno: 6,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'Ashwathy',
    place: 'Malayali',
    phone: '+971501234506',
    deposit: 0,
    depositNote: '-',
    joiningDate: '',
    status: 'Active',
    section: 'HALL',
    partition: 'p4',
    rentAmount: 750,
    cupboardKey: false,
    doorKey: false,
    currentMonthStatus: 'Pending',
    remarks: 'she has money'
  },
  {
    id: 't-7',
    sno: 7,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'Sheena',
    place: 'Malayali',
    phone: '+971501234507',
    deposit: 100,
    depositNote: '',
    joiningDate: '31.07.2025',
    status: 'Active',
    section: 'HALL',
    partition: 'p4',
    rentAmount: 750,
    cupboardKey: true,
    doorKey: true,
    currentMonthStatus: 'Pending',
    remarks: 'she will do it before 10th',
    lastPaidDate: '31.07.2026'
  },
  {
    id: 't-8',
    sno: 8,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'Mageswari',
    place: 'Tamil',
    phone: '+971501234508',
    deposit: 100,
    depositNote: '',
    joiningDate: 'check',
    status: 'Active',
    section: 'HALL',
    partition: 'p5',
    rentAmount: 700,
    cupboardKey: false,
    doorKey: false,
    currentMonthStatus: 'Pending',
    remarks: 'she came at night'
  },
  {
    id: 't-9',
    sno: 9,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'Sufiya',
    place: 'Malayali',
    phone: '+971501234509',
    deposit: 0,
    depositNote: '-',
    joiningDate: '',
    status: 'Active',
    section: 'HALL',
    partition: 'p5',
    rentAmount: 700,
    cupboardKey: false,
    doorKey: false,
    currentMonthStatus: 'Pending',
    remarks: 'amount with Neenu'
  },

  // --- ROOM SECTION ---
  {
    id: 't-10',
    sno: 9,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'Marya',
    place: 'Tamil pen',
    phone: '+971501234510',
    deposit: 100,
    depositNote: '',
    joiningDate: '01.07.2025',
    status: 'Active',
    section: 'ROOM',
    partition: 'p6',
    rentAmount: 850,
    cupboardKey: true,
    doorKey: true,
    currentMonthStatus: 'Paid',
    remarks: '',
    lastPaidDate: '01.08.2026'
  },
  {
    id: 't-11',
    sno: 10,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'Neenu',
    place: 'Malayali',
    phone: '+971501234511',
    deposit: 100,
    depositNote: '',
    joiningDate: '31.08.2025',
    status: 'Active',
    section: 'ROOM',
    partition: 'p6',
    rentAmount: 850,
    cupboardKey: true,
    doorKey: true,
    currentMonthStatus: 'Partial',
    remarks: '500 balance',
    lastPaidDate: '31.07.2026'
  },
  {
    id: 't-12',
    sno: 3,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'Samadhi',
    place: 'Srilankan',
    phone: '+971501234512',
    deposit: 150,
    depositNote: '',
    joiningDate: '',
    status: 'Active',
    section: 'ROOM',
    partition: 'p7',
    rentAmount: 800,
    cupboardKey: false,
    doorKey: false,
    currentMonthStatus: 'Pending',
    remarks: ''
  },
  {
    id: 't-13',
    sno: 12,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'Sruthy',
    place: 'Malayali',
    phone: '+971501234513',
    deposit: 200,
    depositNote: '',
    joiningDate: '01.05.2024',
    status: 'Active',
    section: 'ROOM',
    partition: 'p7',
    rentAmount: 800,
    cupboardKey: true,
    doorKey: true,
    currentMonthStatus: 'Paid',
    remarks: '',
    lastPaidDate: '01.08.2026'
  },
  {
    id: 't-14',
    sno: 13,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: 'Deepika',
    place: 'Malayali',
    phone: '+971501234514',
    deposit: 150,
    depositNote: '',
    joiningDate: '01.05.2026',
    status: 'Active',
    section: 'ROOM',
    partition: 'p8',
    rentAmount: 800,
    cupboardKey: true,
    doorKey: true,
    currentMonthStatus: 'Paid',
    remarks: '',
    lastPaidDate: '01.08.2026'
  },
  {
    id: 't-15',
    sno: 14,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-103',
    flatId: 'bld-vienna',
    name: "Deepka's sister",
    place: 'Malayali',
    phone: '+971501234515',
    deposit: 0,
    depositNote: '-',
    joiningDate: '???',
    status: 'Active',
    section: 'ROOM',
    partition: 'p8',
    rentAmount: 800,
    cupboardKey: false,
    doorKey: false,
    currentMonthStatus: 'Pending',
    remarks: ''
  },

  // Sample tenant in Room 601
  {
    id: 't-16',
    sno: 1,
    buildingId: 'bld-vienna',
    roomId: 'room-vienna-601',
    flatId: 'bld-vienna',
    name: 'Kavitha',
    place: 'Malayali',
    phone: '+971501234516',
    deposit: 200,
    depositNote: '',
    joiningDate: '15.06.2026',
    status: 'Active',
    section: 'MASTER',
    partition: 'm1',
    rentAmount: 900,
    cupboardKey: true,
    doorKey: true,
    currentMonthStatus: 'Paid',
    remarks: 'Master room bedspace',
    lastPaidDate: '15.08.2026'
  }
];

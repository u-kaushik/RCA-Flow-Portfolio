
import { useState } from 'react';
import { Development, Block, SortOption, ExternalItem, ProjectDocument, ExternalsAssessment, User, Report, Template, ViewMode, AuthType, UserRole, TeamMemberStats } from './types';

// Demo mode flag - bypasses login and loads dummy data
export const DEMO_MODE = true;

const MASTER_ANOMALIES = [
  { item: 'Fire Fighting Systems incl Lightning Protection - Residential multi-storey tower', rate: 95, unit: 'm2' },
  { item: 'Comms & Security Systems incl FA Panel & Door Entry - Residential m/s/tower', rate: 100, unit: 'm2' },
  { item: 'Lift - Passenger 8 Person x 4 Stops', rate: 125000, unit: 'Nr' },
  { item: 'Lift - Passenger 8 Person x 6 Stops', rate: 155000, unit: 'Nr' },
  { item: 'Lift - Passenger 8 Person x 8 Stops', rate: 195000, unit: 'Nr' },
  { item: 'Solar PV System Residential Solar Water Heating', rate: 1400, unit: 'm2' },
  { item: 'Dry Risers - 24Nr. Outlets - Residential multi-storey tower', rate: 3150, unit: 'Nr' },
  { item: 'Door entry/Intercom System @ £800 Per Flat', rate: 800, unit: 'Nr' },
  { item: 'Smoke Clearance to Corridors - 24Nr. Vents', rate: 11800, unit: 'Nr' }
];

const LEVEL_OPTIONS = [
  '(0) Ground', '(1) First', '(2) Second', '(3) Third', '(4) Fourth', '(5) Fifth', '(6) Sixth', '(7) Seventh', '(8) Eighth', '(9) Ninth', '(10) Tenth'
];

export const DEFAULT_EXTERNAL_ANOMALIES: ExternalItem[] = [
  { id: 'ext-an-1', description: 'Car Parking - Surface Finish Only', quantity: 0, rate: 155, unit: 'm2', category: 'Anomalies' },
  { id: 'ext-an-2', description: 'Car Parking - Surface Finish & Landscaping', quantity: 0, rate: 190, unit: 'm2', category: 'Anomalies' },
  { id: 'ext-an-3', description: 'Car Parks - Partially Underground, naturally ventilated', quantity: 0, rate: 1020, unit: 'm2', category: 'Anomalies' },
  { id: 'ext-an-4', description: 'Car Parks - Fully Underground with Mechanical Ventilation', quantity: 0, rate: 1400, unit: 'm2', category: 'Anomalies' },
  { id: 'ext-an-5', description: 'Car Parks - 80mm Thick Block Paving', quantity: 0, rate: 98, unit: 'm2', category: 'Anomalies' },
  { id: 'ext-an-6', description: 'Tarmacadam Roads - 7.30m Wide, Two Lane', quantity: 0, rate: 5500, unit: 'Lm', category: 'Anomalies' },
  { id: 'ext-an-7', description: 'Tarmacadam Footpath', quantity: 0, rate: 155, unit: 'm2', category: 'Anomalies' },
  { id: 'ext-an-13', description: 'Soft Landscaping including topsoil & turf', quantity: 0, rate: 18, unit: 'm2', category: 'Anomalies' },
  { id: 'ext-an-25', description: 'Fencing - Feather Edge - 1800mm High', quantity: 0, rate: 51, unit: 'Lm', category: 'Anomalies' },
];

const generateMockBlock = (id: string, name: string, i: number = 0, overrides: Partial<Block> = {}, userPrefs?: User['preferences']): Block => {
  const defaultLevelsCount = userPrefs?.defaultLevelCount || 3;
  const floors = Array.from({ length: defaultLevelsCount }).map((_, idx) => ({
    id: `f-${id}-${idx}`,
    description: LEVEL_OPTIONS[idx] || `Level ${idx}`,
    level: LEVEL_OPTIONS[idx] || `Level ${idx}`,
    gia: 400 + (i * 20),
    gfa: 450 + (i * 20)
  }));
  const initialRates: Record<string, number> = {};
  floors.forEach(f => initialRates[f.level] = 2400);

  return {
    id,
    name: overrides.name || name,
    reference: overrides.reference || `REF-${name.replace(/\s+/g, '-')}`,
    addressLine: overrides.addressLine || '72-104 High Street',
    town: overrides.town || 'Hounslow',
    county: overrides.county || 'Middlesex',
    postcode: overrides.postcode || 'TW3 1EB',
    numberOfUnits: overrides.numberOfUnits !== undefined ? Math.round(overrides.numberOfUnits) : (Math.floor(Math.random() * 20) + 5),
    status: overrides.status || 'Draft',
    completedSections: overrides.completedSections || [],
    floors: overrides.floors || floors,
    buildingRate: overrides.buildingRate || {
      date: '2025-05-15',
      uniclassRate: 'Spon\'s 2025 Standard',
      locationName: userPrefs?.defaultRegion || 'Outer London',
      locationFactor: userPrefs?.defaultLocationFactor || 1.00,
      ratesPerFloor: initialRates
    },
    adjustments: overrides.adjustments || [],
    anomalies: overrides.anomalies || MASTER_ANOMALIES.map((a, idx) => ({
      id: `anom-${id}-${idx}`,
      item: a.item,
      quantity: 0,
      rate: a.rate,
      unit: a.unit
    })),
    demolitionRate: overrides.demolitionRate || 85,
    fees: overrides.fees || { professionalPercent: 15, localAuthority: 1500 }
  };
};

export const getBlockEstimatedRCA = (block: Block): number => {
  if (!block) return 0;
  const buildingCost = block.floors.reduce((acc, f) => {
    const rate = block.buildingRate.ratesPerFloor?.[f.level] || 2400;
    return acc + (rate * f.gia * block.buildingRate.locationFactor);
  }, 0);
  const anomaliesTotal = block.anomalies.reduce((acc, a) => acc + (a.quantity * a.rate), 0);
  const upliftsPercent = block.adjustments.reduce((acc, a) => acc + a.uplift, 0);
  const subTotal = (buildingCost * (1 + (upliftsPercent / 100))) + anomaliesTotal + (block.floors.reduce((acc, f) => acc + f.gia, 0) * block.demolitionRate);
  return (subTotal * (1 + (block.fees.professionalPercent / 100))) + block.fees.localAuthority;
};

export const getBlockProfessionalFee = (block: Block): number => {
  if (!block) return 0;
  const buildingCost = block.floors.reduce((acc, f) => {
    const rate = block.buildingRate.ratesPerFloor?.[f.level] || 2400;
    return acc + (rate * f.gia * block.buildingRate.locationFactor);
  }, 0);
  const anomaliesTotal = block.anomalies.reduce((acc, a) => acc + (a.quantity * a.rate), 0);
  const upliftsPercent = block.adjustments.reduce((acc, a) => acc + a.uplift, 0);
  const baseValue = (buildingCost * (1 + (upliftsPercent / 100))) + anomaliesTotal + (block.floors.reduce((acc, f) => acc + f.gia, 0) * block.demolitionRate);
  return baseValue * (block.fees.professionalPercent / 100);
};

export const getExternalsTotal = (assessment: ExternalsAssessment): number => {
  const factor = assessment.locationFactor || 1.0;
  return assessment.items.reduce((acc, e) => acc + (e.quantity * e.rate * factor), 0);
};

export const getDevelopmentTotalRCA = (dev: Development): number => {
  const blocksTotal = (dev.blocks || []).reduce((acc, b) => acc + getBlockEstimatedRCA(b), 0);
  const extTotal = getExternalsTotal(dev.externalsAssessment) * (1 + (dev.externalsAssessment.fees?.professionalPercent || 0) / 100);
  return blocksTotal + extTotal;
};

const MOCK_TEAM: TeamMemberStats[] = [
  { userId: 'dev-user', name: 'Senior Surveyor', avatar: 'https://picsum.photos/seed/dev/100/100', role: 'Chartered Building Surveyor', rcasCompleted: 0, totalFeesGenerated: 0, lastActive: 'Now', status: 'Online' },
  { userId: 'tm-2', name: 'Sarah Jones', avatar: 'https://picsum.photos/seed/sarah/100/100', role: 'Associate Surveyor', rcasCompleted: 8, totalFeesGenerated: 215000, lastActive: '1 hour ago', status: 'Online' },
  { userId: 'tm-3', name: 'Michael Chen', avatar: 'https://picsum.photos/seed/mike/100/100', role: 'Graduate Surveyor', rcasCompleted: 4, totalFeesGenerated: 85000, lastActive: 'Yesterday', status: 'Offline' },
];

const DEMO_ADMIN: User = {
  id: 'dev-user',
  firstName: 'Senior',
  lastName: 'Surveyor',
  role: 'Chartered Building Surveyor',
  roleType: UserRole.DEPT_HEAD,
  company: 'BuiltTech Global',
  tenantId: 'tenant-123',
  email: 'dev@survey.com',
  authType: AuthType.EMAIL,
  avatar: 'https://picsum.photos/seed/dev/100/100'
};

const INITIAL_DEV_ID = `dev-initial-${Date.now()}`;
const INITIAL_DEVELOPMENT: Development = {
  id: INITIAL_DEV_ID,
  name: '123 Sterling Heights Residency',
  reference: 'RCA-2025-LON-01',
  description: 'A prestigious high-rise residential complex consisting of multi-storey residential units with extensive site externals and landscaping.',
  blocks: [
    generateMockBlock(`b-initial-1`, 'Block A - Sterling Tower', 0, { numberOfUnits: 42, status: 'Draft' }),
    generateMockBlock(`b-initial-2`, 'Block B - West Wing', 1, { numberOfUnits: 28, status: 'Draft' })
  ],
  externalsAssessment: { 
    id: `ext-initial`, 
    name: 'Site Externals', 
    status: 'In Progress', 
    items: DEFAULT_EXTERNAL_ANOMALIES.map(item => ({ ...item, id: `${item.id}-initial` })) 
  },
  documents: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ownerId: DEMO_ADMIN.id,
  ownerName: `${DEMO_ADMIN.firstName} ${DEMO_ADMIN.lastName}`,
  ownerRole: DEMO_ADMIN.role,
  rcaFee: 2500.00
};

// Additional demo developments for richer demo experience
const DEMO_DEV_2: Development = {
  id: 'dev-demo-2',
  name: 'Kensington Manor Estate',
  reference: 'RCA-2025-LON-02',
  description: 'Grade II listed conversion comprising three Victorian mansion blocks with communal gardens and underground parking.',
  blocks: [
    generateMockBlock('b-demo-2-1', 'Mansion Block 1 - North Wing', 0, { numberOfUnits: 18, status: 'Completed', completedSections: ['floors', 'rates', 'anomalies', 'adjustments', 'demolition', 'fees'], addressLine: '14-22 Kensington Court', town: 'London', county: 'Greater London', postcode: 'W8 5DL', floors: [
      { id: 'f-d2-1-0', description: '(0) Ground', level: '(0) Ground', gia: 520, gfa: 580 },
      { id: 'f-d2-1-1', description: '(1) First', level: '(1) First', gia: 510, gfa: 570 },
      { id: 'f-d2-1-2', description: '(2) Second', level: '(2) Second', gia: 490, gfa: 550 },
      { id: 'f-d2-1-3', description: '(3) Third', level: '(3) Third', gia: 480, gfa: 540 },
    ], buildingRate: { date: '2025-03-10', uniclassRate: 'Spon\'s 2025 Standard', locationName: 'Inner London', locationFactor: 1.04, ratesPerFloor: { '(0) Ground': 2800, '(1) First': 2800, '(2) Second': 2750, '(3) Third': 2700 } }, anomalies: [
      { id: 'anom-d2-1-0', item: 'Fire Fighting Systems incl Lightning Protection', quantity: 2000, rate: 95, unit: 'm2' },
      { id: 'anom-d2-1-1', item: 'Lift - Passenger 8 Person x 4 Stops', quantity: 2, rate: 125000, unit: 'Nr' },
      { id: 'anom-d2-1-2', item: 'Door entry/Intercom System @ £800 Per Flat', quantity: 18, rate: 800, unit: 'Nr' },
    ] }),
    generateMockBlock('b-demo-2-2', 'Mansion Block 2 - South Wing', 1, { numberOfUnits: 24, status: 'Completed', completedSections: ['floors', 'rates', 'anomalies', 'adjustments', 'demolition', 'fees'], addressLine: '24-36 Kensington Court', town: 'London', county: 'Greater London', postcode: 'W8 5DL' }),
    generateMockBlock('b-demo-2-3', 'Coach House', 2, { numberOfUnits: 6, status: 'In Progress', addressLine: '38 Kensington Court', town: 'London', county: 'Greater London', postcode: 'W8 5DL' }),
  ],
  externalsAssessment: {
    id: 'ext-demo-2', name: 'Site Externals', status: 'In Progress',
    items: DEFAULT_EXTERNAL_ANOMALIES.map(item => ({ ...item, id: `${item.id}-demo-2`, quantity: item.id === 'ext-an-1' ? 450 : item.id === 'ext-an-13' ? 800 : 0 })),
    locationName: 'Inner London', locationFactor: 1.04,
    fees: { professionalPercent: 12.5, localAuthority: 2200 }
  },
  documents: [
    { id: 'doc-d2-1', displayName: 'Listed Building Consent', originalFileName: 'listed_consent_2024.pdf', fileType: 'pdf', uploadDate: '2025-01-15', author: 'Senior Surveyor' },
    { id: 'doc-d2-2', displayName: 'Floor Plans - North Wing', originalFileName: 'north_wing_plans.pdf', fileType: 'pdf', uploadDate: '2025-02-01', author: 'Sarah Jones' },
  ],
  createdAt: '2025-01-10T09:00:00.000Z',
  updatedAt: '2025-03-01T14:30:00.000Z',
  ownerId: DEMO_ADMIN.id,
  ownerName: `${DEMO_ADMIN.firstName} ${DEMO_ADMIN.lastName}`,
  ownerRole: DEMO_ADMIN.role,
  isFavourite: true,
  rcaFee: 4200.00
};

const DEMO_DEV_3: Development = {
  id: 'dev-demo-3',
  name: 'Harbour View Apartments',
  reference: 'RCA-2025-BRS-01',
  description: 'Modern waterfront development with two residential towers and mixed-use ground floor retail units.',
  blocks: [
    generateMockBlock('b-demo-3-1', 'Tower 1 - Harbour Point', 0, { numberOfUnits: 64, status: 'Completed', completedSections: ['floors', 'rates', 'anomalies', 'adjustments', 'demolition', 'fees'], addressLine: '1 Harbour Way', town: 'Bristol', county: 'Avon', postcode: 'BS1 5TY', floors: [
      { id: 'f-d3-1-0', description: '(0) Ground', level: '(0) Ground', gia: 680, gfa: 740 },
      { id: 'f-d3-1-1', description: '(1) First', level: '(1) First', gia: 660, gfa: 720 },
      { id: 'f-d3-1-2', description: '(2) Second', level: '(2) Second', gia: 660, gfa: 720 },
      { id: 'f-d3-1-3', description: '(3) Third', level: '(3) Third', gia: 650, gfa: 710 },
      { id: 'f-d3-1-4', description: '(4) Fourth', level: '(4) Fourth', gia: 650, gfa: 710 },
      { id: 'f-d3-1-5', description: '(5) Fifth', level: '(5) Fifth', gia: 640, gfa: 700 },
      { id: 'f-d3-1-6', description: '(6) Sixth', level: '(6) Sixth', gia: 640, gfa: 700 },
      { id: 'f-d3-1-7', description: '(7) Seventh', level: '(7) Seventh', gia: 630, gfa: 690 },
    ], buildingRate: { date: '2025-04-01', uniclassRate: 'Spon\'s 2025 Standard', locationName: 'South West', locationFactor: 0.92, ratesPerFloor: { '(0) Ground': 2600, '(1) First': 2550, '(2) Second': 2550, '(3) Third': 2500, '(4) Fourth': 2500, '(5) Fifth': 2450, '(6) Sixth': 2450, '(7) Seventh': 2400 } }, anomalies: [
      { id: 'anom-d3-1-0', item: 'Fire Fighting Systems incl Lightning Protection', quantity: 5280, rate: 95, unit: 'm2' },
      { id: 'anom-d3-1-1', item: 'Lift - Passenger 8 Person x 8 Stops', quantity: 2, rate: 195000, unit: 'Nr' },
      { id: 'anom-d3-1-2', item: 'Dry Risers - 24Nr. Outlets', quantity: 1, rate: 3150, unit: 'Nr' },
      { id: 'anom-d3-1-3', item: 'Smoke Clearance to Corridors - 24Nr. Vents', quantity: 1, rate: 11800, unit: 'Nr' },
      { id: 'anom-d3-1-4', item: 'Door entry/Intercom System @ £800 Per Flat', quantity: 64, rate: 800, unit: 'Nr' },
    ], adjustments: [{ id: 'adj-d3-1', type: 'Sustainability', reason: 'Enhanced thermal performance & EPC A rating', uplift: 5 }] }),
    generateMockBlock('b-demo-3-2', 'Tower 2 - Marina View', 1, { numberOfUnits: 48, status: 'In Progress', addressLine: '3 Harbour Way', town: 'Bristol', county: 'Avon', postcode: 'BS1 5TY' }),
  ],
  externalsAssessment: {
    id: 'ext-demo-3', name: 'Site Externals', status: 'Completed',
    items: DEFAULT_EXTERNAL_ANOMALIES.map(item => ({ ...item, id: `${item.id}-demo-3`, quantity: item.id === 'ext-an-3' ? 1200 : item.id === 'ext-an-6' ? 180 : item.id === 'ext-an-7' ? 350 : 0 })),
    locationName: 'South West', locationFactor: 0.92, completedSections: ['items', 'rates', 'fees'],
    fees: { professionalPercent: 15, localAuthority: 1800 }
  },
  documents: [],
  createdAt: '2025-02-20T11:00:00.000Z',
  updatedAt: '2025-03-05T16:45:00.000Z',
  ownerId: 'tm-2',
  ownerName: 'Sarah Jones',
  ownerRole: 'Associate Surveyor',
  rcaFee: 3800.00
};

const DEMO_DEV_4: Development = {
  id: 'dev-demo-4',
  name: 'Oakwood Gardens Retirement Village',
  reference: 'RCA-2025-MAN-01',
  description: 'Purpose-built retirement living scheme with communal facilities, landscaped gardens and assisted living wing.',
  blocks: [
    generateMockBlock('b-demo-4-1', 'Main Residence', 0, { numberOfUnits: 32, status: 'Draft', addressLine: '45 Oakwood Lane', town: 'Manchester', county: 'Greater Manchester', postcode: 'M20 6RT' }),
    generateMockBlock('b-demo-4-2', 'Assisted Living Wing', 1, { numberOfUnits: 16, status: 'Draft', addressLine: '45 Oakwood Lane', town: 'Manchester', county: 'Greater Manchester', postcode: 'M20 6RT' }),
    generateMockBlock('b-demo-4-3', 'Community Hub', 2, { numberOfUnits: 0, status: 'Draft', addressLine: '45 Oakwood Lane', town: 'Manchester', county: 'Greater Manchester', postcode: 'M20 6RT' }),
  ],
  externalsAssessment: {
    id: 'ext-demo-4', name: 'Site Externals', status: 'In Progress',
    items: DEFAULT_EXTERNAL_ANOMALIES.map(item => ({ ...item, id: `${item.id}-demo-4` })),
  },
  documents: [],
  createdAt: '2025-03-01T08:00:00.000Z',
  updatedAt: '2025-03-01T08:00:00.000Z',
  ownerId: 'tm-3',
  ownerName: 'Michael Chen',
  ownerRole: 'Graduate Surveyor',
  rcaFee: 2800.00
};

const DEMO_DEV_5: Development = {
  id: 'dev-demo-5',
  name: 'The Exchange - City Centre Conversion',
  reference: 'RCA-2024-BHM-03',
  description: 'Former office building converted to 56 residential apartments across 8 floors, completed assessment.',
  blocks: [
    generateMockBlock('b-demo-5-1', 'The Exchange Building', 0, { numberOfUnits: 56, status: 'Completed', completedSections: ['floors', 'rates', 'anomalies', 'adjustments', 'demolition', 'fees'], addressLine: '100 Colmore Row', town: 'Birmingham', county: 'West Midlands', postcode: 'B3 3AG' }),
  ],
  externalsAssessment: {
    id: 'ext-demo-5', name: 'Site Externals', status: 'Completed',
    items: DEFAULT_EXTERNAL_ANOMALIES.map(item => ({ ...item, id: `${item.id}-demo-5` })),
    completedSections: ['items', 'rates', 'fees'],
    fees: { professionalPercent: 12.5, localAuthority: 1200 }
  },
  documents: [
    { id: 'doc-d5-1', displayName: 'Building Survey Report', originalFileName: 'survey_report_exchange.pdf', fileType: 'pdf', uploadDate: '2024-11-20', author: 'Senior Surveyor' },
  ],
  createdAt: '2024-10-15T10:00:00.000Z',
  updatedAt: '2024-12-20T09:30:00.000Z',
  ownerId: DEMO_ADMIN.id,
  ownerName: `${DEMO_ADMIN.firstName} ${DEMO_ADMIN.lastName}`,
  ownerRole: DEMO_ADMIN.role,
  isArchived: true,
  rcaFee: 1800.00
};

const ALL_DEMO_DEVELOPMENTS = [INITIAL_DEVELOPMENT, DEMO_DEV_2, DEMO_DEV_3, DEMO_DEV_4, DEMO_DEV_5];

const DEMO_REPORTS: Report[] = [
  {
    id: 'rep-demo-1',
    name: 'RCA Report - Kensington Manor Estate',
    reference: 'RCA-2025-LON-02',
    date: '2025-03-01T14:30:00.000Z',
    status: 'Ready',
    type: 'PDF',
    developmentId: 'dev-demo-2',
    value: getDevelopmentTotalRCA(DEMO_DEV_2),
    blockCount: 3,
    documentCount: 2,
    generatedAt: '2025-03-01T14:32:00.000Z',
  },
  {
    id: 'rep-demo-2',
    name: 'RCA Report - The Exchange',
    reference: 'RCA-2024-BHM-03',
    date: '2024-12-20T09:30:00.000Z',
    status: 'Ready',
    type: 'PDF',
    developmentId: 'dev-demo-5',
    value: getDevelopmentTotalRCA(DEMO_DEV_5),
    blockCount: 1,
    documentCount: 1,
    generatedAt: '2024-12-20T09:35:00.000Z',
  },
];

// Demo user profiles for role switching
export const DEMO_USERS: Record<string, User> = {
  DEPT_HEAD: DEMO_ADMIN,
  SURVEYOR: {
    id: 'demo-surveyor',
    firstName: 'Alex',
    lastName: 'Mitchell',
    role: 'Surveyor',
    roleType: UserRole.SURVEYOR,
    company: 'BuiltTech Global',
    tenantId: 'tenant-123',
    email: 'a.mitchell@builttech.com',
    authType: AuthType.EMAIL,
    avatar: 'https://picsum.photos/seed/alex/100/100'
  }
};

export const useStore = () => {
  const [user, setUser] = useState<User | null>(DEMO_MODE ? DEMO_ADMIN : null);
  const [developments, setDevelopments] = useState<Development[]>(DEMO_MODE ? ALL_DEMO_DEVELOPMENTS : [INITIAL_DEVELOPMENT]);
  const [reports, setReports] = useState<Report[]>(DEMO_MODE ? DEMO_REPORTS : []);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showArchived, setShowArchived] = useState(false);

  const getPersonalStats = () => {
    const finalized = developments.filter(d => d.ownerId === user?.id && d.blocks.every(b => b.status === 'Completed'));
    const totalFees = finalized.reduce((acc, d) => acc + d.blocks.reduce((bAcc, b) => bAcc + getBlockProfessionalFee(b), 0), 0);
    return { finalizedCount: finalized.length, totalFees };
  };

  const getDepartmentStats = () => {
    const activeTeam = MOCK_TEAM.map(member => {
      const finalized = developments.filter(d => d.ownerId === member.userId && d.blocks.every(b => b.status === 'Completed'));
      const totalFees = finalized.reduce((acc, d) => acc + d.blocks.reduce((bAcc, b) => bAcc + getBlockProfessionalFee(b), 0), 0);
      return { 
        ...member, 
        rcasCompleted: member.userId === user?.id ? finalized.length : member.rcasCompleted,
        totalFeesGenerated: member.userId === user?.id ? totalFees : member.totalFeesGenerated
      };
    });
    return { totalFees: activeTeam.reduce((acc, m) => acc + m.totalFeesGenerated, 0), totalRCAs: activeTeam.reduce((acc, m) => acc + m.rcasCompleted, 0), memberCount: activeTeam.length, team: activeTeam };
  };

  const toggleArchive = (id: string) => setDevelopments(prev => prev.map(d => d.id === id ? { ...d, isArchived: !d.isArchived } : d));
  const toggleFavourite = (id: string) => setDevelopments(prev => prev.map(d => d.id === id ? { ...d, isFavourite: !d.isFavourite } : d));

  const addReport = (dev: Development) => {
    const newReport: Report = {
      id: `rep-${Date.now()}`,
      name: `RCA Report - ${dev.name}`,
      reference: dev.reference,
      date: new Date().toISOString(),
      status: 'Staging',
      type: 'PDF',
      developmentId: dev.id,
      value: getDevelopmentTotalRCA(dev),
      blockCount: dev.blocks.length,
      documentCount: dev.documents?.length || 0,
      isArchived: false,
      isFavourite: false
    };
    setReports(prev => [newReport, ...prev]);
  };

  return {
    user, setUser, login: (u: User) => setUser(u), logout: () => setUser(null),
    developments, setDevelopments,
    reports, setReports,
    templates, setTemplates,
    teamMembers: MOCK_TEAM,
    getPersonalStats,
    getDepartmentStats,
    toggleArchive,
    toggleFavourite,
    addReport,
    updateReport: (id: string, updates: Partial<Report>) => setReports(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r)),
    deleteReport: (id: string) => setReports(prev => prev.filter(r => r.id !== id)),
    deleteDevelopment: (id: string) => setDevelopments(prev => prev.filter(d => d.id !== id)),
    duplicateDevelopment: (id: string) => {
      const original = developments.find(d => d.id === id);
      if (!original) return;
      setDevelopments(prev => [{ ...original, id: `dev-${Date.now()}`, name: `${original.name} (Copy)`, reference: `${original.reference}-COPY`, createdAt: new Date().toISOString() }, ...prev]);
    },
    toggleReportArchive: (id: string) => setReports(prev => prev.map(r => r.id === id ? { ...r, isArchived: !r.isArchived } : r)),
    toggleReportFavourite: (id: string) => setReports(prev => prev.map(r => r.id === id ? { ...r, isFavourite: !r.isFavourite } : r)),
    toggleTemplateArchive: (id: string) => setTemplates(prev => prev.map(t => t.id === id ? { ...t, isArchived: !t.isArchived } : t)),
    toggleTemplateFavourite: (id: string) => setTemplates(prev => prev.map(t => t.id === id ? { ...t, isFavourite: !t.isFavourite } : t)),
    addReportFromDoc: (name: string) => setReports(prev => [{ id: `rep-${Date.now()}`, name, status: 'Staging', date: new Date().toISOString(), type: 'PDF', developmentId: '', value: 0, blockCount: 0, documentCount: 0, reference: 'IMPORTED' }, ...prev]),
    addTemplateFromFile: (name: string, company: string, version: string, previewData: any, docBuffer: ArrayBuffer) => setTemplates(prev => [{ id: `tm-${Date.now()}`, name, company, version, previewData, docBuffer, updatedAt: new Date().toISOString() }, ...prev]),
    deleteTemplate: (id: string) => setTemplates(prev => prev.filter(t => t.id !== id)),
    updateDevelopment: (u: Development) => setDevelopments(prev => prev.map(d => d.id === u.id ? u : d)),
    addDevelopment: (name: string, reference: string, blockCount: number, blockOverrides: any = {}, devOverrides: any = {}) => {
        const blocks = Array.from({ length: blockCount }).map((_, i) => generateMockBlock(`b-${Date.now()}-${i}`, `Block ${i + 1}`, i, blockOverrides, user?.preferences));
        const newDev: Development = { 
          id: `dev-${Date.now()}`, 
          name, reference, blocks, 
          externalsAssessment: { id: `ext-${Date.now()}`, name: 'Site Externals', status: 'In Progress', items: DEFAULT_EXTERNAL_ANOMALIES.map(item => ({ ...item, id: `${item.id}-${Date.now()}` })) }, 
          documents: [], description: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          ownerId: user?.id, ownerName: `${user?.firstName} ${user?.lastName}`, ownerRole: user?.role,
          ...devOverrides
        };
        setDevelopments(prev => [newDev, ...prev]);
        return newDev;
    },
    createDevelopmentFromImport: (name: string, reference: string, blockData: any[], devOverrides: any = {}) => {
        const blocks = blockData.map((bd, i) => generateMockBlock(`b-${Date.now()}-${i}`, bd.name, i, bd, user?.preferences));
        const newDev: Development = { 
          id: `dev-${Date.now()}`, 
          name, reference, blocks, 
          externalsAssessment: { id: `ext-${Date.now()}`, name: 'Site Externals', status: 'In Progress', items: DEFAULT_EXTERNAL_ANOMALIES.map(item => ({ ...item, id: `${item.id}-${Date.now()}` })) }, 
          documents: [], description: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          ownerId: user?.id, ownerName: `${user?.firstName} ${user?.lastName}`, ownerRole: user?.role,
          ...devOverrides
        };
        setDevelopments(prev => [newDev, ...prev]);
        return newDev;
    },
    searchTerm, setSearchTerm, viewMode, setViewMode, sortBy, setSortBy, showArchived, setShowArchived,
    filteredDevelopments: developments.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
  };
};

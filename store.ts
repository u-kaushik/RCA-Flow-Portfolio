
import { useState } from 'react';
import { Development, Block, SortOption, ExternalItem, ProjectDocument, ExternalsAssessment, User, Report, Template, ViewMode, AuthType, UserRole, TeamMemberStats } from './types';

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

export const useStore = () => {
  const [user, setUser] = useState<User | null>(DEMO_ADMIN);
  const [developments, setDevelopments] = useState<Development[]>([INITIAL_DEVELOPMENT]);
  const [reports, setReports] = useState<Report[]>([]);
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

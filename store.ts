import { useState } from 'react';
import { Development, Block, SortOption, ExternalItem, ProjectDocument, ExternalsAssessment, User, Report, Template, ViewMode } from './types';

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
  '(0) Ground', '(1) First', '(2) Second', '(3) Third', '(4) Fourth', '(5) Fifth', '(6) Sixth', '(7) Seventh', '(8) Eighth', '(9) Ninth', '(10) Tenth',
  '(11) Eleventh', '(12) Twelfth', '(13) Thirteenth', '(14) Fourteenth', '(15) Fifteenth', '(16) Sixteenth', '(17) Seventeenth', '(18) Eighteenth', '(19) Nineteenth', '(20) Twentieth'
];

export const DEFAULT_LANDSCAPING_ITEMS: Partial<ExternalItem>[] = [
  { description: 'Car Parking - Surface Finish Only - £/m2', quantity: 0, rate: 155, unit: 'm2', category: 'Anomalies' },
  { description: 'Car Parking - Surface Finish & Landscaping - £/m2', quantity: 0, rate: 190, unit: 'm2', category: 'Anomalies' },
  { description: 'Car Parks - Partially Underground, naturally ventilated - £/m2', quantity: 0, rate: 1020, unit: 'm2', category: 'Anomalies' },
  { description: 'Car Parks - Fully Underground with Mechanical Ventilation - £/m2', quantity: 0, rate: 1400, unit: 'm2', category: 'Anomalies' },
  { description: 'Car Parks - 80mm Thick Block Paving - £/m2', quantity: 0, rate: 98, unit: 'm2', category: 'Anomalies' },
  { description: 'Tarmacadam Roads - 7.30m Wide, Two Lane - £/LM', quantity: 0, rate: 5500, unit: 'Lm', category: 'Anomalies' },
  { description: 'Tarmacadam Footpath - £/m2', quantity: 0, rate: 155, unit: 'm2', category: 'Anomalies' },
  { description: 'Gravel Footpath - £/m2', quantity: 0, rate: 30, unit: 'm2', category: 'Anomalies' },
  { description: 'Resin Bound Footpath - £/m2', quantity: 0, rate: 110, unit: 'm2', category: 'Anomalies' },
  { description: 'Precast Concrete Paving - £/m2', quantity: 0, rate: 120, unit: 'm2', category: 'Anomalies' },
  { description: 'Tactile Precast Concrete Paving - £/m2', quantity: 0, rate: 170, unit: 'm2', category: 'Anomalies' },
  { description: 'Yorkstone Paving - £/m2', quantity: 0, rate: 245, unit: 'm2', category: 'Anomalies' },
  { description: 'Soft Landscaping including topsoil & turf - £/m2', quantity: 0, rate: 18, unit: 'm2', category: 'Anomalies' },
  { description: 'Shrubbed Planting - £/m2', quantity: 0, rate: 85, unit: 'm2', category: 'Anomalies' },
  { description: 'Shrubbed Planting incl Small Trees - £/m2', quantity: 0, rate: 110, unit: 'm2', category: 'Anomalies' },
  { description: 'General Planting - £/m2', quantity: 0, rate: 35, unit: 'm2', category: 'Anomalies' },
  { description: 'Woodland - £/m2', quantity: 0, rate: 56, unit: 'm2', category: 'Anomalies' },
  { description: 'Trees - Standard Root Balled Tree - No.', quantity: 0, rate: 115, unit: 'Nr', category: 'Anomalies' },
  { description: 'Trees - Heavy Standard Root Balled Tree - No.', quantity: 0, rate: 215, unit: 'Nr', category: 'Anomalies' },
  { description: 'Trees - Semi-Mature Root Balled Tree - No.', quantity: 0, rate: 700, unit: 'Nr', category: 'Anomalies' },
  { description: 'Fencing - Chestnut Paling - 1200mm High - LM', quantity: 0, rate: 35, unit: 'Lm', category: 'Anomalies' },
  { description: 'Fending - Cross Boarded - 1800mm High - LM', quantity: 0, rate: 45, unit: 'Lm', category: 'Anomalies' },
  { description: 'Fencing - Chainlink - 1200mm high - LM', quantity: 0, rate: 35, unit: 'Lm', category: 'Anomalies' },
  { description: 'Fencing - Chainlink - 1800mm High - LM', quantity: 0, rate: 45, unit: 'Lm', category: 'Anomalies' },
  { description: 'Fencing - Feather Edge - 1800mm High - LM', quantity: 0, rate: 51, unit: 'Lm', category: 'Anomalies' },
  { description: 'Fencing - Timber Lap Panels incl 100 x 100mm Posts - 1800 x 1800mm - LM', quantity: 0, rate: 82, unit: 'Lm', category: 'Anomalies' },
  { description: 'Fencing - Post & Rail incl 3No. Rails x 1200mm High - LM', quantity: 0, rate: 45, unit: 'Lm', category: 'Anomalies' },
  { description: 'Fencing - Metal Bow-Top - 900mm High - £/LM', quantity: 0, rate: 71, unit: 'Lm', category: 'Anomalies' },
  { description: 'Fencing - Metal Bow-Top - 1200mm High - £/LM', quantity: 0, rate: 105, unit: 'Lm', category: 'Anomalies' },
  { description: 'Gates - Timber Picket Gate - 1000mm Wide x 950mm High', quantity: 0, rate: 305, unit: 'Nr', category: 'Anomalies' },
  { description: 'Gates - Timber Feather Edge - 1000 x 1200mm High', quantity: 0, rate: 410, unit: 'Nr', category: 'Anomalies' },
  { description: 'Gates - Timber Field Gate - 1800mm High x 2400mm Wide', quantity: 0, rate: 620, unit: 'Nr', category: 'Anomalies' },
  { description: 'Gates - Timber Field Gate - 1800mm High x 3000mm Wide', quantity: 0, rate: 680, unit: 'Nr', category: 'Anomalies' },
  { description: 'Retaining Walls - Timber Crib with Founds & granular infill material - Up to 3.0m - £/m2', quantity: 0, rate: 300, unit: 'm2', category: 'Anomalies' },
  { description: 'Retaining Walls - Timber Crib with Founds & granular infill material - Up to 6.0m - £/m2', quantity: 0, rate: 380, unit: 'm2', category: 'Anomalies' },
  { description: 'Retaining Walls - Concrete Crib with Founds & granular infill material - Up to 3.0m - £/m2', quantity: 0, rate: 330, unit: 'm2', category: 'Anomalies' },
  { description: 'Retaining Walls - Concrete Crib with Founds & granular infill material - Up to 6.0m - £/m2', quantity: 0, rate: 400, unit: 'm2', category: 'Anomalies' },
  { description: 'Retaining Walls - Precast Concrete L Shaped Panel Unit - 1000 x 1500mm High', quantity: 0, rate: 510, unit: 'Nr', category: 'Anomalies' },
  { description: 'Retaining Walls - Precast Concrete L Shaped Panel Unit - 1000 x 2500mm High', quantity: 0, rate: 1000, unit: 'Nr', category: 'Anomalies' },
  { description: 'Retaining Walls - Precast Concrete L Shaped Panel Unit - 1000 x 3000mm High', quantity: 0, rate: 1125, unit: 'Nr', category: 'Anomalies' },
  { description: 'Retaining Walls - Gabion Basket - Wall Height 1000mm - £/LM', quantity: 0, rate: 340, unit: 'Lm', category: 'Anomalies' },
  { description: 'Retaining Walls - Gabion Basket - Wall Height 2000mm - £/LM', quantity: 0, rate: 620, unit: 'Lm', category: 'Anomalies' },
  { description: 'Retaining Walls - Gabion Basket - Wall Height Up to 3700mm High - £/m2', quantity: 0, rate: 380, unit: 'm2', category: 'Anomalies' },
  { description: 'Retaining Walls - Gabion Basket - Wall Height Up to 7400mm High - £/m2', quantity: 0, rate: 540, unit: 'm2', category: 'Anomalies' },
  { description: 'Retaining Walls - Hardwood Sleepers - 250 x 150 x 2450mm Long - 300mm High - £/LM', quantity: 0, rate: 72, unit: 'Lm', category: 'Anomalies' },
  { description: 'Retaining Walls - Hardwood Sleepers - 250 x 150 x 2450mm Long - 600mm High - £/LM', quantity: 0, rate: 120, unit: 'Lm', category: 'Anomalies' },
  { description: 'Retaining Walls - Softwood Sleepers - 250 x 125 x 2400mm Long - 625mm High - £/m2', quantity: 0, rate: 236.35, unit: 'm2', category: 'Anomalies' },
  { description: 'Retaining Walls - Softwood Sleepers - 250 x 125 x 2400mm Long - 775mm High - £/m2', quantity: 0, rate: 268.07, unit: 'm2', category: 'Anomalies' },
  { description: 'Soakaway - Aquacell Units - 500 x 400 x 1000mm - 8 Units - 1520 Litres', quantity: 0, rate: 1125, unit: 'Nr', category: 'Anomalies' },
  { description: 'Soakaway - Aquacell Units - 500 x 400 x 1000mm - 16 Units - 3040 Litres', quantity: 0, rate: 2225, unit: 'Nr', category: 'Anomalies' },
  { description: 'Soakaway - Aquacell Units - 500 x 400 x 1000mm - 30 Units - 5700 Litres', quantity: 0, rate: 4675, unit: 'Nr', category: 'Anomalies' },
  { description: 'Soakaway - Aquacell Units - 500 x 400 x 1000mm - 60 Units - 11400 Litres', quantity: 0, rate: 7700, unit: 'Nr', category: 'Anomalies' },
  { description: 'Street Lighting - 4m - 6m Column with 70W Lamps - Estate Roads - £/Nr', quantity: 0, rate: 400, unit: 'Nr', category: 'Anomalies' },
  { description: 'Street Lighting - 12m - 15m Column with 400W High Pressure Sodium Lighting - Main Roads - £/Nr', quantity: 0, rate: 1100, unit: 'Nr', category: 'Anomalies' },
  { description: 'Street Furniture - Bench - Hardwood or PC Concrete', quantity: 0, rate: 1600, unit: 'Nr', category: 'Anomalies' },
  { description: 'Street Furniture - Litter Bins - Cast Iron - Nr.', quantity: 0, rate: 600, unit: 'Nr', category: 'Anomalies' },
  { description: 'Street Furniture - Dog Waste Bins - Galv. Steel - Nr.', quantity: 0, rate: 175, unit: 'Nr', category: 'Anomalies' },
  { description: 'Street Furniture - Cycle Stand - Nr.', quantity: 0, rate: 82, unit: 'Nr', category: 'Anomalies' },
  { description: 'Street Furniture - Neath Cycle Stand - 6Nr Cycles.', quantity: 0, rate: 720, unit: 'Nr', category: 'Anomalies' },
  { description: 'Street Furniture - Cycle Shelter 3450 x 2670 x 2150mm High - Nr.', quantity: 0, rate: 2950, unit: 'Nr', category: 'Anomalies' },
  { description: 'Street Furniture - Cycle Shelter 3600 x 2130 x 2150mm High - Nr.', quantity: 0, rate: 1940, unit: 'Nr', category: 'Anomalies' },
  { description: 'Street Furniture - Table & Bench Set - 1500 x 1800 x 750mm', quantity: 0, rate: 735, unit: 'Nr', category: 'Anomalies' },
  { description: 'Playgrounds - Total Area - 1200m2 - £98/m2', quantity: 0, rate: 120000, unit: 'Nr', category: 'Anomalies' },
  { description: 'Playgrounds - Total Area - 1200m2 - Local Parish Traditional Equipment', quantity: 0, rate: 61000, unit: 'Nr', category: 'Anomalies' },
  { description: 'Playgrounds - Total Area - 1200m2 - City & Urban Medium Sized Play Equipment', quantity: 0, rate: 115000, unit: 'Nr', category: 'Anomalies' },
  { description: 'Playgrounds - Total Area - 1500m2 - City & Urban Large Sized Play Equipment', quantity: 0, rate: 205000, unit: 'Nr', category: 'Anomalies' },
  { description: 'Bollards - Concrete - 200 - 400mm Dia x 915mm High', quantity: 0, rate: 340, unit: 'Nr', category: 'Anomalies' },
  { description: 'Bollards - Cast Iron - 170mm Dia x 915mm High', quantity: 0, rate: 300, unit: 'Nr', category: 'Anomalies' },
  { description: 'Bollards - Stainless Steel - 101mm Dia x 900mm High', quantity: 0, rate: 320, unit: 'Nr', category: 'Anomalies' },
  { description: 'Planters - Precast Concrete - 1200mm Diameter - £/Nr', quantity: 0, rate: 1485, unit: 'Nr', category: 'Anomalies' },
  { description: 'Planters - Precast Concrete - 1000 x 1000 x 1150mm High - £/Nr', quantity: 0, rate: 985, unit: 'Nr', category: 'Anomalies' }
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
    fees: overrides.fees || {
      professionalPercent: 15,
      localAuthority: 1500
    }
  };
};

export const getBlockEstimatedRCA = (block: Block): number => {
  if (!block) return 0;
  const floors = block.floors || [];
  const adjustments = block.adjustments || [];
  const buildingRate = block.buildingRate || { ratesPerFloor: {}, locationFactor: 1 };
  const anomalies = block.anomalies || [];
  
  const totalGIA = floors.reduce((acc, f) => acc + (f.gia || 0), 0);
  const demolitionCost = totalGIA * (block.demolitionRate || 0);
  
  const buildingCost = floors.reduce((acc, f) => {
    const rate = buildingRate.ratesPerFloor?.[f.level] || 2400;
    return acc + (rate * (f.gia || 0) * (buildingRate.locationFactor || 1));
  }, 0);

  const anomaliesTotal = anomalies.reduce((acc, a) => acc + (a.quantity * a.rate), 0);

  const upliftsPercent = adjustments.reduce((acc, a) => acc + (a.uplift || 0), 0);
  const adjustedBuildingCost = buildingCost * (1 + (upliftsPercent / 100));
  
  const subTotal = adjustedBuildingCost + demolitionCost + anomaliesTotal;
  const fees = block.fees || { professionalPercent: 0, localAuthority: 0 };
  const withFees = subTotal * (1 + (fees.professionalPercent / 100));
  
  return withFees + (fees.localAuthority || 0);
};

export const getExternalsTotal = (assessment: ExternalsAssessment): number => {
  if (!assessment || !assessment.items) return 0;
  const factor = assessment.locationFactor || 1.0;
  return assessment.items.reduce((acc, e) => acc + ((e.quantity || 0) * (e.rate || 0) * factor), 0);
};

export const getDevelopmentTotalRCA = (dev: Development): number => {
  if (!dev) return 0;
  const blocksTotal = (dev.blocks || []).reduce((acc, b) => acc + getBlockEstimatedRCA(b), 0);
  const externalsNet = getExternalsTotal(dev.externalsAssessment);
  
  const extFees = dev.externalsAssessment.fees || { professionalPercent: 0, localAuthority: 0 };
  const extWithFees = externalsNet * (1 + (extFees.professionalPercent / 100)) + (extFees.localAuthority || 0);
  
  return blocksTotal + extWithFees;
};

const MOCK_DEVELOPMENTS: Development[] = [
  {
    id: 'dev-hounslow',
    name: '72049 Hounslow High Street',
    reference: 'REF-72049',
    description: 'Mixed-use redevelopment with significant external site works and parking upgrades.',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop',
    caseNumber: 'CN-88921',
    propertyReference: 'PR-99201-B',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blocks: [generateMockBlock('b1', 'Main Retail Block', 0), generateMockBlock('b2', 'East Residential', 1)],
    externalsAssessment: {
      id: 'ext-assessment-1',
      name: 'Site-Wide External Works',
      status: 'In Progress',
      locationName: 'Outer London',
      locationFactor: 1.00,
      baseRate: 2600,
      categoryLabel: 'Flats/ Apartments - Medium Rise 4-10 Storeys',
      items: DEFAULT_LANDSCAPING_ITEMS.map((item, idx) => ({
        id: `ext-lnd-${idx}`,
        ...item,
      })) as ExternalItem[],
      fees: { professionalPercent: 12.5, localAuthority: 0 }
    },
    documents: [
      { id: 'doc1', displayName: 'Basement Floorplans', originalFileName: 'ground-b-01.pdf', fileType: 'pdf', uploadDate: '2025-05-10', author: 'Senior Surveyor' },
      { id: 'doc2', displayName: 'Land Registry Search', originalFileName: 'lr-hounslow-72.pdf', fileType: 'pdf', uploadDate: '2025-05-12', author: 'Admin' }
    ],
    isFavourite: true
  }
];

const INITIAL_TEMPLATES: Template[] = [
  { 
    id: 't1', 
    name: 'Standard Commercial RCA Template', 
    version: '2.4', 
    company: 'BuildTech Surveys', 
    updatedAt: '2025-05-15', 
    isFavourite: true,
    previewData: {
      brandColor: '#0f172a',
      hasLogo: true,
      logoPos: 'left',
      headerTitle: 'REINSTATEMENT COST ASSESSMENT',
      sections: [
        { title: 'Executive Summary', type: 'text' },
        { title: 'Asset Valuation Schedule', type: 'table' },
        { title: 'Demolition Cost Variance', type: 'chart' }
      ]
    }
  },
  { 
    id: 't2', 
    name: 'Residential Block Master Template', 
    version: '1.1', 
    company: 'BuildTech Surveys', 
    updatedAt: '2025-05-10',
    previewData: {
      brandColor: '#2563eb',
      hasLogo: true,
      logoPos: 'right',
      headerTitle: 'RESIDENTIAL RCA REPORT',
      sections: [
        { title: 'Property Particulars', type: 'text' },
        { title: 'Unit Breakdown', type: 'table' },
        { title: 'External Works Assessment', type: 'table' }
      ]
    }
  },
];

export const useStore = () => {
  const [user, setUser] = useState<User | null>(null);
  const [developments, setDevelopments] = useState<Development[]>(MOCK_DEVELOPMENTS);
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [reportViewMode, setReportViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showArchived, setShowArchived] = useState(false);

  const updateDevelopment = (updated: Development) => {
    setDevelopments(prev => prev.map(d => d.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : d));
  };

  const addDevelopment = (name: string, reference: string, blockCount: number = 0, defaultBlockData: Partial<Block> = {}, devDetails: Partial<Development> = {}) => {
    const newDev: Development = {
      id: `dev-${Date.now()}`,
      name,
      reference,
      description: '',
      thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop',
      addressLine: devDetails.addressLine,
      town: devDetails.town,
      postcode: devDetails.postcode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: Array.from({ length: blockCount }).map((_, i) => generateMockBlock(
        `b-${Date.now()}-${i}`, 
        `Block ${i + 1}`, 
        i, 
        { ...defaultBlockData, addressLine: devDetails.addressLine, town: devDetails.town, postcode: devDetails.postcode },
        user?.preferences
      )),
      externalsAssessment: {
        id: `ext-${Date.now()}`,
        name: 'Site-Wide External Works',
        status: 'In Progress',
        locationName: user?.preferences?.defaultRegion || 'Outer London',
        locationFactor: user?.preferences?.defaultLocationFactor || 1.00,
        baseRate: 2600,
        categoryLabel: 'Flats/ Apartments - Medium Rise 4-10 Storeys',
        items: DEFAULT_LANDSCAPING_ITEMS.map((item, idx) => ({
          id: `new-ext-lnd-${idx}`,
          ...item,
        })) as ExternalItem[],
        fees: { professionalPercent: 12.5, localAuthority: 0 }
      },
      documents: [],
      isFavourite: false
    };
    setDevelopments(prev => [newDev, ...prev]);
    return newDev;
  };

  const addReport = (dev: Development) => {
    const existing = reports.find(r => r.developmentId === dev.id && !r.isArchived);
    if (existing) return existing;

    const newReport: Report = {
      id: `report-${Date.now()}`,
      name: dev.name,
      reference: dev.reference,
      date: new Date().toISOString(),
      status: 'Staging',
      type: 'Word',
      developmentId: dev.id,
      value: getDevelopmentTotalRCA(dev),
      blockCount: dev.blocks.length,
      documentCount: dev.documents.length,
      isFavourite: false,
      isArchived: false
    };
    setReports(prev => [newReport, ...prev]);
    return newReport;
  };

  const addReportFromDoc = (fileName: string) => {
    const cleanName = fileName.replace('.docx', '').replace('.doc', '');
    const newReport: Report = {
      id: `report-import-${Date.now()}`,
      name: cleanName,
      reference: 'IMP-' + Math.floor(Math.random() * 1000),
      date: new Date().toISOString(),
      status: 'Staging',
      type: 'Word',
      developmentId: 'imported',
      value: Math.floor(Math.random() * 5000000) + 1000000,
      blockCount: Math.floor(Math.random() * 5) + 1,
      documentCount: 0,
      isFavourite: false,
      isArchived: false
    };
    setReports(prev => [newReport, ...prev]);
    return newReport;
  };

  const addTemplateFromFile = (name: string, company: string, version: string, previewData: Template['previewData']) => {
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name,
      company,
      version,
      updatedAt: new Date().toISOString().split('T')[0],
      isFavourite: false,
      isArchived: false,
      previewData
    };
    setTemplates(prev => [newTemplate, ...prev]);
    return newTemplate;
  };

  const updateReport = (id: string, updates: Partial<Report>) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...updates, date: new Date().toISOString() } : r));
  };

  const toggleReportFavourite = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, isFavourite: !r.isFavourite } : r));
  };

  const toggleReportArchive = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, isArchived: !r.isArchived } : r));
  };

  const deleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const updateTemplate = (id: string, updates: Partial<Template>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : t));
  };

  const createDevelopmentFromImport = (name: string, reference: string, blockData: Partial<Block>[], devDetails: Partial<Development> = {}) => {
    const newDev: Development = {
      id: `dev-import-${Date.now()}`,
      name,
      reference,
      description: `Imported from CSV on ${new Date().toLocaleDateString()}`,
      thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop',
      addressLine: devDetails.addressLine,
      town: devDetails.town,
      postcode: devDetails.postcode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: blockData.map((data, i) => generateMockBlock(
        `b-imp-${Date.now()}-${i}`, 
        data.name || `Block ${i + 1}`, 
        i, 
        { ...data, addressLine: data.addressLine || devDetails.addressLine, town: data.town || devDetails.town, postcode: data.postcode || devDetails.postcode },
        user?.preferences
      )),
      externalsAssessment: {
        id: `ext-imp-${Date.now()}`,
        name: 'Site-Wide External Works',
        status: 'In Progress',
        locationName: user?.preferences?.defaultRegion || 'Outer London',
        locationFactor: user?.preferences?.defaultLocationFactor || 1.00,
        baseRate: 2600,
        categoryLabel: 'Flats/ Apartments - Medium Rise 4-10 Storeys',
        items: DEFAULT_LANDSCAPING_ITEMS.map((item, idx) => ({
          id: `imp-ext-lnd-${idx}`,
          ...item,
        })) as ExternalItem[],
        fees: { professionalPercent: 12.5, localAuthority: 0 }
      },
      documents: [],
      isFavourite: false
    };
    setDevelopments(prev => [newDev, ...prev]);
    return newDev;
  };

  const deleteDevelopment = (id: string) => {
    setDevelopments(prev => prev.filter(d => d.id !== id));
  };

  const toggleFavourite = (id: string) => {
    setDevelopments(prev => prev.map(d => d.id === id ? { ...d, isFavourite: !d.isFavourite } : d));
  };

  const toggleArchive = (id: string) => {
    setDevelopments(prev => prev.map(d => d.id === id ? { ...d, isArchived: !d.isArchived } : d));
  };

  const toggleTemplateFavourite = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isFavourite: !t.isFavourite } : t));
  };

  const toggleTemplateArchive = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isArchived: !t.isArchived } : t));
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const getFilteredAndSorted = () => {
    let result = developments.filter(d => 
      (d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.reference.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (showArchived ? d.isArchived : !d.isArchived)
    );
    return result;
  };

  return {
    user, setUser, login: (u: User) => setUser(u), logout: () => setUser(null),
    developments, setDevelopments, updateDevelopment, addDevelopment, createDevelopmentFromImport, deleteDevelopment, toggleFavourite, toggleArchive,
    reports, setReports, addReport, updateReport, deleteReport, addReportFromDoc, toggleReportFavourite, toggleReportArchive,
    templates, setTemplates, updateTemplate, toggleTemplateFavourite, toggleTemplateArchive, deleteTemplate, addTemplateFromFile,
    searchTerm, setSearchTerm, viewMode, setViewMode, reportViewMode, setReportViewMode, sortBy, setSortBy, showArchived, setShowArchived,
    filteredDevelopments: getFilteredAndSorted()
  };
};
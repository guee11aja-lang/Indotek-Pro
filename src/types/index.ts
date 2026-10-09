export type ProjectCategory = 'Komersial' | 'Infrastruktur' | 'Residensial' | 'Industri';
export type ProjectStatus = 'Berjalan' | 'Selesai' | 'Tertunda' | 'Pra-Konstruksi';
export type ScheduleHealth = 'Tepat Waktu' | 'Kritis' | 'Terlambat';

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  category: ProjectCategory;
  location: string;
  projectManager: string;
  siteEngineer: string;
  contractValue: number;
  approvedBudget: number;
  actualCost: number;
  startDate: string;
  targetEndDate: string;
  progressActual: number;
  progressPlanned: number;
  status: ProjectStatus;
  scheduleStatus: ScheduleHealth;
  image?: string;
  description: string;
  totalMilestones: number;
  completedMilestones: number;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  wbsCode: string;
  plannedDate: string;
  actualDate?: string;
  progress: number;
  status: 'Selesai' | 'Berjalan' | 'Menunggu' | 'Terlambat';
  weightPercent: number;
}

export interface WBSItem {
  id: string;
  projectId: string;
  code: string;
  name: string;
  category: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  plannedProgress: number;
  actualProgress: number;
  status: 'Selesai' | 'Berjalan' | 'Terlambat' | 'Belum Mulai';
  criticalPath: boolean;
  assignedTeam: string;
}

export interface BudgetLine {
  id: string;
  projectId: string;
  code: string;
  divisionName: string;
  category: 'Pekerjaan Struktur' | 'Pekerjaan Arsitektur' | 'Pekerjaan MEP' | 'Pekerjaan Persiapan' | 'Manajemen & Overhead';
  plannedAmount: number;
  actualAmount: number;
  unit: string;
  volume: number;
  unitRate: number;
  varianceAmount: number;
  variancePercent: number;
  status: 'Aman' | 'Peringatan' | 'Overbudget';
}

export interface MaterialItem {
  id: string;
  code: string;
  name: string;
  specification: string;
  category: 'Semen & Pasir' | 'Besi & Baja' | 'Beton Readymix' | 'Arsitektural' | 'MEP & Utilitas';
  unit: string;
  currentStock: number;
  minStock: number;
  allocatedProject: string;
  warehouseLocation: string;
  primarySupplier: string;
  unitPrice: number;
  lastRestocked: string;
  status: 'Aman' | 'Menipis' | 'Kritis';
}

export interface StockMutation {
  id: string;
  materialId: string;
  materialName: string;
  date: string;
  type: 'Masuk' | 'Keluar';
  quantity: number;
  unit: string;
  referenceNo: string;
  project: string;
  handler: string;
}

export type StockAdjustmentStatus = 'Menunggu' | 'Disetujui' | 'Ditolak';

export interface StockAdjustment {
  id: string;
  adjustmentNo: string;
  materialId: string;
  materialName: string;
  materialCode: string;
  projectId: string;
  projectName: string;
  previousStock: number;
  physicalStock: number;
  varianceQuantity: number;
  unit: string;
  reason:
    | 'Kerusakan Fisik di Site'
    | 'Susut / Faktor Cuaca'
    | 'Selisih Bongkar Muat'
    | 'Retur Pekerjaan Subkon'
    | 'Koreksi Opname Fisik';
  evidenceRef: string;
  submittedBy: string;
  submittedAt: string;
  status: StockAdjustmentStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export type POStatus = 'Draft' | 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Dikirim' | 'Selesai';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  sppNumber: string;
  projectId: string;
  projectName: string;
  supplierName: string;
  itemDescription: string;
  quantitySummary: string;
  totalCost: number;
  requestDate: string;
  targetDeliveryDate: string;
  status: POStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  requester: string;
}

export interface WorkforceEntry {
  role: string;
  count: number;
}

export type FieldReportStatus = 'Draft' | 'Diverifikasi' | 'Disetujui' | 'Perlu Revisi';

export interface FieldReport {
  id: string;
  projectId: string;
  projectName: string;
  reportNumber: string;
  date: string;
  weatherMorning: 'Cerah' | 'Berawan' | 'Hujan Ringan' | 'Hujan Deras';
  weatherAfternoon: 'Cerah' | 'Berawan' | 'Hujan Ringan' | 'Hujan Deras';
  workingHours: number;
  siteSupervisor: string;
  workforce: WorkforceEntry[];
  completedWorks: string[];
  materialsUsed: { name: string; quantity: string }[];
  equipmentUsed: { name: string; hours: number }[];
  blockers?: string;
  status: FieldReportStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  reviewerNotes?: string;
  photos: { url: string; caption: string }[];
}

export interface BudgetRevision {
  id: string;
  projectId: string;
  projectName: string;
  revisionNumber: string;
  title: string;
  divisionName: string;
  originalAmount: number;
  proposedAmount: number;
  varianceAmount: number;
  justification: string;
  status: 'Draft' | 'Menunggu' | 'Disetujui' | 'Ditolak';
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export type PettyCashCategory =
  | 'Konsumsi & Lembur'
  | 'BBM & Logistik Ringan'
  | 'K3 & Obat P3K'
  | 'Perkakas Kecil & Baut'
  | 'Lain-lain';

export type PettyCashStatus = 'Draft' | 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Dicairkan';

export interface PettyCashEntry {
  id: string;
  pettyCashNo: string;
  projectId: string;
  projectName: string;
  requester: string;
  amount: number;
  category: PettyCashCategory;
  purpose: string;
  receiptProof: string;
  status: PettyCashStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  nip: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  assignedProjects: string[];
  status: 'Aktif' | 'Di Lapangan' | 'Cuti' | 'Nonaktif';
  lastActive: string;
  permissions: {
    canViewBudget: boolean;
    canEditBudget: boolean;
    canApprovePO: boolean;
    canCreateFieldReport: boolean;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'warning' | 'info' | 'success' | 'alert';
  read: boolean;
  targetScreen?: string;
  targetRoles?: string[];
  projectId?: string;
  dedupKey?: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  projectName: string;
  user: string;
  action: string;
  timestamp: string;
  type: 'progress' | 'cost' | 'material' | 'report' | 'milestone';
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  department: string;
  nip: string;
  workspaceId: string;
  assignedProjects?: string[];
  status?: 'Aktif' | 'Nonaktif';
  createdAt?: string;
  updatedAt?: string;
}

export * from './rbac';

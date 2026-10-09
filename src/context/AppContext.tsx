import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Project,
  PurchaseOrder,
  MaterialItem,
  FieldReport,
  NotificationItem,
  StockMutation,
  TeamMember,
  ProjectActivity
} from '../types';
import {
  AuditLogEntry,
  AuditActionType,
  BudgetRevision,
  PettyCashEntry,
  StockAdjustment,
  AppRole,
  FieldReportStatus,
  POStatus
} from '../types';
import {
  INITIAL_PROJECTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_MATERIALS,
  INITIAL_FIELD_REPORTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_STOCK_MUTATIONS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_ACTIVITIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_BUDGET_REVISIONS,
  INITIAL_PETTY_CASH,
  INITIAL_STOCK_ADJUSTMENTS
} from '../data/mockData';
import { firestoreService } from '../services/firestoreService';
import { testConnection } from '../lib/firebase';
import { useAuth } from './AuthContext';

export type ScreenId =
  | 'dashboard'
  | 'projects'
  | 'project-detail'
  | 'schedule'
  | 'budget'
  | 'materials'
  | 'procurement'
  | 'field-reports'
  | 'team'
  | 'reports'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  title?: string;
  message: string;
}

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  taxNumberNPWP: string;
  tableDensity: 'comfortable' | 'compact';
  currency: string;
  dateFormat: string;
  alertScheduleDeviation: boolean;
  alertCriticalStock: boolean;
  alertHighValuePO: boolean;
  language: 'id' | 'en';
}

interface AppContextType {
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  projectDetailTab: string;
  setProjectDetailTab: (tab: string) => void;
  navigateToProjectDetail: (projectId: string, tab?: string) => void;

  // Global search
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Sidebar & Navigation drawers
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (c: boolean | ((prev: boolean) => boolean)) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (o: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (o: boolean) => void;

  // Data states
  projects: Project[];
  purchaseOrders: PurchaseOrder[];
  materials: MaterialItem[];
  fieldReports: FieldReport[];
  notifications: NotificationItem[];
  stockMutations: StockMutation[];
  teamMembers: TeamMember[];
  activities: ProjectActivity[];
  auditLogs: AuditLogEntry[];
  budgetRevisions: BudgetRevision[];
  pettyCash: PettyCashEntry[];
  stockAdjustments: StockAdjustment[];

  // Workflows & Actions
  addProject: (newProj: Omit<Project, 'id' | 'totalMilestones' | 'completedMilestones'>) => Promise<void>;
  approvePurchaseOrder: (poId: string, approverName: string) => Promise<void>;
  rejectPurchaseOrder: (poId: string, rejectorName: string, reason: string) => Promise<void>;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status'>) => Promise<void>;
  addStockMutation: (mutation: Omit<StockMutation, 'id'>) => Promise<void>;
  submitStockAdjustment: (adj: Omit<StockAdjustment, 'id' | 'adjustmentNo' | 'status' | 'submittedAt'>) => Promise<void>;
  approveStockAdjustment: (adjId: string, approverName: string) => Promise<void>;
  rejectStockAdjustment: (adjId: string, rejectorName: string, reason: string) => Promise<void>;
  addFieldReport: (report: Omit<FieldReport, 'id' | 'reportNumber' | 'status'>) => Promise<void>;
  reviewFieldReport: (reportId: string, reviewerName: string, status: FieldReportStatus, notes?: string) => Promise<void>;
  
  // Budget Revisions Workflow
  submitBudgetRevision: (rev: Omit<BudgetRevision, 'id' | 'revisionNumber' | 'status' | 'submittedAt'>) => Promise<void>;
  approveBudgetRevision: (revId: string, approverName: string) => Promise<void>;
  rejectBudgetRevision: (revId: string, rejectorName: string, reason: string) => Promise<void>;

  // Petty Cash Workflow
  submitPettyCash: (cash: Omit<PettyCashEntry, 'id' | 'pettyCashNo' | 'status' | 'submittedAt'>) => Promise<void>;
  approvePettyCash: (cashId: string, approverName: string) => Promise<void>;
  rejectPettyCash: (cashId: string, rejectorName: string, reason: string) => Promise<void>;
  disbursePettyCash: (cashId: string, disburserName: string) => Promise<void>;

  // Team Management & RBAC
  updateTeamMemberRole: (memberId: string, newRole: AppRole, assignedProjects: string[]) => Promise<void>;
  toggleTeamMemberStatus: (memberId: string) => Promise<void>;
  inviteTeamMember: (member: Omit<TeamMember, 'id' | 'lastActive' | 'permissions'>) => Promise<void>;

  // Milestone Sign-off
  signOffMilestone: (milestoneId: string, milestoneTitle: string, projectName: string) => Promise<void>;

  // Audit Logging
  recordAuditEvent: (
    action: AuditActionType,
    recordType: AuditLogEntry['recordType'],
    recordId: string,
    details: string,
    projectId?: string,
    projectName?: string,
    extra?: { previousValue?: string; newValue?: string; metadata?: any }
  ) => Promise<void>;

  // Notifications
  sendNotification: (notifData: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotificationCount: number;

  // Modal dialogs
  isAddProjectModalOpen: boolean;
  setIsAddProjectModalOpen: (open: boolean) => void;

  // Toast notifications
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Cloud Firestore Sync State
  isFirestoreSyncing: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, activeRole } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('prj-001');
  const [projectDetailTab, setProjectDetailTab] = useState<string>('overview');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState<boolean>(false);

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [materials, setMaterials] = useState<MaterialItem[]>(INITIAL_MATERIALS);
  const [fieldReports, setFieldReports] = useState<FieldReport[]>(INITIAL_FIELD_REPORTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [stockMutations, setStockMutations] = useState<StockMutation[]>(INITIAL_STOCK_MUTATIONS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [activities, setActivities] = useState<ProjectActivity[]>(INITIAL_ACTIVITIES);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [budgetRevisions, setBudgetRevisions] = useState<BudgetRevision[]>(INITIAL_BUDGET_REVISIONS);
  const [pettyCash, setPettyCash] = useState<PettyCashEntry[]>(INITIAL_PETTY_CASH);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(INITIAL_STOCK_ADJUSTMENTS);
  const [isFirestoreSyncing, setIsFirestoreSyncing] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'PT Indotek Bangun Nusantara',
    companyAddress: 'Gedung Graha Surveyor Indonesia Lt. 14, Jl. Gatot Subroto Kav. 56, Jakarta Selatan 12950',
    taxNumberNPWP: '01.345.678.9-012.000',
    tableDensity: 'comfortable',
    currency: 'IDR (Rp)',
    dateFormat: 'DD/MM/YYYY',
    alertScheduleDeviation: true,
    alertCriticalStock: true,
    alertHighValuePO: true,
    language: 'id',
  });

  // Test connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Firebase Real-time Synchronization
  useEffect(() => {
    if (!currentUser) return;

    let unsubProjects: (() => void) | undefined;
    let unsubPOs: (() => void) | undefined;
    let unsubMaterials: (() => void) | undefined;
    let unsubFieldReports: (() => void) | undefined;
    let unsubNotifications: (() => void) | undefined;
    let unsubActivities: (() => void) | undefined;
    let unsubAuditLogs: (() => void) | undefined;
    let unsubTeamMembers: (() => void) | undefined;
    let unsubBudgetRevisions: (() => void) | undefined;
    let unsubPettyCash: (() => void) | undefined;
    let unsubStockAdjustments: (() => void) | undefined;

    const setupSync = async () => {
      setIsFirestoreSyncing(true);
      await firestoreService.seedInitialDataIfEmpty();

      unsubProjects = firestoreService.subscribeProjects(
        (items) => {
          if (items.length > 0) setProjects(items);
        },
        (err) => console.warn('Projects sync fallback to local:', err)
      );

      unsubPOs = firestoreService.subscribePurchaseOrders(
        (items) => {
          if (items.length > 0) setPurchaseOrders(items);
        },
        (err) => console.warn('Purchase orders sync fallback:', err)
      );

      unsubMaterials = firestoreService.subscribeMaterials(
        (items) => {
          if (items.length > 0) setMaterials(items);
        },
        (err) => console.warn('Materials sync fallback:', err)
      );

      unsubFieldReports = firestoreService.subscribeFieldReports(
        (items) => {
          if (items.length > 0) setFieldReports(items);
        },
        (err) => console.warn('Field reports sync fallback:', err)
      );

      unsubNotifications = firestoreService.subscribeNotifications(
        (items) => {
          if (items.length > 0) setNotifications(items);
        },
        (err) => console.warn('Notifications sync fallback:', err)
      );

      unsubActivities = firestoreService.subscribeActivities(
        (items) => {
          if (items.length > 0) setActivities(items);
        },
        (err) => console.warn('Activities sync fallback:', err)
      );

      unsubAuditLogs = firestoreService.subscribeAuditLogs(
        (items) => {
          if (items.length > 0) setAuditLogs(items);
        },
        (err) => console.warn('Audit logs sync fallback:', err)
      );

      unsubTeamMembers = firestoreService.subscribeTeamMembers(
        (items) => {
          if (items.length > 0) setTeamMembers(items);
        },
        (err) => console.warn('Team members sync fallback:', err)
      );

      unsubBudgetRevisions = firestoreService.subscribeBudgetRevisions(
        (items) => {
          if (items.length > 0) setBudgetRevisions(items);
        },
        (err) => console.warn('Budget revisions sync fallback:', err)
      );

      unsubPettyCash = firestoreService.subscribePettyCash(
        (items) => {
          if (items.length > 0) setPettyCash(items);
        },
        (err) => console.warn('Petty cash sync fallback:', err)
      );

      unsubStockAdjustments = firestoreService.subscribeStockAdjustments(
        (items) => {
          if (items.length > 0) setStockAdjustments(items);
        },
        (err) => console.warn('Stock adjustments sync fallback:', err)
      );

      setIsFirestoreSyncing(false);
    };

    setupSync();

    return () => {
      if (unsubProjects) unsubProjects();
      if (unsubPOs) unsubPOs();
      if (unsubMaterials) unsubMaterials();
      if (unsubFieldReports) unsubFieldReports();
      if (unsubNotifications) unsubNotifications();
      if (unsubActivities) unsubActivities();
      if (unsubAuditLogs) unsubAuditLogs();
      if (unsubTeamMembers) unsubTeamMembers();
      if (unsubBudgetRevisions) unsubBudgetRevisions();
      if (unsubPettyCash) unsubPettyCash();
      if (unsubStockAdjustments) unsubStockAdjustments();
    };
  }, [currentUser]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigateToProjectDetail = (projectId: string, tab = 'overview') => {
    setSelectedProjectId(projectId);
    setProjectDetailTab(tab);
    setCurrentScreen('project-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sendNotification = async (notifData: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    if (notifData.dedupKey && notifications.some((n) => n.dedupKey === notifData.dedupKey)) {
      return;
    }
    const id = 'notif-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const newNotif: NotificationItem = {
      ...notifData,
      id,
      timestamp: 'Baru saja',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    if (currentUser) {
      try {
        await firestoreService.addNotification(newNotif);
      } catch (err) {
        console.warn('Persistent notification write notice:', err);
      }
    }
  };

  // Centralized Audit Logging
  const recordAuditEvent = async (
    action: AuditActionType,
    recordType: AuditLogEntry['recordType'],
    recordId: string,
    details: string,
    projectId?: string,
    projectName?: string,
    extra?: { previousValue?: string; newValue?: string; metadata?: any }
  ) => {
    const auditEntry: AuditLogEntry = {
      id: 'aud-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      action,
      actor: {
        uid: currentUser?.uid || 'usr-local',
        name: currentUser?.displayName || userProfile?.name || 'Ir. Bambang Sujarwo, IPU',
        email: currentUser?.email || userProfile?.email || 'direksi@indotekpro.id',
        role: activeRole,
      },
      workspaceId: 'indotek-jkt',
      projectId,
      projectName,
      recordType,
      recordId,
      details,
      previousValue: extra?.previousValue,
      newValue: extra?.newValue,
      metadata: extra?.metadata,
      timestamp: new Date().toISOString(),
      correlationId: 'evt-' + Date.now().toString(36),
    };

    // Optimistic append
    setAuditLogs((prev) => [auditEntry, ...prev]);

    // Persistent Firestore Write
    if (currentUser) {
      try {
        await firestoreService.logAuditEvent(auditEntry);
      } catch (err) {
        console.warn('Persistent audit log write notice:', err);
      }
    }
  };

  const addProject = async (newProj: Omit<Project, 'id' | 'totalMilestones' | 'completedMilestones'>) => {
    const localId = 'prj-' + (projects.length + 1).toString().padStart(3, '0');
    const project: Project = {
      ...newProj,
      id: localId,
      totalMilestones: 8,
      completedMilestones: 0,
    };
    // Optimistic update
    setProjects((prev) => [project, ...prev]);

    // Add activity
    const activityItem: ProjectActivity = {
      id: 'act-' + Date.now(),
      projectId: localId,
      projectName: project.name,
      user: currentUser?.displayName || userProfile?.name || 'Ir. Bambang Sujarwo',
      action: `Mendaftarkan proyek baru: ${project.name} (${project.code})`,
      timestamp: 'Baru saja',
      type: 'progress',
    };
    setActivities((prev) => [activityItem, ...prev]);

    await recordAuditEvent(
      'PROJECT_CREATED',
      'project',
      localId,
      `Mendaftarkan proyek baru: ${project.name} (${project.code}) dengan pagu ${project.approvedBudget.toLocaleString('id-ID')} IDR`,
      localId,
      project.name
    );

    addToast({
      type: 'success',
      title: 'Proyek Berhasil Ditambahkan',
      message: `Proyek ${project.name} (${project.code}) telah didaftarkan ke portofolio aktif.`,
    });

    if (currentUser) {
      try {
        await firestoreService.addProject(newProj);
        await firestoreService.logActivity(activityItem);
      } catch (err) {
        console.warn('Persistent project write notice:', err);
      }
    }
  };

  // Workflow: Approve Purchase Order
  const approvePurchaseOrder = async (poId: string, approverName: string) => {
    const targetPO = purchaseOrders.find((p) => p.id === poId);
    if (!targetPO) return;

    if (targetPO.status === 'Disetujui') {
      addToast({
        type: 'warning',
        title: 'PO Sudah Disetujui',
        message: `${targetPO.poNumber} sudah berstatus disetujui sebelumnya.`,
      });
      return;
    }

    const approvedAt = new Date().toISOString();

    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === poId
          ? { ...po, status: 'Disetujui', approvedBy: approverName, approvedAt, rejectionReason: undefined }
          : po
      )
    );

    await recordAuditEvent(
      'PO_APPROVED',
      'purchase_order',
      poId,
      `Menyetujui PO ${targetPO.poNumber} (${targetPO.itemDescription}) senilai Rp ${targetPO.totalCost.toLocaleString('id-ID')}`,
      targetPO.projectId,
      targetPO.projectName,
      { previousValue: targetPO.status, newValue: 'Disetujui' }
    );

    await sendNotification({
      title: 'Purchase Order Disetujui',
      message: `${targetPO.poNumber} senilai Rp ${targetPO.totalCost.toLocaleString('id-ID')} disetujui oleh ${approverName}. Siap diproses pengiriman vendor.`,
      type: 'success',
      targetScreen: 'procurement',
      targetRoles: ['Procurement', 'Project Manager', 'Warehouse / Inventory'],
      projectId: targetPO.projectId,
      dedupKey: `po-app-${poId}`,
    });

    addToast({
      type: 'success',
      title: 'PO Disetujui',
      message: `${targetPO.poNumber} senilai Rp ${targetPO.totalCost.toLocaleString('id-ID')} disetujui oleh ${approverName}.`,
    });

    if (currentUser) {
      try {
        await firestoreService.approvePurchaseOrder(poId, approverName);
        await firestoreService.logActivity({
          projectId: targetPO.projectId,
          projectName: targetPO.projectName,
          user: approverName,
          action: `Menyetujui Purchase Order ${targetPO.poNumber} senilai Rp ${targetPO.totalCost.toLocaleString('id-ID')}`,
          timestamp: 'Baru saja',
          type: 'cost',
        });
      } catch (err) {
        console.warn('Persistent PO approval notice:', err);
      }
    }
  };

  // Workflow: Reject Purchase Order
  const rejectPurchaseOrder = async (poId: string, rejectorName: string, reason: string) => {
    const targetPO = purchaseOrders.find((p) => p.id === poId);
    if (!targetPO) return;

    const rejectedAt = new Date().toISOString();

    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === poId
          ? { ...po, status: 'Ditolak', rejectedBy: rejectorName, rejectedAt, rejectionReason: reason }
          : po
      )
    );

    await recordAuditEvent(
      'PO_REJECTED',
      'purchase_order',
      poId,
      `Menolak pengajuan PO ${targetPO.poNumber}. Alasan: ${reason}`,
      targetPO.projectId,
      targetPO.projectName,
      { previousValue: targetPO.status, newValue: 'Ditolak', metadata: { reason } }
    );

    await sendNotification({
      title: 'Purchase Order Ditolak',
      message: `${targetPO.poNumber} ditolak oleh ${rejectorName}. Alasan: "${reason}".`,
      type: 'warning',
      targetScreen: 'procurement',
      targetRoles: ['Procurement', 'Project Manager'],
      projectId: targetPO.projectId,
      dedupKey: `po-rej-${poId}`,
    });

    addToast({
      type: 'danger',
      title: 'PO Ditolak',
      message: `${targetPO.poNumber} telah ditolak. Alasan: "${reason}".`,
    });

    if (currentUser) {
      try {
        await firestoreService.rejectPurchaseOrder(poId, rejectorName, reason);
        await firestoreService.logActivity({
          projectId: targetPO.projectId,
          projectName: targetPO.projectName,
          user: rejectorName,
          action: `Menolak Purchase Order ${targetPO.poNumber}: ${reason}`,
          timestamp: 'Baru saja',
          type: 'cost',
        });
      } catch (err) {
        console.warn('Persistent PO rejection notice:', err);
      }
    }
  };

  const addPurchaseOrder = async (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status'>) => {
    const localId = 'po-' + (purchaseOrders.length + 1).toString().padStart(2, '0');
    const poNumber = `PO-2026-IND-0${(140 + purchaseOrders.length).toString()}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id: localId,
      poNumber,
      status: 'Menunggu',
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);

    await recordAuditEvent(
      'PO_SUBMITTED',
      'purchase_order',
      localId,
      `Mengajukan SPP / PO baru ${poNumber} untuk ${newPO.supplierName} senilai Rp ${newPO.totalCost.toLocaleString('id-ID')}`,
      newPO.projectId,
      newPO.projectName
    );

    await sendNotification({
      title: 'SPP / Pengadaan Baru Menunggu Otorisasi',
      message: `${poNumber} (${newPO.supplierName}) senilai Rp ${newPO.totalCost.toLocaleString('id-ID')} diajukan oleh ${newPO.requester}.`,
      type: 'alert',
      targetScreen: 'procurement',
      targetRoles: ['Owner / Director', 'Finance / Accounting', 'Project Manager'],
      projectId: newPO.projectId,
      dedupKey: `spp-sub-${localId}`,
    });

    addToast({
      type: 'info',
      title: 'Permintaan Pembelian Dibuat',
      message: `${poNumber} untuk ${newPO.projectName} berhasil diajukan untuk verifikasi wewenang.`,
    });

    if (currentUser) {
      try {
        await firestoreService.addPurchaseOrder(poData);
      } catch (err) {
        console.warn('Persistent PO creation notice:', err);
      }
    }
  };

  const addStockMutation = async (mutationData: Omit<StockMutation, 'id'>) => {
    const localId = 'mut-' + Date.now();
    const newMutation: StockMutation = { ...mutationData, id: localId };
    setStockMutations((prev) => [newMutation, ...prev]);

    const targetMat = materials.find((m) => m.name === mutationData.materialName);
    setMaterials((prev) =>
      prev.map((mat) => {
        if (mat.name === mutationData.materialName) {
          const newStock =
            mutationData.type === 'Masuk'
              ? mat.currentStock + mutationData.quantity
              : Math.max(0, mat.currentStock - mutationData.quantity);
          const newStatus =
            newStock <= mat.minStock * 0.5
              ? 'Kritis'
              : newStock <= mat.minStock
              ? 'Menipis'
              : 'Aman';
          return { ...mat, currentStock: newStock, status: newStatus };
        }
        return mat;
      })
    );

    await recordAuditEvent(
      'STOCK_MUTATION_RECORDED',
      'material',
      localId,
      `Mencatat surat jalan ${mutationData.type}: ${mutationData.quantity} ${mutationData.unit} ${mutationData.materialName} (Ref: ${mutationData.referenceNo})`,
      undefined,
      mutationData.project
    );

    addToast({
      type: 'success',
      title: 'Surat Jalan Dicatat',
      message: `Mutasi ${mutationData.type} ${mutationData.quantity} ${mutationData.unit} ${mutationData.materialName} berhasil diperbarui.`,
    });

    if (currentUser) {
      try {
        await firestoreService.addStockMutation(mutationData, targetMat);
      } catch (err) {
        console.warn('Persistent stock mutation notice:', err);
      }
    }
  };

  const addFieldReport = async (reportData: Omit<FieldReport, 'id' | 'reportNumber' | 'status'>) => {
    const localId = 'fr-' + (fieldReports.length + 1).toString().padStart(3, '0');
    const reportNumber = `LHP-2026-0${(230 + fieldReports.length).toString()}`;
    const newReport: FieldReport = {
      ...reportData,
      id: localId,
      reportNumber,
      status: 'Disetujui',
    };
    setFieldReports((prev) => [newReport, ...prev]);

    await recordAuditEvent(
      'FIELD_REPORT_SUBMITTED',
      'field_report',
      localId,
      `Menerbitkan Laporan Harian Lapangan ${reportNumber} oleh ${reportData.siteSupervisor}`,
      reportData.projectId,
      reportData.projectName
    );

    addToast({
      type: 'success',
      title: 'Laporan Harian Diterbitkan',
      message: `${reportNumber} untuk ${newReport.projectName} berhasil disimpan ke log harian site.`,
    });

    if (currentUser) {
      try {
        await firestoreService.addFieldReport(reportData);
      } catch (err) {
        console.warn('Persistent field report notice:', err);
      }
    }
  };

  // Workflow: Review Field Report
  const reviewFieldReport = async (
    reportId: string,
    reviewerName: string,
    status: FieldReportStatus,
    notes?: string
  ) => {
    const report = fieldReports.find((r) => r.id === reportId);
    if (!report) return;

    setFieldReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status, verifiedBy: reviewerName, verifiedAt: new Date().toISOString(), reviewerNotes: notes }
          : r
      )
    );

    await recordAuditEvent(
      status === 'Disetujui' ? 'FIELD_REPORT_APPROVED' : 'FIELD_REPORT_VERIFIED',
      'field_report',
      reportId,
      `Verifikasi laporan harian ${report.reportNumber} status: ${status}. Catatan: ${notes || '-'}`,
      report.projectId,
      report.projectName,
      { previousValue: report.status, newValue: status }
    );

    addToast({
      type: status === 'Perlu Revisi' ? 'warning' : 'success',
      title: `Laporan ${status}`,
      message: `Status laporan ${report.reportNumber} diperbarui menjadi ${status}.`,
    });

    if (currentUser) {
      try {
        await firestoreService.reviewFieldReport(reportId, reviewerName, status, notes);
      } catch (err) {
        console.warn('Persistent field report review notice:', err);
      }
    }
  };

  // Workflow: Budget Revisions
  const submitBudgetRevision = async (
    revData: Omit<BudgetRevision, 'id' | 'revisionNumber' | 'status' | 'submittedAt'>
  ) => {
    const id = 'rev-' + (budgetRevisions.length + 1).toString().padStart(2, '0');
    const revisionNumber = `ADD-REV-0${budgetRevisions.length + 1}/${revData.projectName.substring(0, 3).toUpperCase()}/2026`;
    const newRev: BudgetRevision = {
      ...revData,
      id,
      revisionNumber,
      status: 'Menunggu',
      submittedAt: new Date().toISOString(),
    };

    setBudgetRevisions((prev) => [newRev, ...prev]);

    await recordAuditEvent(
      'BUDGET_REVISED',
      'budget',
      id,
      `Pengajuan addendum revisi anggaran ${revisionNumber}: selisih Rp ${revData.varianceAmount.toLocaleString('id-ID')} (${revData.title})`,
      revData.projectId,
      revData.projectName
    );

    await sendNotification({
      title: 'Pengajuan Addendum Revisi RAB',
      message: `${revisionNumber} (+Rp ${revData.varianceAmount.toLocaleString('id-ID')}) untuk ${revData.projectName} menunggu persetujuan Direksi & Keuangan.`,
      type: 'alert',
      targetScreen: 'budget',
      targetRoles: ['Owner / Director', 'Finance / Accounting'],
      projectId: revData.projectId,
      dedupKey: `rev-sub-${id}`,
    });

    addToast({
      type: 'info',
      title: 'Revisi RAB Diajukan',
      message: `Addendum ${revisionNumber} berhasil diajukan untuk verifikasi Direksi & Finance.`,
    });

    if (currentUser) {
      try {
        await firestoreService.addBudgetRevision(newRev);
      } catch (err) {
        console.warn('Persistent budget revision write notice:', err);
      }
    }
  };

  const approveBudgetRevision = async (revId: string, approverName: string) => {
    const rev = budgetRevisions.find((r) => r.id === revId);
    if (!rev) return;

    if (rev.status === 'Disetujui') {
      addToast({
        type: 'warning',
        title: 'Sudah Disetujui',
        message: `Addendum ${rev.revisionNumber} sudah berstatus disetujui.`,
      });
      return;
    }

    setBudgetRevisions((prev) =>
      prev.map((r) =>
        r.id === revId
          ? { ...r, status: 'Disetujui', reviewedBy: approverName, reviewedAt: new Date().toISOString() }
          : r
      )
    );

    // Update target project approvedBudget
    setProjects((prev) =>
      prev.map((p) =>
        p.id === rev.projectId
          ? { ...p, approvedBudget: p.approvedBudget + rev.varianceAmount }
          : p
      )
    );

    await recordAuditEvent(
      'BUDGET_APPROVED',
      'budget',
      revId,
      `Menyetujui addendum anggaran ${rev.revisionNumber} (+Rp ${rev.varianceAmount.toLocaleString('id-ID')}). Pagu proyek diperbarui.`,
      rev.projectId,
      rev.projectName,
      { previousValue: 'Menunggu', newValue: 'Disetujui' }
    );

    await sendNotification({
      title: 'Addendum Revisi RAB Disetujui',
      message: `Addendum ${rev.revisionNumber} (+Rp ${rev.varianceAmount.toLocaleString('id-ID')}) disetujui oleh ${approverName}. Pagu proyek ${rev.projectName} telah disesuaikan.`,
      type: 'success',
      targetScreen: 'budget',
      targetRoles: ['Quantity Surveyor / Estimator', 'Project Manager', 'Finance / Accounting'],
      projectId: rev.projectId,
      dedupKey: `rev-app-${revId}`,
    });

    addToast({
      type: 'success',
      title: 'Revisi RAB Disetujui',
      message: `Pagu anggaran proyek ${rev.projectName} telah disesuaikan (+Rp ${rev.varianceAmount.toLocaleString('id-ID')}).`,
    });

    if (currentUser) {
      try {
        await firestoreService.approveBudgetRevision(revId, approverName);
      } catch (err) {
        console.warn('Persistent budget revision approval notice:', err);
      }
    }
  };

  const rejectBudgetRevision = async (revId: string, rejectorName: string, reason: string) => {
    const rev = budgetRevisions.find((r) => r.id === revId);
    if (!rev) return;

    setBudgetRevisions((prev) =>
      prev.map((r) =>
        r.id === revId
          ? {
              ...r,
              status: 'Ditolak',
              reviewedBy: rejectorName,
              reviewedAt: new Date().toISOString(),
              rejectionReason: reason,
            }
          : r
      )
    );

    await recordAuditEvent(
      'BUDGET_REJECTED',
      'budget',
      revId,
      `Menolak addendum anggaran ${rev.revisionNumber}. Alasan: ${reason}`,
      rev.projectId,
      rev.projectName,
      { previousValue: 'Menunggu', newValue: 'Ditolak', metadata: { reason } }
    );

    await sendNotification({
      title: 'Addendum Revisi RAB Ditolak',
      message: `Addendum ${rev.revisionNumber} ditolak oleh ${rejectorName}. Alasan: "${reason}".`,
      type: 'warning',
      targetScreen: 'budget',
      targetRoles: ['Quantity Surveyor / Estimator', 'Project Manager'],
      projectId: rev.projectId,
      dedupKey: `rev-rej-${revId}`,
    });

    addToast({
      type: 'danger',
      title: 'Revisi RAB Ditolak',
      message: `Addendum ${rev.revisionNumber} ditolak oleh ${rejectorName}.`,
    });

    if (currentUser) {
      try {
        await firestoreService.rejectBudgetRevision(revId, rejectorName, reason);
      } catch (err) {
        console.warn('Persistent budget revision rejection notice:', err);
      }
    }
  };

  // Workflow: Petty Cash (Kas Kecil)
  const submitPettyCash = async (
    cashData: Omit<PettyCashEntry, 'id' | 'pettyCashNo' | 'status' | 'submittedAt'>
  ) => {
    const id = 'pc-' + Date.now().toString(36);
    const pettyCashNo = `KAS-${cashData.projectName.substring(0, 3).toUpperCase()}-2026-${(pettyCash.length + 1).toString().padStart(3, '0')}`;
    const newCash: PettyCashEntry = {
      ...cashData,
      id,
      pettyCashNo,
      status: 'Menunggu',
      submittedAt: new Date().toISOString(),
    };

    setPettyCash((prev) => [newCash, ...prev]);

    await recordAuditEvent(
      'PETTY_CASH_SUBMITTED',
      'petty_cash',
      id,
      `Pengajuan kas kecil ${pettyCashNo} (${cashData.category}): Rp ${cashData.amount.toLocaleString('id-ID')} untuk ${cashData.purpose}`,
      cashData.projectId,
      cashData.projectName
    );

    await sendNotification({
      title: 'Pengajuan Kas Kecil Site Baru',
      message: `${pettyCashNo} senilai Rp ${cashData.amount.toLocaleString('id-ID')} diajukan oleh ${cashData.requester}.`,
      type: 'info',
      targetScreen: 'budget',
      targetRoles: ['Finance / Accounting', 'Owner / Director', 'Project Manager'],
      projectId: cashData.projectId,
      dedupKey: `pc-sub-${id}`,
    });

    addToast({
      type: 'info',
      title: 'Kas Kecil Diajukan',
      message: `${pettyCashNo} berhasil diajukan untuk verifikasi Finance / Accounting.`,
    });

    if (currentUser) {
      try {
        await firestoreService.addPettyCash(newCash);
      } catch (err) {
        console.warn('Persistent petty cash notice:', err);
      }
    }
  };

  const approvePettyCash = async (cashId: string, approverName: string) => {
    const target = pettyCash.find((p) => p.id === cashId);
    if (!target) return;

    if (target.status === 'Disetujui' || target.status === 'Dicairkan') {
      addToast({ type: 'warning', message: 'Kas kecil sudah disetujui sebelumnya.' });
      return;
    }

    const reviewedAt = new Date().toISOString();
    setPettyCash((prev) =>
      prev.map((p) => (p.id === cashId ? { ...p, status: 'Disetujui', reviewedBy: approverName, reviewedAt } : p))
    );

    await recordAuditEvent(
      'PETTY_CASH_APPROVED',
      'petty_cash',
      cashId,
      `Menyetujui pengajuan kas kecil ${target.pettyCashNo} senilai Rp ${target.amount.toLocaleString('id-ID')}`,
      target.projectId,
      target.projectName,
      { previousValue: target.status, newValue: 'Disetujui' }
    );

    await sendNotification({
      title: 'Kas Kecil Disetujui',
      message: `${target.pettyCashNo} senilai Rp ${target.amount.toLocaleString('id-ID')} disetujui oleh ${approverName}. Menunggu pencairan kas.`,
      type: 'success',
      targetScreen: 'budget',
      targetRoles: ['Site Manager / Supervisor', 'Project Manager'],
      projectId: target.projectId,
      dedupKey: `pc-app-${cashId}`,
    });

    addToast({
      type: 'success',
      title: 'Kas Kecil Disetujui',
      message: `${target.pettyCashNo} telah disetujui.`,
    });

    if (currentUser) {
      try {
        await firestoreService.approvePettyCash(cashId, approverName);
      } catch (err) {
        console.warn('Persistent petty cash approval notice:', err);
      }
    }
  };

  const rejectPettyCash = async (cashId: string, rejectorName: string, reason: string) => {
    const target = pettyCash.find((p) => p.id === cashId);
    if (!target) return;

    const reviewedAt = new Date().toISOString();
    setPettyCash((prev) =>
      prev.map((p) => (p.id === cashId ? { ...p, status: 'Ditolak', reviewedBy: rejectorName, reviewedAt, rejectionReason: reason } : p))
    );

    await recordAuditEvent(
      'PETTY_CASH_REJECTED',
      'petty_cash',
      cashId,
      `Menolak pengajuan kas kecil ${target.pettyCashNo}. Alasan: ${reason}`,
      target.projectId,
      target.projectName,
      { previousValue: target.status, newValue: 'Ditolak', metadata: { reason } }
    );

    await sendNotification({
      title: 'Kas Kecil Ditolak',
      message: `${target.pettyCashNo} ditolak oleh ${rejectorName}. Alasan: "${reason}".`,
      type: 'warning',
      targetScreen: 'budget',
      targetRoles: ['Site Manager / Supervisor', 'Project Manager'],
      projectId: target.projectId,
      dedupKey: `pc-rej-${cashId}`,
    });

    addToast({
      type: 'danger',
      title: 'Kas Kecil Ditolak',
      message: `${target.pettyCashNo} ditolak. Alasan: "${reason}".`,
    });

    if (currentUser) {
      try {
        await firestoreService.rejectPettyCash(cashId, rejectorName, reason);
      } catch (err) {
        console.warn('Persistent petty cash rejection notice:', err);
      }
    }
  };

  const disbursePettyCash = async (cashId: string, disburserName: string) => {
    const target = pettyCash.find((p) => p.id === cashId);
    if (!target) return;

    setPettyCash((prev) =>
      prev.map((p) => (p.id === cashId ? { ...p, status: 'Dicairkan' } : p))
    );

    await recordAuditEvent(
      'PETTY_CASH_DISBURSED',
      'petty_cash',
      cashId,
      `Pencairan dana kas kecil ${target.pettyCashNo} senilai Rp ${target.amount.toLocaleString('id-ID')} oleh ${disburserName}`,
      target.projectId,
      target.projectName,
      { previousValue: target.status, newValue: 'Dicairkan' }
    );

    await sendNotification({
      title: 'Kas Kecil Telah Dicairkan',
      message: `Dana kas kecil ${target.pettyCashNo} (Rp ${target.amount.toLocaleString('id-ID')}) telah ditransfer/dicairkan oleh ${disburserName}.`,
      type: 'success',
      targetScreen: 'budget',
      targetRoles: ['Site Manager / Supervisor', 'Project Manager'],
      projectId: target.projectId,
      dedupKey: `pc-disb-${cashId}`,
    });

    addToast({
      type: 'success',
      title: 'Kas Kecil Dicairkan',
      message: `Dana ${target.pettyCashNo} telah dicairkan ke site.`,
    });

    if (currentUser) {
      try {
        await firestoreService.disbursePettyCash(cashId, disburserName);
      } catch (err) {
        console.warn('Persistent petty cash disbursement notice:', err);
      }
    }
  };

  // Workflow: Stock Adjustment (Opname Fisik & Penyesuaian Material)
  const submitStockAdjustment = async (
    adjData: Omit<StockAdjustment, 'id' | 'adjustmentNo' | 'status' | 'submittedAt'>
  ) => {
    const id = 'adj-' + Date.now().toString(36);
    const adjustmentNo = `ADJ-${adjData.projectName.substring(0, 3).toUpperCase()}-2026-${(stockAdjustments.length + 1).toString().padStart(3, '0')}`;
    const newAdj: StockAdjustment = {
      ...adjData,
      id,
      adjustmentNo,
      status: 'Menunggu',
      submittedAt: new Date().toISOString(),
    };

    setStockAdjustments((prev) => [newAdj, ...prev]);

    await recordAuditEvent(
      'STOCK_ADJUSTMENT_SUBMITTED',
      'material',
      id,
      `Pengajuan penyesuaian opname stok ${adjData.materialName} (${adjustmentNo}): selisih ${adjData.varianceQuantity > 0 ? '+' : ''}${adjData.varianceQuantity} ${adjData.unit} (${adjData.reason})`,
      adjData.projectId,
      adjData.projectName
    );

    await sendNotification({
      title: 'Pengajuan Penyesuaian Stok Material',
      message: `${adjustmentNo} (${adjData.materialName}) menunggu persetujuan Project Director / Manajer Proyek.`,
      type: 'warning',
      targetScreen: 'materials',
      targetRoles: ['Project Manager', 'Owner / Director'],
      projectId: adjData.projectId,
      dedupKey: `adj-sub-${id}`,
    });

    addToast({
      type: 'info',
      title: 'Koreksi Stok Diajukan',
      message: `${adjustmentNo} berhasil diajukan untuk verifikasi audit lapangan.`,
    });

    if (currentUser) {
      try {
        await firestoreService.addStockAdjustment(newAdj);
      } catch (err) {
        console.warn('Stock adjustment persistence notice:', err);
      }
    }
  };

  const approveStockAdjustment = async (adjId: string, approverName: string) => {
    const target = stockAdjustments.find((a) => a.id === adjId);
    if (!target) return;

    // 1. Update adjustment status
    setStockAdjustments((prev) =>
      prev.map((a) =>
        a.id === adjId
          ? {
              ...a,
              status: 'Disetujui',
              reviewedBy: approverName,
              reviewedAt: new Date().toISOString(),
            }
          : a
      )
    );

    // 2. Adjust physical stock of the material
    setMaterials((prev) =>
      prev.map((m) =>
        m.id === target.materialId
          ? {
              ...m,
              currentStock: Math.max(0, m.currentStock + target.varianceQuantity),
              status:
                m.currentStock + target.varianceQuantity <= m.minStock * 0.5
                  ? 'Kritis'
                  : m.currentStock + target.varianceQuantity <= m.minStock
                  ? 'Menipis'
                  : 'Aman',
            }
          : m
      )
    );

    await recordAuditEvent(
      'STOCK_ADJUSTMENT_APPROVED',
      'material',
      adjId,
      `Menyetujui koreksi opname stok ${target.adjustmentNo} (${target.materialName}): kuantitas ${target.varianceQuantity > 0 ? '+' : ''}${target.varianceQuantity} ${target.unit}`,
      target.projectId,
      target.projectName,
      {
        previousValue: `${target.previousStock} ${target.unit}`,
        newValue: `${target.physicalStock} ${target.unit}`,
      }
    );

    await sendNotification({
      title: 'Koreksi Stok Disetujui',
      message: `${target.adjustmentNo} (${target.materialName}) telah disetujui oleh ${approverName}. Stok fisik gudang disesuaikan.`,
      type: 'success',
      targetScreen: 'materials',
      targetRoles: ['Warehouse / Inventory', 'Site Manager / Supervisor'],
      projectId: target.projectId,
      dedupKey: `adj-app-${adjId}`,
    });

    addToast({
      type: 'success',
      title: 'Koreksi Stok Disetujui',
      message: `Stok fisik ${target.materialName} telah diselaraskan ke ${target.physicalStock} ${target.unit}.`,
    });

    if (currentUser) {
      try {
        await firestoreService.approveStockAdjustment(adjId, approverName);
      } catch (err) {
        console.warn('Approve stock adjustment persistence notice:', err);
      }
    }
  };

  const rejectStockAdjustment = async (adjId: string, rejectorName: string, reason: string) => {
    const target = stockAdjustments.find((a) => a.id === adjId);
    if (!target) return;

    setStockAdjustments((prev) =>
      prev.map((a) =>
        a.id === adjId
          ? {
              ...a,
              status: 'Ditolak',
              reviewedBy: rejectorName,
              reviewedAt: new Date().toISOString(),
              rejectionReason: reason,
            }
          : a
      )
    );

    await recordAuditEvent(
      'STOCK_ADJUSTMENT_REJECTED',
      'material',
      adjId,
      `Menolak koreksi opname ${target.adjustmentNo} (${target.materialName}). Alasan: ${reason}`,
      target.projectId,
      target.projectName,
      { previousValue: 'Menunggu', newValue: 'Ditolak' }
    );

    await sendNotification({
      title: 'Koreksi Stok Ditolak',
      message: `${target.adjustmentNo} ditolak oleh ${rejectorName}. Alasan: "${reason}".`,
      type: 'warning',
      targetScreen: 'materials',
      targetRoles: ['Warehouse / Inventory', 'Site Manager / Supervisor'],
      projectId: target.projectId,
      dedupKey: `adj-rej-${adjId}`,
    });

    addToast({
      type: 'danger',
      title: 'Koreksi Stok Ditolak',
      message: `${target.adjustmentNo} ditolak oleh ${rejectorName}.`,
    });

    if (currentUser) {
      try {
        await firestoreService.rejectStockAdjustment(adjId, rejectorName, reason);
      } catch (err) {
        console.warn('Reject stock adjustment persistence notice:', err);
      }
    }
  };

  // Team Management & RBAC Updates
  const updateTeamMemberRole = async (memberId: string, newRole: AppRole, assignedProjects: string[]) => {
    const member = teamMembers.find((m) => m.id === memberId);
    if (!member) return;

    const prevRole = member.role;
    setTeamMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, role: newRole, assignedProjects } : m
      )
    );

    await recordAuditEvent(
      'MEMBER_ROLE_CHANGED',
      'team_member',
      memberId,
      `Memperbarui hak akses personil ${member.name}: ${prevRole} -> ${newRole}`,
      undefined,
      undefined,
      { previousValue: prevRole, newValue: newRole }
    );

    addToast({
      type: 'success',
      title: 'Hak Akses Diperbarui',
      message: `Wewenang personil ${member.name} berhasil diubah menjadi ${newRole}.`,
    });

    if (currentUser) {
      try {
        await firestoreService.updateTeamMember(memberId, { role: newRole, assignedProjects });
      } catch (err) {
        console.warn('Persistent team update notice:', err);
      }
    }
  };

  const toggleTeamMemberStatus = async (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    if (!member) return;

    const newStatus = member.status === 'Nonaktif' ? 'Aktif' : 'Nonaktif';
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, status: newStatus } : m))
    );

    await recordAuditEvent(
      'MEMBER_STATUS_CHANGED',
      'team_member',
      memberId,
      `Mengubah status keaktifan personil ${member.name} menjadi ${newStatus}`,
      undefined,
      undefined,
      { previousValue: member.status, newValue: newStatus }
    );

    addToast({
      type: newStatus === 'Nonaktif' ? 'warning' : 'success',
      title: 'Status Keanggotaan Berubah',
      message: `Personil ${member.name} kini berstatus ${newStatus}.`,
    });

    if (currentUser) {
      try {
        await firestoreService.updateTeamMember(memberId, { status: newStatus });
      } catch (err) {
        console.warn('Persistent status toggle notice:', err);
      }
    }
  };

  const inviteTeamMember = async (newMember: Omit<TeamMember, 'id' | 'lastActive' | 'permissions'>) => {
    const id = 'tm-' + (teamMembers.length + 1).toString().padStart(2, '0');
    const fullMember: TeamMember = {
      ...newMember,
      id,
      lastActive: 'Baru ditambahkan',
      permissions: {
        canViewBudget: newMember.role.includes('Director') || newMember.role.includes('Finance') || newMember.role.includes('QS'),
        canEditBudget: newMember.role.includes('Director') || newMember.role.includes('QS'),
        canApprovePO: newMember.role.includes('Director') || newMember.role.includes('Finance'),
        canCreateFieldReport: newMember.role.includes('Site') || newMember.role.includes('PM'),
      },
    };

    setTeamMembers((prev) => [...prev, fullMember]);

    await recordAuditEvent(
      'MEMBER_INVITED',
      'team_member',
      id,
      `Menambahkan personil baru ${newMember.name} (${newMember.role}) dengan penugasan ke ${newMember.assignedProjects.join(', ')}`,
      undefined,
      undefined
    );

    addToast({
      type: 'success',
      title: 'Personil Ditambahkan',
      message: `Undangan & profil untuk ${newMember.name} berhasil dibuat.`,
    });

    if (currentUser) {
      try {
        await firestoreService.addTeamMember(fullMember);
      } catch (err) {
        console.warn('Persistent invite member notice:', err);
      }
    }
  };

  const signOffMilestone = async (milestoneId: string, milestoneTitle: string, projectName: string) => {
    await recordAuditEvent(
      'MILESTONE_SIGNED_OFF',
      'milestone',
      milestoneId,
      `Sign-off milestone proyek: "${milestoneTitle}" disahkan oleh ${currentUser?.displayName || 'Ir. Hendra Kurniawan'}`,
      undefined,
      projectName
    );

    addToast({
      type: 'success',
      title: 'Milestone Disahkan',
      message: `Milestone "${milestoneTitle}" telah resmi ditandatangani dan diverifikasi.`,
    });
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (currentUser) {
      try {
        await firestoreService.markNotificationAsRead(id);
      } catch (err) {
        console.warn('Persistent notification read notice:', err);
      }
    }
  };

  const markAllNotificationsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast({
      type: 'info',
      message: 'Semua notifikasi operasional telah ditandai dibaca.',
    });
    if (currentUser && unreadIds.length > 0) {
      try {
        await firestoreService.markAllNotificationsRead(unreadIds);
      } catch (err) {
        console.warn('Persistent mark all read notice:', err);
      }
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addToast({
      type: 'success',
      title: 'Pengaturan Disimpan',
      message: 'Konfigurasi workspace Indotek Pro berhasil diperbarui.',
    });
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        selectedProjectId,
        setSelectedProjectId,
        projectDetailTab,
        setProjectDetailTab,
        navigateToProjectDetail,
        globalSearch,
        setGlobalSearch,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        notificationsOpen,
        setNotificationsOpen,
        projects,
        purchaseOrders,
        materials,
        fieldReports,
        notifications,
        stockMutations,
        teamMembers,
        activities,
        auditLogs,
        budgetRevisions,
        pettyCash,
        stockAdjustments,
        addProject,
        approvePurchaseOrder,
        rejectPurchaseOrder,
        addPurchaseOrder,
        addStockMutation,
        submitStockAdjustment,
        approveStockAdjustment,
        rejectStockAdjustment,
        addFieldReport,
        reviewFieldReport,
        submitBudgetRevision,
        approveBudgetRevision,
        rejectBudgetRevision,
        submitPettyCash,
        approvePettyCash,
        rejectPettyCash,
        disbursePettyCash,
        updateTeamMemberRole,
        toggleTeamMemberStatus,
        inviteTeamMember,
        signOffMilestone,
        recordAuditEvent,
        sendNotification,
        markNotificationAsRead,
        markAllNotificationsRead,
        unreadNotificationCount,
        isAddProjectModalOpen,
        setIsAddProjectModalOpen,
        toasts,
        addToast,
        removeToast,
        settings,
        updateSettings,
        isFirestoreSyncing,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import {
  Project,
  PurchaseOrder,
  MaterialItem,
  FieldReport,
  StockMutation,
  NotificationItem,
  ProjectActivity,
  TeamMember,
  AuditLogEntry,
  BudgetRevision,
  PettyCashEntry,
  FieldReportStatus,
  StockAdjustment
} from '../types';
import {
  INITIAL_PROJECTS,
  INITIAL_MATERIALS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_FIELD_REPORTS,
  INITIAL_STOCK_MUTATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITIES,
  INITIAL_TEAM_MEMBERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BUDGET_REVISIONS,
  INITIAL_PETTY_CASH,
  INITIAL_STOCK_ADJUSTMENTS
} from '../data/mockData';

export const firestoreService = {
  /**
   * Initializes and seeds Firestore with initial mock records if collections are empty.
   */
  async seedInitialDataIfEmpty(): Promise<boolean> {
    try {
      if (!auth.currentUser) return false;
      const projectsSnap = await getDocs(collection(db, 'projects'));
      if (!projectsSnap.empty) {
        return false; // Already populated
      }

      console.info('Seeding initial Indotek Pro dataset to Cloud Firestore...');
      const batch = writeBatch(db);

      // Seed Projects
      for (const p of INITIAL_PROJECTS) {
        const ref = doc(db, 'projects', p.id);
        batch.set(ref, {
          ...p,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Seed Materials
      for (const m of INITIAL_MATERIALS) {
        const ref = doc(db, 'materials', m.id);
        batch.set(ref, {
          ...m,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Seed Purchase Orders
      for (const po of INITIAL_PURCHASE_ORDERS) {
        const ref = doc(db, 'purchase_orders', po.id);
        batch.set(ref, {
          ...po,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Seed Field Reports
      for (const fr of INITIAL_FIELD_REPORTS) {
        const ref = doc(db, 'field_reports', fr.id);
        batch.set(ref, {
          ...fr,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Seed Stock Mutations
      for (const mut of INITIAL_STOCK_MUTATIONS) {
        const ref = doc(db, 'stock_mutations', mut.id);
        batch.set(ref, {
          ...mut,
          createdAt: new Date().toISOString(),
        });
      }

      // Seed Notifications
      for (const n of INITIAL_NOTIFICATIONS) {
        const ref = doc(db, 'notifications', n.id);
        batch.set(ref, {
          ...n,
          createdAt: new Date().toISOString(),
        });
      }

      // Seed Activities
      for (const a of INITIAL_ACTIVITIES) {
        const ref = doc(db, 'activities', a.id);
        batch.set(ref, {
          ...a,
          createdAt: new Date().toISOString(),
        });
      }

      // Seed Team Members
      for (const tm of INITIAL_TEAM_MEMBERS) {
        const ref = doc(db, 'team_members', tm.id);
        batch.set(ref, {
          ...tm,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Seed Audit Logs
      for (const log of INITIAL_AUDIT_LOGS) {
        const ref = doc(db, 'audit_logs', log.id);
        batch.set(ref, {
          ...log,
          createdAt: new Date().toISOString(),
        });
      }

      // Seed Budget Revisions
      for (const rev of INITIAL_BUDGET_REVISIONS) {
        const ref = doc(db, 'budget_revisions', rev.id);
        batch.set(ref, {
          ...rev,
          createdAt: new Date().toISOString(),
        });
      }

      // Seed Petty Cash
      for (const pc of INITIAL_PETTY_CASH) {
        const ref = doc(db, 'petty_cash', pc.id);
        batch.set(ref, {
          ...pc,
          createdAt: new Date().toISOString(),
        });
      }

      // Seed Stock Adjustments
      for (const sa of INITIAL_STOCK_ADJUSTMENTS) {
        const ref = doc(db, 'stock_adjustments', sa.id);
        batch.set(ref, {
          ...sa,
          createdAt: new Date().toISOString(),
        });
      }

      await batch.commit();
      console.info('Initial Indotek Pro dataset successfully synchronized to Firestore.');
      return true;
    } catch (error) {
      console.warn('Notice: Firestore seeding skipped or deferred:', error);
      return false;
    }
  },

  // Projects Subscriptions & Actions
  subscribeProjects(callback: (projects: Project[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'projects');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: Project[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        callback(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'projects');
      }
    );
  },

  async addProject(projectData: Omit<Project, 'id' | 'totalMilestones' | 'completedMilestones'>): Promise<string> {
    const id = `prj-${Date.now().toString(36)}`;
    const fullProject: Project = {
      ...projectData,
      id,
      totalMilestones: 6,
      completedMilestones: 0,
    };
    try {
      await setDoc(doc(db, 'projects', id), {
        ...fullProject,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projects/${id}`);
    }
  },

  // Purchase Orders Subscriptions & Actions
  subscribePurchaseOrders(callback: (orders: PurchaseOrder[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'purchase_orders');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: PurchaseOrder[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        callback(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'purchase_orders');
      }
    );
  },

  async addPurchaseOrder(poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status'>): Promise<string> {
    const id = `po-${Date.now().toString(36)}`;
    const poNumber = `PO-2026-IND-0${Math.floor(Math.random() * 80) + 10}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id,
      poNumber,
      status: 'Menunggu',
    };
    try {
      await setDoc(doc(db, 'purchase_orders', id), {
        ...newPO,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `purchase_orders/${id}`);
    }
  },

  async approvePurchaseOrder(poId: string, approverName: string): Promise<void> {
    try {
      const docRef = doc(db, 'purchase_orders', poId);
      await updateDoc(docRef, {
        status: 'Disetujui',
        approvedBy: approverName,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `purchase_orders/${poId}`);
    }
  },

  async rejectPurchaseOrder(poId: string, rejectorName: string, rejectionReason: string): Promise<void> {
    try {
      const docRef = doc(db, 'purchase_orders', poId);
      await updateDoc(docRef, {
        status: 'Ditolak',
        rejectedBy: rejectorName,
        rejectedAt: new Date().toISOString(),
        rejectionReason,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `purchase_orders/${poId}`);
    }
  },

  // Materials Subscriptions & Actions
  subscribeMaterials(callback: (materials: MaterialItem[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'materials');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: MaterialItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        callback(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'materials');
      }
    );
  },

  async addStockMutation(
    mutationData: Omit<StockMutation, 'id'>,
    currentMaterial?: MaterialItem
  ): Promise<string> {
    const id = `mut-${Date.now().toString(36)}`;
    const newMut: StockMutation = {
      ...mutationData,
      id,
    };
    try {
      await setDoc(doc(db, 'stock_mutations', id), {
        ...newMut,
        createdAt: new Date().toISOString(),
      });

      // Update material stock if material exists
      if (currentMaterial) {
        const newStock =
          mutationData.type === 'Masuk'
            ? currentMaterial.currentStock + mutationData.quantity
            : Math.max(0, currentMaterial.currentStock - mutationData.quantity);

        const newStatus =
          newStock <= currentMaterial.minStock * 0.5
            ? 'Kritis'
            : newStock <= currentMaterial.minStock
            ? 'Menipis'
            : 'Aman';

        await updateDoc(doc(db, 'materials', currentMaterial.id), {
          currentStock: newStock,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      }

      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `stock_mutations/${id}`);
    }
  },

  // Field Reports Subscriptions & Actions
  subscribeFieldReports(callback: (reports: FieldReport[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'field_reports');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: FieldReport[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        callback(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'field_reports');
      }
    );
  },

  async addFieldReport(reportData: Omit<FieldReport, 'id' | 'reportNumber' | 'status'>): Promise<string> {
    const id = `fr-${Date.now().toString(36)}`;
    const reportNumber = `LHP-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const newReport: FieldReport = {
      ...reportData,
      id,
      reportNumber,
      status: 'Disetujui',
    };
    try {
      await setDoc(doc(db, 'field_reports', id), {
        ...newReport,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `field_reports/${id}`);
    }
  },

  async reviewFieldReport(
    reportId: string,
    reviewerName: string,
    status: FieldReportStatus,
    reviewerNotes?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'field_reports', reportId);
      await updateDoc(docRef, {
        status,
        verifiedBy: reviewerName,
        verifiedAt: new Date().toISOString(),
        reviewerNotes: reviewerNotes || '',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `field_reports/${reportId}`);
    }
  },

  // Notifications Subscriptions & Actions
  subscribeNotifications(callback: (notifications: NotificationItem[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'notifications');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: NotificationItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        callback(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'notifications');
      }
    );
  },

  async markNotificationAsRead(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  },

  async markAllNotificationsRead(ids: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const id of ids) {
        batch.update(doc(db, 'notifications', id), { read: true });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  },

  async addNotification(notif: NotificationItem): Promise<string> {
    try {
      await setDoc(doc(db, 'notifications', notif.id), {
        ...notif,
        createdAt: new Date().toISOString(),
      });
      return notif.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `notifications/${notif.id}`);
    }
  },

  // Activities Subscriptions
  subscribeActivities(callback: (activities: ProjectActivity[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'activities');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: ProjectActivity[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        callback(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'activities');
      }
    );
  },

  async logActivity(activity: Omit<ProjectActivity, 'id'>): Promise<void> {
    const id = `act-${Date.now().toString(36)}`;
    try {
      await setDoc(doc(db, 'activities', id), {
        ...activity,
        id,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `activities/${id}`);
    }
  },

  // Audit Logs Subscriptions & Append-Only Logger
  subscribeAuditLogs(callback: (logs: AuditLogEntry[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'audit_logs');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: AuditLogEntry[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        // Sort descending by timestamp
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'audit_logs');
      }
    );
  },

  async logAuditEvent(logData: Omit<AuditLogEntry, 'id'>): Promise<string> {
    const id = `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const fullLog: AuditLogEntry = {
      ...logData,
      id,
    };
    try {
      await setDoc(doc(db, 'audit_logs', id), {
        ...fullLog,
        createdAt: new Date().toISOString(),
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `audit_logs/${id}`);
    }
  },

  // Team Members Subscriptions & Governance Updates
  subscribeTeamMembers(callback: (members: TeamMember[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'team_members');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: TeamMember[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        callback(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'team_members');
      }
    );
  },

  async updateTeamMember(memberId: string, updates: Partial<TeamMember>): Promise<void> {
    try {
      await updateDoc(doc(db, 'team_members', memberId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `team_members/${memberId}`);
    }
  },

  async addTeamMember(memberData: TeamMember): Promise<string> {
    try {
      await setDoc(doc(db, 'team_members', memberData.id), {
        ...memberData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return memberData.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `team_members/${memberData.id}`);
    }
  },

  // Budget Revisions Workflow
  subscribeBudgetRevisions(callback: (revisions: BudgetRevision[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'budget_revisions');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: BudgetRevision[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        callback(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'budget_revisions');
      }
    );
  },

  async addBudgetRevision(revData: BudgetRevision): Promise<string> {
    try {
      await setDoc(doc(db, 'budget_revisions', revData.id), {
        ...revData,
        createdAt: new Date().toISOString(),
      });
      return revData.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `budget_revisions/${revData.id}`);
    }
  },

  async approveBudgetRevision(revId: string, approverName: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'budget_revisions', revId), {
        status: 'Disetujui',
        reviewedBy: approverName,
        reviewedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `budget_revisions/${revId}`);
    }
  },

  async rejectBudgetRevision(revId: string, rejectorName: string, rejectionReason: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'budget_revisions', revId), {
        status: 'Ditolak',
        reviewedBy: rejectorName,
        reviewedAt: new Date().toISOString(),
        rejectionReason,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `budget_revisions/${revId}`);
    }
  },

  // Petty Cash Workflow
  subscribePettyCash(callback: (entries: PettyCashEntry[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'petty_cash');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: PettyCashEntry[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        callback(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'petty_cash');
      }
    );
  },

  async addPettyCash(entry: PettyCashEntry): Promise<string> {
    try {
      await setDoc(doc(db, 'petty_cash', entry.id), {
        ...entry,
        createdAt: new Date().toISOString(),
      });
      return entry.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `petty_cash/${entry.id}`);
    }
  },

  async approvePettyCash(id: string, approverName: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'petty_cash', id), {
        status: 'Disetujui',
        reviewedBy: approverName,
        reviewedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `petty_cash/${id}`);
    }
  },

  async rejectPettyCash(id: string, rejectorName: string, reason: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'petty_cash', id), {
        status: 'Ditolak',
        reviewedBy: rejectorName,
        reviewedAt: new Date().toISOString(),
        rejectionReason: reason,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `petty_cash/${id}`);
    }
  },

  async disbursePettyCash(id: string, disburserName: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'petty_cash', id), {
        status: 'Dicairkan',
        disbursedBy: disburserName,
        disbursedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `petty_cash/${id}`);
    }
  },

  // Stock Adjustments Workflow
  subscribeStockAdjustments(callback: (adjustments: StockAdjustment[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'stock_adjustments');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: StockAdjustment[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        callback(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'stock_adjustments');
      }
    );
  },

  async addStockAdjustment(adjData: StockAdjustment): Promise<string> {
    try {
      await setDoc(doc(db, 'stock_adjustments', adjData.id), {
        ...adjData,
        createdAt: new Date().toISOString(),
      });
      return adjData.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `stock_adjustments/${adjData.id}`);
    }
  },

  async approveStockAdjustment(adjId: string, approverName: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'stock_adjustments', adjId), {
        status: 'Disetujui',
        reviewedBy: approverName,
        reviewedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stock_adjustments/${adjId}`);
    }
  },

  async rejectStockAdjustment(adjId: string, rejectorName: string, rejectionReason: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'stock_adjustments', adjId), {
        status: 'Ditolak',
        reviewedBy: rejectorName,
        reviewedAt: new Date().toISOString(),
        rejectionReason,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stock_adjustments/${adjId}`);
    }
  }
};

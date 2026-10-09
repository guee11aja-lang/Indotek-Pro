import React, { useState, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Truck,
  RotateCcw,
  Scale,
  FileCheck2,
  Check,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { MetricCard } from '../common/MetricCard';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { SearchInput } from '../common/SearchInput';
import { Modal } from '../common/Modal';
import { StockAdjustment } from '../../types';
import { formatCurrencyIDR, formatDateIndo } from '../../utils/formatters';

export const MaterialsScreen: React.FC = () => {
  const {
    materials,
    stockMutations,
    addStockMutation,
    stockAdjustments,
    submitStockAdjustment,
    approveStockAdjustment,
    rejectStockAdjustment,
    projects,
    addToast
  } = useApp();

  const { activeRole, hasAuthority, userProfile, currentUser } = useAuth();
  const canApproveAdjustment =
    hasAuthority('stockAdjustment') ||
    activeRole === 'Owner / Director' ||
    activeRole === 'Project Manager';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [activeTab, setActiveTab] = useState<'inventory' | 'mutations' | 'adjustments'>('inventory');

  // Modal State for New Stock Mutation
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [mutationForm, setMutationForm] = useState({
    materialId: materials[0]?.id || '',
    type: 'Keluar' as 'Masuk' | 'Keluar',
    quantity: '100',
    referenceNo: 'SJ-OUT-2026-10-101',
    project: 'Menara Nusantara Office (Lt. 22)',
    handler: 'Yusuf Maulana (Logistik)',
  });

  // Modal State for New Stock Adjustment (Opname Fisik)
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjForm, setAdjForm] = useState({
    materialId: materials[0]?.id || '',
    physicalStock: '',
    reason: 'Kerusakan Fisik di Site' as StockAdjustment['reason'],
    evidenceRef: 'BA-OPNAME-SITE-01.pdf',
    notes: '',
  });

  // Modal State for Rejecting Adjustment
  const [rejectingAdj, setRejectingAdj] = useState<StockAdjustment | null>(null);
  const [adjRejectReason, setAdjRejectReason] = useState('Volume selisih belum diverifikasi oleh tim Quantity Surveyor.');

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.code.toLowerCase().includes(search.toLowerCase()) ||
        m.allocatedProject.toLowerCase().includes(search.toLowerCase()) ||
        m.primarySupplier.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === 'Semua' || m.category === selectedCategory;

      const matchStatus =
        selectedStatus === 'Semua' || m.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [materials, search, selectedCategory, selectedStatus]);

  const totalItems = materials.length;
  const criticalItems = materials.filter((m) => m.status === 'Kritis').length;
  const lowItems = materials.filter((m) => m.status === 'Menipis').length;
  const safeItems = materials.filter((m) => m.status === 'Aman').length;
  const pendingAdjCount = stockAdjustments.filter((a) => a.status === 'Menunggu').length;

  const handleCreateMutation = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMat = materials.find((m) => m.id === mutationForm.materialId);
    if (!targetMat) return;

    addStockMutation({
      materialId: targetMat.id,
      materialName: targetMat.name,
      date: new Date().toISOString().split('T')[0],
      type: mutationForm.type,
      quantity: Number(mutationForm.quantity) || 1,
      unit: targetMat.unit,
      referenceNo: mutationForm.referenceNo,
      project: mutationForm.project,
      handler: mutationForm.handler,
    });

    setIsMutationModalOpen(false);
  };

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMat = materials.find((m) => m.id === adjForm.materialId);
    if (!targetMat) return;

    const phys = Number(adjForm.physicalStock);
    if (isNaN(phys) || phys < 0) {
      addToast({
        type: 'warning',
        message: 'Kuantitas fisik harus berupa angka positif.',
      });
      return;
    }

    const variance = phys - targetMat.currentStock;

    submitStockAdjustment({
      materialId: targetMat.id,
      materialName: targetMat.name,
      materialCode: targetMat.code,
      projectId: projects[0]?.id || 'prj-001',
      projectName: targetMat.allocatedProject,
      previousStock: targetMat.currentStock,
      physicalStock: phys,
      varianceQuantity: variance,
      unit: targetMat.unit,
      reason: adjForm.reason,
      evidenceRef: adjForm.evidenceRef,
      submittedBy: userProfile?.name || currentUser?.displayName || `${activeRole}`,
    });

    setIsAdjModalOpen(false);
    setAdjForm({
      materialId: materials[0]?.id || '',
      physicalStock: '',
      reason: 'Kerusakan Fisik di Site',
      evidenceRef: 'BA-OPNAME-SITE-01.pdf',
      notes: '',
    });
  };

  const handleApproveAdjustment = (adj: StockAdjustment) => {
    if (!canApproveAdjustment) {
      addToast({
        type: 'danger',
        title: 'Wewenang Terbatas',
        message: 'Hanya Manajer Proyek atau Direksi yang berwenang menyetujui koreksi opname stok.',
      });
      return;
    }

    const approver = userProfile?.name || currentUser?.displayName || `${activeRole}`;
    approveStockAdjustment(adj.id, approver);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8E4]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#69766F] mb-1">
            <span>Logistik Lapangan & Pengendalian Persediaan</span>
            <span aria-hidden="true">·</span>
            <span>Inventori Material & Tata Kelola Opname</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202B26]">
            Manajemen Material & Logistik
          </h1>
          <p className="text-xs text-[#69766F] mt-0.5">
            Kontrol stok fisik di gudang proyek, buffer minimum re-order, mutasi surat jalan, dan approval opname
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Scale className="w-4 h-4" />}
            onClick={() => setIsAdjModalOpen(true)}
          >
            Ajukan Opname / Koreksi
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsMutationModalOpen(true)}
          >
            Input Mutasi Material
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Ragam Material"
          value={`${totalItems} Item`}
          subtitle="Tercatat aktif di seluruh site"
          icon={<Boxes className="w-4 h-4 text-[#12352B]" />}
        />
        <MetricCard
          label="Stok Aman / Tersedia"
          value={`${safeItems} Item`}
          subtitle="Memenuhi batas buffer kerja 14 hari"
          trend={{ value: `${Math.round((safeItems / totalItems) * 100)}% Aman`, isPositive: true }}
          icon={<CheckCircle2 className="w-4 h-4 text-[#1C6843]" />}
        />
        <MetricCard
          label="Stok Kritis / Menipis"
          value={`${lowItems + criticalItems} Item`}
          subtitle={`${criticalItems} item di bawah batas darurat`}
          trend={{ value: criticalItems > 0 ? 'Perlu SPP Cepat' : 'Terkontrol', isPositive: criticalItems === 0 }}
          icon={<AlertTriangle className="w-4 h-4 text-[#A82A20]" />}
        />
        <MetricCard
          label="Opname Menunggu Approval"
          value={`${pendingAdjCount} Dokumen`}
          subtitle="Memerlukan tanda tangan Manajer Proyek"
          trend={{ value: `${pendingAdjCount} Tertunda`, isPositive: pendingAdjCount === 0 }}
          icon={<Scale className="w-4 h-4 text-[#9E6B05]" />}
        />
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white p-3 rounded-xl border border-[#E2E8E4] shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented View Switch */}
          <div className="flex items-center p-1 bg-[#EAEFEA] rounded-lg gap-1">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-white text-[#12352B] shadow-2xs font-semibold'
                  : 'text-[#69766F] hover:text-[#202B26]'
              }`}
            >
              Inventori Stok ({materials.length})
            </button>
            <button
              onClick={() => setActiveTab('mutations')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'mutations'
                  ? 'bg-white text-[#12352B] shadow-2xs font-semibold'
                  : 'text-[#69766F] hover:text-[#202B26]'
              }`}
            >
              Log Mutasi Surat Jalan ({stockMutations.length})
            </button>
            <button
              onClick={() => setActiveTab('adjustments')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'adjustments'
                  ? 'bg-white text-[#12352B] shadow-2xs font-semibold'
                  : 'text-[#69766F] hover:text-[#202B26]'
              }`}
            >
              <span>Penyesuaian Opname Fisik</span>
              {pendingAdjCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#A82A20] text-white">
                  {pendingAdjCount}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'inventory' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Cari nama, kode, supplier..."
                className="w-full sm:w-56"
              />

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 bg-white border border-[#E2E8E4] rounded-lg px-3 text-xs font-medium text-[#202B26] hover:border-[#CBD5CF] focus:outline-none focus:border-[#12352B] focus:ring-1 focus:ring-[#12352B] transition-colors cursor-pointer"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Besi & Baja">Besi & Baja</option>
                <option value="Semen & Pasir">Semen & Pasir</option>
                <option value="Beton Readymix">Beton Readymix</option>
                <option value="Arsitektural">Arsitektural</option>
                <option value="MEP & Utilitas">MEP & Utilitas</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 bg-white border border-[#E2E8E4] rounded-lg px-3 text-xs font-medium text-[#202B26] hover:border-[#CBD5CF] focus:outline-none focus:border-[#12352B] focus:ring-1 focus:ring-[#12352B] transition-colors cursor-pointer"
              >
                <option value="Semua">Semua Status</option>
                <option value="Aman">Aman</option>
                <option value="Menipis">Menipis</option>
                <option value="Kritis">Kritis</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-[#E2E8E4] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFBFB] text-[#69766F] border-b border-[#E2E8E4]">
                  <th className="py-3 px-4 font-semibold text-left">Kode Material</th>
                  <th className="py-3 px-4 font-semibold text-left">Nama & Spesifikasi</th>
                  <th className="py-3 px-4 font-semibold text-left">Kategori</th>
                  <th className="py-3 px-4 font-semibold text-right">Stok Saat Ini</th>
                  <th className="py-3 px-4 font-semibold text-right hidden md:table-cell">Buffer Minimum</th>
                  <th className="py-3 px-4 font-semibold text-left hidden lg:table-cell">Lokasi Gudang</th>
                  <th className="py-3 px-4 font-semibold text-left hidden sm:table-cell">Supplier Utama</th>
                  <th className="py-3 px-4 font-semibold text-left">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E4]/70">
                {filteredMaterials.map((mat) => {
                  const statusVariant =
                    mat.status === 'Aman'
                      ? 'success'
                      : mat.status === 'Menipis'
                      ? 'warning'
                      : 'danger';

                  return (
                    <tr key={mat.id} className="hover:bg-[#F5F7F6]/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#12352B]">
                        {mat.code}
                      </td>

                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="font-semibold text-[#202B26] leading-snug">{mat.name}</div>
                        <div className="text-[11px] text-[#69766F] mt-0.5">{mat.specification}</div>
                      </td>

                      <td className="py-3.5 px-4 text-[#69766F] whitespace-nowrap">{mat.category}</td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[#202B26] tabular-nums whitespace-nowrap text-right">
                        {mat.currentStock.toLocaleString('id-ID')} {mat.unit}
                      </td>

                      <td className="py-3.5 px-4 hidden md:table-cell font-mono text-[#69766F] tabular-nums whitespace-nowrap text-right">
                        {mat.minStock.toLocaleString('id-ID')} {mat.unit}
                      </td>

                      <td className="py-3.5 px-4 hidden lg:table-cell text-[#4F5D56] max-w-[160px] truncate">
                        {mat.warehouseLocation}
                      </td>

                      <td className="py-3.5 px-4 hidden sm:table-cell text-[#69766F] max-w-[160px] truncate">
                        {mat.primarySupplier}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={statusVariant} size="sm" dot>
                          {mat.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => {
                            setMutationForm({
                              ...mutationForm,
                              materialId: mat.id,
                              project: mat.allocatedProject,
                            });
                            setIsMutationModalOpen(true);
                          }}
                        >
                          Mutasi
                        </Button>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => {
                            setAdjForm({
                              ...adjForm,
                              materialId: mat.id,
                              physicalStock: mat.currentStock.toString(),
                            });
                            setIsAdjModalOpen(true);
                          }}
                        >
                          Opname
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Mutations Log */}
      {activeTab === 'mutations' && (
        <div className="bg-white rounded-xl border border-[#E2E8E4] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFBFB] text-[#69766F] border-b border-[#E2E8E4]">
                  <th className="py-3 px-4 font-semibold text-left">No. Surat Jalan</th>
                  <th className="py-3 px-4 font-semibold text-left">Tanggal</th>
                  <th className="py-3 px-4 font-semibold text-left">Tipe Mutasi</th>
                  <th className="py-3 px-4 font-semibold text-left">Nama Material</th>
                  <th className="py-3 px-4 font-semibold text-right">Jumlah</th>
                  <th className="py-3 px-4 font-semibold text-left">Alokasi / Tujuan Proyek</th>
                  <th className="py-3 px-4 font-semibold text-left">Petugas Lapangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E4]/70">
                {stockMutations.map((mut) => (
                  <tr key={mut.id} className="hover:bg-[#F5F7F6]/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#12352B]">
                      {mut.referenceNo}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-[#69766F] whitespace-nowrap">
                      {formatDateIndo(mut.date)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant={mut.type === 'Masuk' ? 'success' : 'neutral'} size="sm">
                        {mut.type === 'Masuk' ? 'Barang Masuk (IN)' : 'Pengeluaran (OUT)'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#202B26]">
                      {mut.materialName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold tabular-nums text-[#202B26] whitespace-nowrap text-right">
                      {mut.quantity.toLocaleString('id-ID')} {mut.unit}
                    </td>
                    <td className="py-3.5 px-4 text-[#4F5D56]">{mut.project}</td>
                    <td className="py-3.5 px-4 text-[#69766F]">{mut.handler}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Stock Adjustments (Opname Fisik) Workflow */}
      {activeTab === 'adjustments' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E4] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#E2E8E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#202B26]">
                  Daftar Pengajuan Penyesuaian Stok & Opname Fisik
                </h2>
                <p className="text-xs text-[#69766F] mt-0.5">
                  Setiap penyesuaian selisih stok gudang site memerlukan Berita Acara dan persetujuan Manajer Proyek
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsAdjModalOpen(true)}
              >
                Buat Pengajuan Opname
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFB] text-[#69766F] border-b border-[#E2E8E4]">
                    <th className="py-3 px-4 font-semibold">No. Dokumen Opname</th>
                    <th className="py-3 px-4 font-semibold">Material & Proyek</th>
                    <th className="py-3 px-4 font-semibold text-right">Stok Sistem</th>
                    <th className="py-3 px-4 font-semibold text-right">Fisik Opname</th>
                    <th className="py-3 px-4 font-semibold text-right">Selisih (+/-)</th>
                    <th className="py-3 px-4 font-semibold">Alasan & Bukti Berita Acara</th>
                    <th className="py-3 px-4 font-semibold">Pengaju & Tanggal</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi Persetujuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E4]/70">
                  {stockAdjustments.map((adj) => {
                    const isPending = adj.status === 'Menunggu';
                    const isApproved = adj.status === 'Disetujui';
                    const isRejected = adj.status === 'Ditolak';

                    return (
                      <tr key={adj.id} className="hover:bg-[#F5F7F6]/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#12352B] whitespace-nowrap">
                          {adj.adjustmentNo}
                        </td>

                        <td className="py-3.5 px-4 min-w-[200px]">
                          <div className="font-semibold text-[#202B26]">{adj.materialName}</div>
                          <div className="text-[11px] text-[#69766F]">{adj.projectName}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-right tabular-nums text-[#69766F]">
                          {adj.previousStock.toLocaleString('id-ID')} {adj.unit}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-right tabular-nums text-[#202B26]">
                          {adj.physicalStock.toLocaleString('id-ID')} {adj.unit}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-right tabular-nums">
                          <span
                            className={
                              adj.varianceQuantity < 0
                                ? 'text-[#A82A20]'
                                : adj.varianceQuantity > 0
                                ? 'text-[#1C6843]'
                                : 'text-[#69766F]'
                            }
                          >
                            {adj.varianceQuantity > 0 ? '+' : ''}
                            {adj.varianceQuantity.toLocaleString('id-ID')} {adj.unit}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 min-w-[180px]">
                          <div className="font-medium text-[#202B26]">{adj.reason}</div>
                          <div className="text-[11px] text-[#285744] font-mono mt-0.5">
                            BA: {adj.evidenceRef}
                          </div>
                          {adj.rejectionReason && (
                            <div className="text-[11px] text-[#A82A20] mt-1 bg-[#FCE8E6] p-1.5 rounded">
                              Alasan tolak: {adj.rejectionReason}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[#69766F] whitespace-nowrap">
                          <div>{adj.submittedBy}</div>
                          <div className="text-[11px] font-mono">
                            {formatDateIndo(adj.submittedAt.split('T')[0])}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge
                            variant={isApproved ? 'success' : isRejected ? 'danger' : 'warning'}
                            size="sm"
                            dot
                          >
                            {adj.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isPending ? (
                            canApproveAdjustment ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="primary"
                                  size="xs"
                                  leftIcon={<Check className="w-3 h-3" />}
                                  onClick={() => handleApproveAdjustment(adj)}
                                >
                                  Setujui
                                </Button>
                                <Button
                                  variant="danger"
                                  size="xs"
                                  leftIcon={<XCircle className="w-3 h-3" />}
                                  onClick={() => setRejectingAdj(adj)}
                                >
                                  Tolak
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#9E6B05] font-medium bg-[#FFF8EC] px-2 py-1 rounded border border-[#FCE6B1]">
                                Perlu Paraf PM
                              </span>
                            )
                          ) : (
                            <div className="text-[11px] text-[#69766F]">
                              <span className="font-medium text-[#202B26]">{adj.reviewedBy}</span>
                              <div className="font-mono text-[10px]">
                                {adj.reviewedAt ? formatDateIndo(adj.reviewedAt.split('T')[0]) : '-'}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Input Mutasi Material */}
      <Modal
        isOpen={isMutationModalOpen}
        onClose={() => setIsMutationModalOpen(false)}
        title="Catat Mutasi Material (Surat Jalan)"
        description="Perbarui stok fisik gudang melalui pencatatan barang datang dari supplier atau pengeluaran ke mandor lapangan."
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsMutationModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateMutation}>
              Simpan Mutasi Stok
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateMutation} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B26] mb-1">Pilih Material</label>
            <select
              value={mutationForm.materialId}
              onChange={(e) => setMutationForm({ ...mutationForm, materialId: e.target.value })}
              className="w-full p-2 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} — {m.name} (Stok: {m.currentStock} {m.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B26] mb-1">Jenis Mutasi</label>
              <select
                value={mutationForm.type}
                onChange={(e) =>
                  setMutationForm({ ...mutationForm, type: e.target.value as 'Masuk' | 'Keluar' })
                }
                className="w-full p-2 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
              >
                <option value="Keluar">Barang Keluar (Dipakai Kerja)</option>
                <option value="Masuk">Barang Masuk (Penerimaan PO)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B26] mb-1">Jumlah Kuantitas</label>
              <input
                type="number"
                value={mutationForm.quantity}
                onChange={(e) => setMutationForm({ ...mutationForm, quantity: e.target.value })}
                className="w-full p-2 bg-white border border-[#E2E8E4] rounded-lg font-mono text-[#202B26]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B26] mb-1">No. Surat Jalan / Referensi</label>
            <input
              type="text"
              value={mutationForm.referenceNo}
              onChange={(e) => setMutationForm({ ...mutationForm, referenceNo: e.target.value })}
              className="w-full p-2 bg-white border border-[#E2E8E4] rounded-lg font-mono text-[#202B26]"
            />
          </div>

          <div>
            <label className="block font-medium text-[#202B26] mb-1">Proyek / Zona Alokasi</label>
            <input
              type="text"
              value={mutationForm.project}
              onChange={(e) => setMutationForm({ ...mutationForm, project: e.target.value })}
              className="w-full p-2 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
            />
          </div>

          <div>
            <label className="block font-medium text-[#202B26] mb-1">Petugas / Mandor Penerima</label>
            <input
              type="text"
              value={mutationForm.handler}
              onChange={(e) => setMutationForm({ ...mutationForm, handler: e.target.value })}
              className="w-full p-2 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Ajukan Opname Fisik / Penyesuaian Stok */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjModalOpen(false)}
        title="Pengajuan Koreksi Stok / Opname Fisik"
        description="Catat rekonsiliasi antara stok sistem dengan fisik riil gudang lapangan. Memerlukan audit dan approval resmi."
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAdjModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateAdjustment}>
              Kirim untuk Persetujuan
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateAdjustment} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-[#202B26] mb-1">Pilih Material Target</label>
            <select
              value={adjForm.materialId}
              onChange={(e) => setAdjForm({ ...adjForm, materialId: e.target.value })}
              className="w-full p-2 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} — {m.name} (Stok Saat Ini: {m.currentStock} {m.unit})
                </option>
              ))}
            </select>
          </div>

          {(() => {
            const currentMat = materials.find((m) => m.id === adjForm.materialId) || materials[0];
            const phys = Number(adjForm.physicalStock) || 0;
            const variance = phys - (currentMat?.currentStock || 0);

            return (
              <div className="p-3 bg-[#FAFBFB] rounded-lg border border-[#E2E8E4] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#69766F]">Stok Menurut Sistem:</span>
                  <span className="font-mono font-bold text-[#202B26]">
                    {currentMat?.currentStock.toLocaleString('id-ID')} {currentMat?.unit}
                  </span>
                </div>
                {adjForm.physicalStock !== '' && (
                  <div className="flex justify-between">
                    <span className="text-[#69766F]">Estimasi Selisih (Deviasi):</span>
                    <span
                      className={`font-mono font-bold ${
                        variance < 0 ? 'text-[#A82A20]' : variance > 0 ? 'text-[#1C6843]' : 'text-[#69766F]'
                      }`}
                    >
                      {variance > 0 ? '+' : ''}
                      {variance.toLocaleString('id-ID')} {currentMat?.unit}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          <div>
            <label className="block font-medium text-[#202B26] mb-1">
              Hasil Hitungan Fisik Riil di Site <span className="text-[#A82A20]">*</span>
            </label>
            <input
              type="number"
              required
              value={adjForm.physicalStock}
              onChange={(e) => setAdjForm({ ...adjForm, physicalStock: e.target.value })}
              placeholder="Contoh: 4180"
              className="w-full p-2 bg-white border border-[#E2E8E4] rounded-lg font-mono text-[#202B26]"
            />
          </div>

          <div>
            <label className="block font-medium text-[#202B26] mb-1">
              Alasan Utama Ketidaksesuaian <span className="text-[#A82A20]">*</span>
            </label>
            <select
              value={adjForm.reason}
              onChange={(e) =>
                setAdjForm({ ...adjForm, reason: e.target.value as StockAdjustment['reason'] })
              }
              className="w-full p-2 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
            >
              <option value="Kerusakan Fisik di Site">Kerusakan Fisik di Site (Karat/Patah/Basah)</option>
              <option value="Susut / Faktor Cuaca">Susut / Faktor Cuaca (Penguapan/Curah Hujan)</option>
              <option value="Selisih Bongkar Muat">Selisih Bongkar Muat dari Supplier</option>
              <option value="Retur Pekerjaan Subkon">Retur Pekerjaan Subkon Lapangan</option>
              <option value="Koreksi Opname Fisik">Koreksi Opname Fisik Akhir Bulan</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-[#202B26] mb-1">
              Nomor Berita Acara (BA) Pembuktian <span className="text-[#A82A20]">*</span>
            </label>
            <input
              type="text"
              required
              value={adjForm.evidenceRef}
              onChange={(e) => setAdjForm({ ...adjForm, evidenceRef: e.target.value })}
              placeholder="BA-OPNAME-SITE-01.pdf"
              className="w-full p-2 bg-white border border-[#E2E8E4] rounded-lg font-mono text-[#202B26]"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Tolak Pengajuan Opname */}
      {rejectingAdj && (
        <Modal
          isOpen={true}
          onClose={() => setRejectingAdj(null)}
          title={`Tolak Pengajuan Koreksi ${rejectingAdj.adjustmentNo}`}
          description={`Pengajuan dari ${rejectingAdj.submittedBy} untuk ${rejectingAdj.materialName}.`}
          maxWidth="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setRejectingAdj(null)}>
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (!adjRejectReason.trim()) {
                    addToast({
                      type: 'warning',
                      message: 'Alasan penolakan wajib diisi untuk catatan jejak audit.',
                    });
                    return;
                  }
                  const rejector = userProfile?.name || currentUser?.displayName || `${activeRole}`;
                  rejectStockAdjustment(rejectingAdj.id, rejector, adjRejectReason.trim());
                  setRejectingAdj(null);
                }}
              >
                Konfirmasi Penolakan
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#FAFBFB] rounded-lg border border-[#E2E8E4] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#69766F]">Dokumen Opname:</span>
                <span className="font-mono font-bold text-[#202B26]">{rejectingAdj.adjustmentNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#69766F]">Material:</span>
                <span className="font-semibold text-[#202B26]">{rejectingAdj.materialName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#69766F]">Selisih Kuantitas:</span>
                <span className="font-mono font-bold text-[#A82A20]">
                  {rejectingAdj.varianceQuantity} {rejectingAdj.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#202B26] mb-1">
                Alasan Penolakan Resmi (Wajib Audit) <span className="text-[#A82A20]">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={adjRejectReason}
                onChange={(e) => setAdjRejectReason(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

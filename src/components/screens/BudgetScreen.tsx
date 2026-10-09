import React, { useState, useMemo } from 'react';
import {
  Coins,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Download,
  Building,
  ArrowRight,
  Plus,
  FileText,
  Receipt,
  Check,
  XCircle,
  Clock,
  Shield,
  ShieldAlert,
  Wallet,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { MetricCard } from '../common/MetricCard';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { Button } from '../common/Button';
import { SearchInput } from '../common/SearchInput';
import { Modal } from '../common/Modal';
import { INITIAL_BUDGET_LINES } from '../../data/mockData';
import { BudgetRevision, PettyCashEntry, PettyCashCategory } from '../../types';
import {
  formatCurrencyIDR,
  formatCompactIDR,
  formatPercent,
  formatDateIndo
} from '../../utils/formatters';

export const BudgetScreen: React.FC = () => {
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    budgetRevisions,
    submitBudgetRevision,
    approveBudgetRevision,
    rejectBudgetRevision,
    pettyCash,
    submitPettyCash,
    approvePettyCash,
    rejectPettyCash,
    disbursePettyCash,
    addToast
  } = useApp();

  const { activeRole, hasAuthority, canAccessProject, userProfile, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'rab' | 'revisions' | 'petty_cash'>('rab');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Modals for Budget Revisions
  const [isNewRevModalOpen, setIsNewRevModalOpen] = useState(false);
  const [revForm, setRevForm] = useState({
    title: '',
    divisionName: 'Pekerjaan Struktur',
    proposedAmount: '',
    originalAmount: '',
    justification: '',
  });
  const [rejectingRev, setRejectingRev] = useState<BudgetRevision | null>(null);
  const [revRejectReason, setRevRejectReason] = useState('');

  // Modals for Petty Cash
  const [isNewPettyModalOpen, setIsNewPettyModalOpen] = useState(false);
  const [pettyForm, setPettyForm] = useState({
    amount: '',
    category: 'Konsumsi & Lembur' as PettyCashCategory,
    purpose: '',
    receiptProof: 'NOTA-SITE-OFFICIAL.pdf',
  });
  const [rejectingPetty, setRejectingPetty] = useState<PettyCashEntry | null>(null);
  const [pettyRejectReason, setPettyRejectReason] = useState('');

  const currentProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0];

  const hasAccessToProject = canAccessProject(currentProject.id);

  const budgetLines = INITIAL_BUDGET_LINES.filter(
    (b) => b.projectId === currentProject.id
  );

  const projectRevisions = budgetRevisions.filter(
    (r) => r.projectId === currentProject.id
  );

  const projectPettyCash = pettyCash.filter(
    (p) => p.projectId === currentProject.id
  );

  const filteredLines = useMemo(() => {
    return budgetLines.filter((item) => {
      const matchSearch =
        item.divisionName.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === 'Semua' || item.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [budgetLines, search, selectedCategory]);

  const totalPlanned = budgetLines.reduce((acc, b) => acc + b.plannedAmount, 0);
  const totalActual = budgetLines.reduce((acc, b) => acc + b.actualAmount, 0);
  const totalVariance = totalPlanned - totalActual;
  const utilization = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
  const cpi = totalActual > 0 ? (totalPlanned * (currentProject.progressActual / 100)) / totalActual : 1;

  const handleExportRAB = () => {
    addToast({
      type: 'info',
      title: 'Mengekspor Laporan RAB',
      message: `File RAB_${currentProject.code}.xlsx berhasil diunduh. (Simulasi Demo)`,
    });
  };

  const handleCreateRevision = (e: React.FormEvent) => {
    e.preventDefault();
    const orig = Number(revForm.originalAmount) || 100000000;
    const prop = Number(revForm.proposedAmount) || 120000000;
    const diff = prop - orig;

    submitBudgetRevision({
      projectId: currentProject.id,
      projectName: currentProject.name,
      title: revForm.title,
      divisionName: revForm.divisionName,
      originalAmount: orig,
      proposedAmount: prop,
      varianceAmount: diff,
      justification: revForm.justification,
      submittedBy: userProfile?.name || currentUser?.displayName || `${activeRole}`,
    });

    setIsNewRevModalOpen(false);
    setRevForm({
      title: '',
      divisionName: 'Pekerjaan Struktur',
      proposedAmount: '',
      originalAmount: '',
      justification: '',
    });
  };

  const handleCreatePettyCash = (e: React.FormEvent) => {
    e.preventDefault();
    submitPettyCash({
      projectId: currentProject.id,
      projectName: currentProject.name,
      requester: userProfile?.name || currentUser?.displayName || `${activeRole}`,
      amount: Number(pettyForm.amount) || 500000,
      category: pettyForm.category,
      purpose: pettyForm.purpose,
      receiptProof: pettyForm.receiptProof,
    });

    setIsNewPettyModalOpen(false);
    setPettyForm({
      amount: '',
      category: 'Konsumsi & Lembur',
      purpose: '',
      receiptProof: 'NOTA-SITE-OFFICIAL.pdf',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8E4]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#69766F] mb-1">
            <span>Tata Kelola Keuangan</span>
            <span aria-hidden="true">·</span>
            <span>RAB, Addendum Anggaran & Kas Kecil</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202B26]">
            Pengendalian Anggaran & Kas Proyek
          </h1>
          <p className="text-xs text-[#69766F] mt-0.5">
            Monitoring serapan dana BOQ, pengajuan addendum pagu RAB, dan otorisasi pencairan kas kecil site
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Project Selector */}
          <select
            value={currentProject.id}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="h-9 bg-white border border-[#E2E8E4] rounded-lg px-3 text-xs font-semibold text-[#202B26] hover:border-[#CBD5CF] focus:outline-none focus:border-[#12352B] focus:ring-1 focus:ring-[#12352B] transition-colors cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportRAB}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Ekspor Excel
          </Button>
        </div>
      </div>

      {/* Project Restriction Warning */}
      {!hasAccessToProject && (
        <div className="bg-[#FEF6E7] border border-[#FAD899] rounded-xl p-4 flex items-start gap-3 text-xs text-[#9E6B05]">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Akses Proyek Dibatasi untuk Peran Anda:</span>
            <p className="mt-0.5 text-[#202B26]/80 leading-relaxed">
              Anda sedang melihat data proyek di luar daftar penugasan aktif peran Anda (<span className="font-mono font-semibold">{activeRole}</span>). Tindakan pengajuan dan otorisasi perubahan anggaran dinonaktifkan.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8E4] pb-px">
        <button
          onClick={() => setActiveTab('rab')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'rab'
              ? 'border-[#12352B] text-[#12352B] bg-white'
              : 'border-transparent text-[#69766F] hover:text-[#202B26]'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>RAB & Evaluasi Nilai Hasil</span>
        </button>

        <button
          onClick={() => setActiveTab('revisions')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'revisions'
              ? 'border-[#12352B] text-[#12352B] bg-white'
              : 'border-transparent text-[#69766F] hover:text-[#202B26]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Addendum Revisi RAB</span>
          {projectRevisions.filter((r) => r.status === 'Menunggu').length > 0 && (
            <span className="px-1.5 py-0.2 bg-[#A82A20] text-white rounded-full text-[10px] font-mono">
              {projectRevisions.filter((r) => r.status === 'Menunggu').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('petty_cash')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'petty_cash'
              ? 'border-[#12352B] text-[#12352B] bg-white'
              : 'border-transparent text-[#69766F] hover:text-[#202B26]'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Kas Kecil Lapangan (Petty Cash)</span>
          {projectPettyCash.filter((p) => p.status === 'Menunggu').length > 0 && (
            <span className="px-1.5 py-0.2 bg-[#9E6B05] text-white rounded-full text-[10px] font-mono">
              {projectPettyCash.filter((p) => p.status === 'Menunggu').length}
            </span>
          )}
        </button>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Nilai Kontrak Proyek"
          value={formatCompactIDR(currentProject.contractValue)}
          subtitle="Nilai kontrak induk resmi (exclude PPN)"
          icon={<Coins className="w-4 h-4 text-[#12352B]" />}
        />

        <MetricCard
          label="Pagu Anggaran RAB"
          value={formatCompactIDR(currentProject.approvedBudget)}
          subtitle={`Target Margin Kotor: ${formatPercent(((currentProject.contractValue - currentProject.approvedBudget) / currentProject.contractValue) * 100)}`}
          icon={<Coins className="w-4 h-4 text-[#285744]" />}
        />

        <MetricCard
          label="Realisasi Biaya Terpakai"
          value={formatCompactIDR(currentProject.actualCost)}
          subtitle={`${formatPercent((currentProject.actualCost / currentProject.approvedBudget) * 100)} dari total pagu RAB`}
          trend={{ value: 'Efisien', isPositive: true, label: `CPI ${cpi.toFixed(2)}` }}
          icon={<TrendingUp className="w-4 h-4 text-[#1C6843]" />}
        />

        <MetricCard
          label="Sisa Pagu Anggaran"
          value={formatCompactIDR(currentProject.approvedBudget - currentProject.actualCost)}
          subtitle="Tersedia untuk penyelesaian sisa WBS"
          trend={{
            value: formatPercent(100 - (currentProject.actualCost / currentProject.approvedBudget) * 100),
            isPositive: true,
            label: 'saldo pagu',
          }}
          icon={<CheckCircle2 className="w-4 h-4 text-[#1C6843]" />}
        />
      </div>

      {/* TAB 1: RAB & BOQ LINES */}
      {activeTab === 'rab' && (
        <div className="space-y-6">
          {/* Visual Category Breakdown Cards */}
          <div className="bg-white rounded-xl border border-[#E2E8E4] shadow-2xs p-5">
            <h2 className="text-sm font-bold text-[#202B26] mb-1">
              Distribusi Serapan Biaya per Divisi Pekerjaan
            </h2>
            <p className="text-xs text-[#69766F] mb-4">
              Perbandingan pagu anggaran (RAB) vs pengeluaran riil subkontraktor dan logistik
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Pekerjaan Struktur',
                  planned: 50500000000,
                  actual: 41640000000,
                  status: 'Normal',
                },
                {
                  title: 'Pekerjaan Arsitektur',
                  planned: 8400000000,
                  actual: 3780000000,
                  status: 'Normal',
                },
                {
                  title: 'Pekerjaan MEP',
                  planned: 12700000000,
                  actual: 6014000000,
                  status: 'Normal',
                },
                {
                  title: 'Persiapan & Overhead',
                  planned: 4600000000,
                  actual: 4100000000,
                  status: 'Peringatan (89% terpakai)',
                },
              ].map((cat, idx) => {
                const pct = (cat.actual / cat.planned) * 100;
                return (
                  <div key={idx} className="p-3.5 rounded-lg border border-[#E2E8E4] bg-[#FAFBFB]">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-xs text-[#202B26]">{cat.title}</span>
                      <span className="text-[11px] font-mono font-bold text-[#202B26] tabular-nums">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <ProgressBar value={pct} size="sm" variant={pct > 85 ? 'warning' : 'primary'} />
                    <div className="flex justify-between items-center text-[11px] text-[#69766F] mt-2 font-mono tabular-nums">
                      <span>Real: {formatCompactIDR(cat.actual)}</span>
                      <span>RAB: {formatCompactIDR(cat.planned)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOQ / RAB Line Item Detail Table */}
          <div className="bg-white rounded-xl border border-[#E2E8E4] shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E2E8E4] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#202B26]">Rincian Item Pekerjaan RAB / BOQ</h2>
                <p className="text-xs text-[#69766F] mt-0.5">
                  Varians positif menandakan penghematan biaya; varians negatif menandakan potensi overbudget
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Cari uraian atau divisi..."
                  className="w-full sm:w-56"
                />

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-9 bg-white border border-[#E2E8E4] rounded-lg px-3 text-xs font-medium text-[#202B26] hover:border-[#CBD5CF] focus:outline-none focus:border-[#12352B] focus:ring-1 focus:ring-[#12352B] transition-colors cursor-pointer"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="Pekerjaan Persiapan">Pekerjaan Persiapan</option>
                  <option value="Pekerjaan Struktur">Pekerjaan Struktur</option>
                  <option value="Pekerjaan Arsitektur">Pekerjaan Arsitektur</option>
                  <option value="Pekerjaan MEP">Pekerjaan MEP</option>
                  <option value="Manajemen & Overhead">Manajemen & Overhead</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFB] text-[#69766F] border-b border-[#E2E8E4]">
                    <th className="py-3 px-4 font-semibold text-left">Kode</th>
                    <th className="py-3 px-4 font-semibold text-left">Uraian Divisi & Volume</th>
                    <th className="py-3 px-4 font-semibold text-left">Kategori</th>
                    <th className="py-3 px-4 font-semibold text-right">Pagu RAB (IDR)</th>
                    <th className="py-3 px-4 font-semibold text-right">Realisasi (IDR)</th>
                    <th className="py-3 px-4 font-semibold text-right">Sisa Pagu (IDR)</th>
                    <th className="py-3 px-4 font-semibold text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E4]/70">
                  {filteredLines.map((line) => {
                    const isWarning = line.status === 'Peringatan';
                    return (
                      <tr key={line.id} className="hover:bg-[#F5F7F6]/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#12352B]">
                          {line.code}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#202B26] leading-snug">
                            {line.divisionName}
                          </div>
                          <div className="text-[11px] text-[#69766F] font-mono mt-0.5 tabular-nums">
                            Volume: {line.volume.toLocaleString('id-ID')} {line.unit} · Harga Satuan: {formatCurrencyIDR(line.unitRate)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-[#69766F] whitespace-nowrap">
                          {line.category}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-[#202B26] tabular-nums whitespace-nowrap text-right">
                          {formatCurrencyIDR(line.plannedAmount)}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-[#202B26] tabular-nums whitespace-nowrap text-right">
                          {formatCurrencyIDR(line.actualAmount)}
                        </td>

                        <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap text-[#1C6843] text-right">
                          {formatCurrencyIDR(line.varianceAmount)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge variant={isWarning ? 'warning' : 'success'} size="sm">
                            {line.status}
                          </Badge>
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

      {/* TAB 2: BUDGET REVISIONS WORKFLOW */}
      {activeTab === 'revisions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-[#E2E8E4] shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-[#202B26]">Addendum & Revisi Pagu RAB</h2>
              <p className="text-xs text-[#69766F] mt-0.5">
                Alur persetujuan perubahan anggaran berjenjang dengan justifikasi rekayasa nilai dan tanda tangan digital
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                if (!hasAccessToProject) {
                  addToast({
                    type: 'danger',
                    message: 'Anda tidak memiliki penugasan pada proyek ini.',
                  });
                  return;
                }
                setIsNewRevModalOpen(true);
              }}
            >
              Ajukan Revisi Anggaran
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8E4] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFB] text-[#69766F] border-b border-[#E2E8E4]">
                    <th className="py-3 px-4 font-semibold">Nomor Addendum</th>
                    <th className="py-3 px-4 font-semibold">Uraian & Divisi</th>
                    <th className="py-3 px-4 font-semibold text-right">Pagu Semula</th>
                    <th className="py-3 px-4 font-semibold text-right">Usulan Baru</th>
                    <th className="py-3 px-4 font-semibold text-right">Selisih Deviasi</th>
                    <th className="py-3 px-4 font-semibold">Pemohon & Tanggal</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Tindakan Otoritas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E4]/70">
                  {projectRevisions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-xs text-[#69766F]">
                        Belum ada pengajuan addendum anggaran untuk proyek ini.
                      </td>
                    </tr>
                  ) : (
                    projectRevisions.map((rev) => (
                      <tr key={rev.id} className="hover:bg-[#F5F7F6]/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#12352B]">
                          {rev.revisionNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#202B26]">{rev.title}</div>
                          <div className="text-[11px] text-[#69766F] mt-0.5">{rev.divisionName}</div>
                          {rev.justification && (
                            <div className="text-[11px] text-[#4F5D56] italic mt-1 bg-[#FAFBFB] p-1.5 rounded border border-[#E2E8E4]">
                              "{rev.justification}"
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-right text-[#69766F]">
                          {formatCurrencyIDR(rev.originalAmount)}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-right font-semibold text-[#202B26]">
                          {formatCurrencyIDR(rev.proposedAmount)}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-right font-bold text-[#9E6B05]">
                          +{formatCurrencyIDR(rev.varianceAmount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#202B26]">{rev.submittedBy}</div>
                          <div className="text-[10px] text-[#69766F] font-mono">{formatDateIndo(rev.submittedAt)}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge
                            variant={
                              rev.status === 'Disetujui'
                                ? 'success'
                                : rev.status === 'Menunggu'
                                ? 'warning'
                                : 'danger'
                            }
                            size="sm"
                            dot
                          >
                            {rev.status}
                          </Badge>
                          {rev.rejectionReason && (
                            <div className="text-[10px] text-[#A82A20] mt-1 max-w-[130px] truncate" title={rev.rejectionReason}>
                              Alasan: {rev.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {rev.status === 'Menunggu' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="primary"
                                size="xs"
                                leftIcon={<Check className="w-3.5 h-3.5" />}
                                onClick={() => {
                                  if (!hasAuthority('budgetRevision')) {
                                    addToast({
                                      type: 'danger',
                                      title: 'Otoritas Tidak Memadai',
                                      message: `Peran "${activeRole}" tidak berwenang menyetujui revisi RAB. Diperlukan peran Owner / Director atau Finance / Accounting.`,
                                    });
                                    return;
                                  }
                                  const approver = userProfile?.name || currentUser?.displayName || `${activeRole}`;
                                  approveBudgetRevision(rev.id, approver);
                                }}
                              >
                                Setujui
                              </Button>
                              <Button
                                variant="danger"
                                size="xs"
                                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                                onClick={() => {
                                  if (!hasAuthority('budgetRevision')) {
                                    addToast({
                                      type: 'danger',
                                      title: 'Otoritas Tidak Memadai',
                                      message: `Peran "${activeRole}" tidak berwenang menolak revisi RAB resmi.`,
                                    });
                                    return;
                                  }
                                  setRejectingRev(rev);
                                }}
                              >
                                Tolak
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#69766F] font-mono">
                              {rev.reviewedBy ? `${rev.status} (${rev.reviewedBy.split(' ')[0]})` : rev.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PETTY CASH WORKFLOW */}
      {activeTab === 'petty_cash' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-[#E2E8E4] shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-[#202B26]">Buku Kas Kecil Site Lapangan (Petty Cash)</h2>
              <p className="text-xs text-[#69766F] mt-0.5">
                Pengajuan belanja operasional tak terduga site, konsumsi lembur, BBM darurat, dan obat P3K
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                if (!hasAccessToProject) {
                  addToast({
                    type: 'danger',
                    message: 'Anda tidak memiliki penugasan pada proyek ini.',
                  });
                  return;
                }
                setIsNewPettyModalOpen(true);
              }}
            >
              Ajukan Kas Kecil
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8E4] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFB] text-[#69766F] border-b border-[#E2E8E4]">
                    <th className="py-3 px-4 font-semibold">Nomor Kas</th>
                    <th className="py-3 px-4 font-semibold">Kategori & Uraian</th>
                    <th className="py-3 px-4 font-semibold text-right">Nominal (IDR)</th>
                    <th className="py-3 px-4 font-semibold">Bukti Nota</th>
                    <th className="py-3 px-4 font-semibold">Pemohon</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Tindakan Otoritas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E4]/70">
                  {projectPettyCash.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-[#69766F]">
                        Belum ada mutasi kas kecil untuk proyek ini.
                      </td>
                    </tr>
                  ) : (
                    projectPettyCash.map((pc) => (
                      <tr key={pc.id} className="hover:bg-[#F5F7F6]/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#12352B]">
                          {pc.pettyCashNo}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#202B26]">{pc.purpose}</div>
                          <div className="text-[11px] text-[#69766F] mt-0.5">{pc.category}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-right font-bold text-[#202B26]">
                          {formatCurrencyIDR(pc.amount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#285744] hover:underline cursor-pointer">
                            <Receipt className="w-3.5 h-3.5" />
                            {pc.receiptProof}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#202B26]">{pc.requester}</div>
                          <div className="text-[10px] text-[#69766F] font-mono">{formatDateIndo(pc.submittedAt)}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge
                            variant={
                              pc.status === 'Dicairkan' || pc.status === 'Disetujui'
                                ? 'success'
                                : pc.status === 'Menunggu'
                                ? 'warning'
                                : 'danger'
                            }
                            size="sm"
                            dot
                          >
                            {pc.status}
                          </Badge>
                          {pc.rejectionReason && (
                            <div className="text-[10px] text-[#A82A20] mt-1 max-w-[130px] truncate" title={pc.rejectionReason}>
                              Alasan: {pc.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {pc.status === 'Menunggu' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="primary"
                                size="xs"
                                leftIcon={<Check className="w-3.5 h-3.5" />}
                                onClick={() => {
                                  if (!hasAuthority('pettyCash')) {
                                    addToast({
                                      type: 'danger',
                                      title: 'Otoritas Tidak Memadai',
                                      message: `Peran "${activeRole}" tidak berwenang menyetujui kas kecil. Otoritas ini memerlukan peran Finance / Accounting atau Owner / Director.`,
                                    });
                                    return;
                                  }
                                  const approver = userProfile?.name || currentUser?.displayName || `${activeRole}`;
                                  approvePettyCash(pc.id, approver);
                                }}
                              >
                                Setujui
                              </Button>
                              <Button
                                variant="danger"
                                size="xs"
                                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                                onClick={() => {
                                  if (!hasAuthority('pettyCash')) {
                                    addToast({
                                      type: 'danger',
                                      title: 'Otoritas Tidak Memadai',
                                      message: `Peran "${activeRole}" tidak berwenang menolak kas kecil.`,
                                    });
                                    return;
                                  }
                                  setRejectingPetty(pc);
                                }}
                              >
                                Tolak
                              </Button>
                            </div>
                          ) : pc.status === 'Disetujui' ? (
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => {
                                if (activeRole !== 'Finance / Accounting' && activeRole !== 'Owner / Director') {
                                  addToast({
                                    type: 'danger',
                                    message: 'Pencairan kas kecil hanya dapat dilakukan oleh Keuangan / Direksi.',
                                  });
                                  return;
                                }
                                const disburser = userProfile?.name || currentUser?.displayName || 'Finance Team';
                                disbursePettyCash(pc.id, disburser);
                              }}
                            >
                              Cairkan Dana
                            </Button>
                          ) : (
                            <span className="text-[11px] text-[#69766F] font-mono">
                              {pc.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW BUDGET REVISION */}
      <Modal
        isOpen={isNewRevModalOpen}
        onClose={() => setIsNewRevModalOpen(false)}
        title="Ajukan Addendum Revisi Anggaran (RAB)"
        description={`Pengajuan perubahan nilai kontrak pagu proyek: ${currentProject.name}`}
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsNewRevModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateRevision}>
              Kirim untuk Verifikasi Direksi
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRevision} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B26] mb-1">Judul / Perihal Revisi Anggaran</label>
            <input
              type="text"
              required
              value={revForm.title}
              onChange={(e) => setRevForm({ ...revForm, title: e.target.value })}
              placeholder="Contoh: Penyesuaian Mutu Beton Fc 45 MPa & Pembesian High-Strength"
              className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-[#202B26] mb-1">Divisi Pekerjaan</label>
              <select
                value={revForm.divisionName}
                onChange={(e) => setRevForm({ ...revForm, divisionName: e.target.value })}
                className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
              >
                <option value="Pekerjaan Struktur">Pekerjaan Struktur</option>
                <option value="Pekerjaan Arsitektur">Pekerjaan Arsitektur</option>
                <option value="Pekerjaan MEP">Pekerjaan MEP</option>
                <option value="Pekerjaan Persiapan">Pekerjaan Persiapan</option>
                <option value="Manajemen & Overhead">Manajemen & Overhead</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B26] mb-1">Pagu Semula (IDR)</label>
              <input
                type="number"
                required
                value={revForm.originalAmount}
                onChange={(e) => setRevForm({ ...revForm, originalAmount: e.target.value })}
                placeholder="2500000000"
                className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg font-mono text-[#202B26]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B26] mb-1">Usulan Pagu Baru (IDR)</label>
              <input
                type="number"
                required
                value={revForm.proposedAmount}
                onChange={(e) => setRevForm({ ...revForm, proposedAmount: e.target.value })}
                placeholder="2750000000"
                className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg font-mono text-[#202B26]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B26] mb-1">Justifikasi Rekayasa Nilai & Alasan Teknis (Wajib)</label>
            <textarea
              rows={3}
              required
              value={revForm.justification}
              onChange={(e) => setRevForm({ ...revForm, justification: e.target.value })}
              placeholder="Jelaskan dasar pertimbangan: perubahan gambar for construction, temuan geoteknik lapangan, rekomendasi konsultan MK..."
              className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL: REJECT REVISION */}
      {rejectingRev && (
        <Modal
          isOpen={true}
          onClose={() => setRejectingRev(null)}
          title={`Tolak Addendum ${rejectingRev.revisionNumber}`}
          description={`Pengajuan dari ${rejectingRev.submittedBy} senilai deviasi Rp ${rejectingRev.varianceAmount.toLocaleString('id-ID')}.`}
          maxWidth="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setRejectingRev(null)}>
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (!revRejectReason.trim()) {
                    addToast({ type: 'warning', message: 'Alasan penolakan wajib diisi untuk rekam audit.' });
                    return;
                  }
                  const rejector = userProfile?.name || currentUser?.displayName || `${activeRole}`;
                  rejectBudgetRevision(rejectingRev.id, rejector, revRejectReason.trim());
                  setRejectingRev(null);
                  setRevRejectReason('');
                }}
              >
                Konfirmasi Tolak
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-[#202B26] mb-1">Alasan Penolakan Resmi (Audit Log) *</label>
              <textarea
                rows={3}
                required
                value={revRejectReason}
                onChange={(e) => setRevRejectReason(e.target.value)}
                placeholder="Jelaskan alasan penolakan anggaran (misal: efisiensi biaya, optimasi desain arsitektur)..."
                className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: NEW PETTY CASH */}
      <Modal
        isOpen={isNewPettyModalOpen}
        onClose={() => setIsNewPettyModalOpen(false)}
        title="Pengajuan Kas Kecil Lapangan (Petty Cash)"
        description={`Klaim belanja site proyek ${currentProject.name}`}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsNewPettyModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreatePettyCash}>
              Kirim Permohonan Kas
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePettyCash} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#202B26] mb-1">Peruntukan Belanja / Tujuan</label>
            <input
              type="text"
              required
              value={pettyForm.purpose}
              onChange={(e) => setPettyForm({ ...pettyForm, purpose: e.target.value })}
              placeholder="Contoh: Konsumsi lembur 35 pekerja pengecoran plat zona 3"
              className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B26] mb-1">Kategori Pengeluaran</label>
              <select
                value={pettyForm.category}
                onChange={(e) => setPettyForm({ ...pettyForm, category: e.target.value as any })}
                className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
              >
                <option value="Konsumsi & Lembur">Konsumsi & Lembur</option>
                <option value="BBM & Logistik Ringan">BBM & Logistik Ringan</option>
                <option value="K3 & Obat P3K">K3 & Obat P3K</option>
                <option value="Perkakas Kecil & Baut">Perkakas Kecil & Baut</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B26] mb-1">Nominal (IDR)</label>
              <input
                type="number"
                required
                value={pettyForm.amount}
                onChange={(e) => setPettyForm({ ...pettyForm, amount: e.target.value })}
                placeholder="1500000"
                className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg font-mono text-[#202B26]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B26] mb-1">Lampiran Referensi Nota / Bon</label>
            <input
              type="text"
              required
              value={pettyForm.receiptProof}
              onChange={(e) => setPettyForm({ ...pettyForm, receiptProof: e.target.value })}
              className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL: REJECT PETTY CASH */}
      {rejectingPetty && (
        <Modal
          isOpen={true}
          onClose={() => setRejectingPetty(null)}
          title={`Tolak Kas Kecil ${rejectingPetty.pettyCashNo}`}
          description={`Pengajuan dari ${rejectingPetty.requester} senilai Rp ${rejectingPetty.amount.toLocaleString('id-ID')}.`}
          maxWidth="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setRejectingPetty(null)}>
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (!pettyRejectReason.trim()) {
                    addToast({ type: 'warning', message: 'Alasan penolakan wajib diisi.' });
                    return;
                  }
                  const rejector = userProfile?.name || currentUser?.displayName || `${activeRole}`;
                  rejectPettyCash(rejectingPetty.id, rejector, pettyRejectReason.trim());
                  setRejectingPetty(null);
                  setPettyRejectReason('');
                }}
              >
                Konfirmasi Tolak
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-[#202B26] mb-1">Alasan Penolakan Kas Kecil *</label>
              <textarea
                rows={3}
                required
                value={pettyRejectReason}
                onChange={(e) => setPettyRejectReason(e.target.value)}
                placeholder="Contoh: Nota tidak sah / melebihi batas klaim harian..."
                className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

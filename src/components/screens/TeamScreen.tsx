import React, { useState } from 'react';
import {
  Users2,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Search,
  Mail,
  Phone,
  Building,
  KeyRound,
  Info,
  Edit3,
  UserX,
  UserCheck,
  ShieldAlert,
  Check,
  X,
  Lock,
  Layers,
  FileCheck,
  FolderKanban
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { MetricCard } from '../common/MetricCard';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { SearchInput } from '../common/SearchInput';
import { Modal } from '../common/Modal';
import { TeamMember } from '../../types';
import { AppRole } from '../../types/rbac';
import { ALL_ROLES, ROLE_DEFINITIONS, hasGlobalProjectAccess } from '../../lib/rbac';

export const TeamScreen: React.FC = () => {
  const {
    teamMembers,
    projects,
    addToast,
    updateTeamMemberRole,
    toggleTeamMemberStatus,
    inviteTeamMember,
  } = useApp();

  const { activeRole, hasAuthority, userProfile, currentUser } = useAuth();

  const canManageRoles = hasAuthority('roleManagement') || activeRole === 'Owner / Director';

  const [activeTab, setActiveTab] = useState<'directory' | 'matrix'>('directory');
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('Semua');

  // Modal: View Member Detail
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Modal: Edit Role & Projects
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRoleForm, setEditRoleForm] = useState<{
    role: AppRole;
    assignedProjects: string[];
  }>({
    role: 'Site Manager / Supervisor',
    assignedProjects: [],
  });

  // Modal: Deactivate / Activate Member Confirmation
  const [confirmToggleMember, setConfirmToggleMember] = useState<TeamMember | null>(null);

  // Modal: Invite Team Member
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<{
    name: string;
    email: string;
    nip: string;
    role: AppRole;
    department: string;
    phone: string;
    assignedProjects: string[];
  }>({
    name: '',
    email: '',
    nip: '',
    role: 'Site Manager / Supervisor',
    department: 'Operasional & Supervisi Lapangan',
    phone: '0812-9876-0000',
    assignedProjects: [projects[0]?.name || 'Menara Nusantara Office Tower'],
  });

  const filteredMembers = teamMembers.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase()) ||
      m.nip.toLowerCase().includes(search.toLowerCase());

    const matchDept =
      filterDepartment === 'Semua' || m.department === filterDepartment;

    return matchSearch && matchDept;
  });

  const departments = Array.from(new Set(teamMembers.map((m) => m.department)));

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setEditRoleForm({
      role: (ALL_ROLES.includes(member.role as AppRole)
        ? member.role
        : 'Site Manager / Supervisor') as AppRole,
      assignedProjects: [...member.assignedProjects],
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    if (!canManageRoles) {
      addToast({
        type: 'danger',
        title: 'Akses Ditolak',
        message: 'Anda tidak memiliki wewenang untuk mengubah peran dan penugasan personil.',
      });
      return;
    }

    await updateTeamMemberRole(
      editingMember.id,
      editRoleForm.role,
      editRoleForm.assignedProjects.length > 0
        ? editRoleForm.assignedProjects
        : [projects[0]?.name || 'Proyek Default']
    );

    setEditingMember(null);
  };

  const handleConfirmToggleStatus = async () => {
    if (!confirmToggleMember) return;

    if (!canManageRoles) {
      addToast({
        type: 'danger',
        title: 'Akses Ditolak',
        message: 'Hanya Direksi atau Manajer Proyek berwenang menonaktifkan akun anggota.',
      });
      setConfirmToggleMember(null);
      return;
    }

    await toggleTeamMemberStatus(confirmToggleMember.id);
    setConfirmToggleMember(null);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email || !inviteForm.nip) {
      addToast({
        type: 'warning',
        message: 'Harap lengkapi semua data wajib undangan personil.',
      });
      return;
    }

    if (!canManageRoles) {
      addToast({
        type: 'danger',
        title: 'Akses Ditolak',
        message: 'Peran Anda tidak diotorisasi untuk mengundang personil baru.',
      });
      return;
    }

    await inviteTeamMember({
      name: inviteForm.name,
      email: inviteForm.email,
      nip: inviteForm.nip,
      role: inviteForm.role,
      department: inviteForm.department,
      phone: inviteForm.phone,
      assignedProjects:
        inviteForm.assignedProjects.length > 0
          ? inviteForm.assignedProjects
          : [projects[0]?.name || 'Menara Nusantara Office Tower'],
      status: 'Aktif',
    });

    setIsInviteModalOpen(false);
    setInviteForm({
      name: '',
      email: '',
      nip: '',
      role: 'Site Manager / Supervisor',
      department: 'Operasional & Supervisi Lapangan',
      phone: '0812-9876-0000',
      assignedProjects: [projects[0]?.name || 'Menara Nusantara Office Tower'],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8E4]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#69766F] mb-1">
            <span>Manajemen Sumber Daya & Tata Kelola</span>
            <span aria-hidden="true">·</span>
            <span>Hak Akses Peran (Role-Based Access Control)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202B26]">
            Tim Proyek & Matriks Tata Kelola (RBAC)
          </h1>
          <p className="text-xs text-[#69766F] mt-0.5">
            Manajemen keanggotaan terpercaya, pemetaan 8 peran struktural, dan pemisahan batas kewenangan proyek
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {canManageRoles ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Undang Anggota Tim
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF8EC] border border-[#FCE6B1] rounded-lg text-xs text-[#9E6B05] font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Mode Tinjauan (Read-only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-[#E5F4EB] border border-[#CDE9D7] rounded-xl p-4 flex items-start gap-3 text-xs text-[#1C6843]">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#1C6843]" />
        <div className="space-y-0.5">
          <div className="font-semibold text-[#12352B]">
            Pemisahan Wewenang (Segregation of Duties) Aktif:
          </div>
          <p className="text-[#202B26]/80 leading-relaxed">
            Peran Anda saat ini: <strong className="text-[#12352B] underline">{activeRole}</strong>.
            {canManageRoles
              ? ' Anda memiliki wewenang administratif untuk mengelola peran, menugaskan proyek, serta mengaktivasi atau menonaktifkan akun anggota.'
              : ' Akses modifikasi wewenang dibatasi khusus Direksi dan Manajer Proyek. Perubahan status diaudit ke immutable audit log.'}
          </p>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Personil Terdaftar"
          value={`${teamMembers.length} Personil`}
          subtitle="Teknik, QS, HSE, Logistik & Finansial"
          icon={<Users2 className="w-4 h-4 text-[#12352B]" />}
        />
        <MetricCard
          label="Personil Aktif Bertugas"
          value={`${teamMembers.filter((m) => m.status !== 'Nonaktif').length} Orang`}
          subtitle="Memiliki hak akses operasional"
          trend={{ value: `${teamMembers.filter((m) => m.status === 'Nonaktif').length} Nonaktif`, isPositive: true }}
          icon={<CheckCircle2 className="w-4 h-4 text-[#1C6843]" />}
        />
        <MetricCard
          label="Pemegang Otoritas Approval"
          value="4 Peran Kunci"
          subtitle="Direksi, PM, QS & Keuangan"
          icon={<ShieldCheck className="w-4 h-4 text-[#285744]" />}
        />
        <MetricCard
          label="Jumlah Model Peran (RBAC)"
          value={`${ALL_ROLES.length} Peran Resmi`}
          subtitle="Pemisahan level korporat & site"
          trend={{ value: 'Standar ISO 19650', isPositive: true }}
          icon={<KeyRound className="w-4 h-4 text-[#1C6843]" />}
        />
      </div>

      {/* Segmented View Switch */}
      <div className="bg-white p-3 rounded-xl border border-[#E2E8E4] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-[#EAEFEA] rounded-lg gap-1">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-white text-[#12352B] shadow-2xs font-semibold'
                : 'text-[#69766F] hover:text-[#202B26]'
            }`}
          >
            Direktori Anggota Tim ({teamMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white text-[#12352B] shadow-2xs font-semibold'
                : 'text-[#69766F] hover:text-[#202B26]'
            }`}
          >
            Matriks Hak Akses & Kewenangan (8 Peran)
          </button>
        </div>

        {activeTab === 'directory' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari nama, NIP, peran..."
              className="w-full sm:w-60"
            />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="h-9 bg-white border border-[#E2E8E4] rounded-lg px-2.5 text-xs font-medium text-[#202B26] focus:outline-none focus:border-[#12352B] cursor-pointer"
            >
              <option value="Semua">Semua Departemen</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Member Directory */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-xl border border-[#E2E8E4] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8E4] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#202B26]">Direktori Keanggotaan & Penugasan Proyek</h2>
              <p className="text-xs text-[#69766F] mt-0.5">
                Pengguna nonaktif secara otomatis diblokir dari aksi tulis pada data operasional & finansial
              </p>
            </div>
            <span className="text-xs text-[#69766F] font-mono">
              Menampilkan {filteredMembers.length} personil
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFBFB] text-[#69766F] border-b border-[#E2E8E4]">
                  <th className="py-3 px-4 font-semibold">Nama & NIP</th>
                  <th className="py-3 px-4 font-semibold">Peran Struktural</th>
                  <th className="py-3 px-4 font-semibold hidden md:table-cell">Kontak Personil</th>
                  <th className="py-3 px-4 font-semibold">Cakupan Penugasan</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E4]/70">
                {filteredMembers.map((member) => {
                  const isDeactivated = member.status === 'Nonaktif';
                  const isGlobal = hasGlobalProjectAccess(member.role);

                  const statusVariant =
                    member.status === 'Aktif'
                      ? 'success'
                      : member.status === 'Di Lapangan'
                      ? 'info'
                      : member.status === 'Nonaktif'
                      ? 'danger'
                      : 'neutral';

                  return (
                    <tr
                      key={member.id}
                      className={`transition-colors ${
                        isDeactivated
                          ? 'bg-[#FAFBFB]/70 opacity-70'
                          : 'hover:bg-[#F5F7F6]/80'
                      }`}
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#202B26] flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {isDeactivated && (
                            <span className="text-[10px] bg-[#FCE8E6] text-[#A82A20] px-1 rounded font-normal">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#69766F] font-mono tabular-nums">
                          {member.nip} · {member.department}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-[#12352B] bg-[#EAEFEA] px-2 py-0.5 rounded text-[11px]">
                          {member.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 hidden md:table-cell text-[#69766F]">
                        <div className="truncate max-w-[180px]">{member.email}</div>
                        <div className="text-[11px] font-mono tabular-nums">{member.phone}</div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[220px]">
                        {isGlobal ? (
                          <div className="flex items-center gap-1 text-[11px] text-[#1C6843] font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>Akses Global (Seluruh Proyek)</span>
                          </div>
                        ) : (
                          <div>
                            <div className="truncate font-medium text-[#202B26]">
                              {member.assignedProjects[0] || 'Belum ditugaskan'}
                            </div>
                            {member.assignedProjects.length > 1 && (
                              <div className="text-[10px] text-[#285744] font-semibold">
                                +{member.assignedProjects.length - 1} proyek lainnya
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={statusVariant} size="sm" dot>
                          {member.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => setSelectedMember(member)}
                        >
                          Detail
                        </Button>

                        {canManageRoles && (
                          <>
                            <Button
                              variant="secondary"
                              size="xs"
                              leftIcon={<Edit3 className="w-3 h-3" />}
                              onClick={() => handleOpenEdit(member)}
                            >
                              Ubah Peran
                            </Button>

                            <button
                              type="button"
                              onClick={() => setConfirmToggleMember(member)}
                              className={`p-1.5 rounded text-xs transition-colors cursor-pointer inline-flex items-center justify-center ${
                                isDeactivated
                                  ? 'bg-[#E5F4EB] text-[#1C6843] hover:bg-[#CDE9D7]'
                                  : 'bg-[#FCE8E6] text-[#A82A20] hover:bg-[#FAD2CF]'
                              }`}
                              title={isDeactivated ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}
                            >
                              {isDeactivated ? (
                                <UserCheck className="w-3.5 h-3.5" />
                              ) : (
                                <UserX className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC Permission Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E4] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#E2E8E4]">
              <h2 className="text-sm font-bold text-[#202B26]">
                Matriks Hak Akses & Segregasi Tugas (8 Peran Standar)
              </h2>
              <p className="text-xs text-[#69766F] mt-0.5">
                Konfigurasi wewenang modul dan otorisasi transaksi pada sistem Indotek Pro
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFB] text-[#69766F] border-b border-[#E2E8E4]">
                    <th className="py-3 px-4 font-semibold min-w-[180px]">Peran (Role)</th>
                    <th className="py-3 px-3 font-semibold text-center">Cakupan Proyek</th>
                    <th className="py-3 px-3 font-semibold text-center">Revisi RAB</th>
                    <th className="py-3 px-3 font-semibold text-center">Approval PO</th>
                    <th className="py-3 px-3 font-semibold text-center">Opname Stok</th>
                    <th className="py-3 px-3 font-semibold text-center">Laporan Site</th>
                    <th className="py-3 px-3 font-semibold text-center">BAST Milestone</th>
                    <th className="py-3 px-3 font-semibold text-center">Kelola Tim/Role</th>
                    <th className="py-3 px-3 font-semibold text-center">Kas Kecil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E4]/70">
                  {ALL_ROLES.map((roleKey) => {
                    const rDef = ROLE_DEFINITIONS[roleKey];
                    const isGlobal = hasGlobalProjectAccess(roleKey);

                    return (
                      <tr key={roleKey} className="hover:bg-[#F5F7F6]/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#202B26]">{roleKey}</div>
                          <div className="text-[11px] text-[#69766F]">{rDef.department}</div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isGlobal ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5F4EB] text-[#1C6843]">
                              Global
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#EAEFEA] text-[#202B26]">
                              Proyek Site
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {rDef.approvalAuthorities.budgetRevision ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E5F4EB] text-[#1C6843]">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FAFBFB] text-[#CBD5CF]">
                              -
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {rDef.approvalAuthorities.purchaseOrder ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E5F4EB] text-[#1C6843]">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FAFBFB] text-[#CBD5CF]">
                              -
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {rDef.approvalAuthorities.stockAdjustment ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E5F4EB] text-[#1C6843]">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FAFBFB] text-[#CBD5CF]">
                              -
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {rDef.approvalAuthorities.fieldReport ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E5F4EB] text-[#1C6843]">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FAFBFB] text-[#CBD5CF]">
                              -
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {rDef.approvalAuthorities.milestoneSignOff ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E5F4EB] text-[#1C6843]">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FAFBFB] text-[#CBD5CF]">
                              -
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {rDef.approvalAuthorities.roleManagement ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E5F4EB] text-[#1C6843]">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FAFBFB] text-[#CBD5CF]">
                              -
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {rDef.approvalAuthorities.pettyCash ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E5F4EB] text-[#1C6843]">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FAFBFB] text-[#CBD5CF]">
                              -
                            </span>
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

      {/* MODAL 1: Detail Personil */}
      {selectedMember && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMember(null)}
          title={`Profil Personil & Wewenang — ${selectedMember.name}`}
          description={`NIP: ${selectedMember.nip} · Departemen: ${selectedMember.department}`}
          maxWidth="md"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setSelectedMember(null)}>
              Tutup
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-[#FAFBFB] rounded-lg border border-[#E2E8E4] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#69766F]">Peran Struktural:</span>
                <span className="font-bold text-[#12352B]">{selectedMember.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#69766F]">Email Korporat:</span>
                <span className="font-mono text-[#202B26]">{selectedMember.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#69766F]">Nomor Telepon:</span>
                <span className="font-mono text-[#202B26]">{selectedMember.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#69766F]">Status Akun:</span>
                <Badge variant={selectedMember.status === 'Aktif' ? 'success' : 'neutral'} size="sm">
                  {selectedMember.status}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-[#202B26] mb-2 flex items-center gap-1.5">
                <FolderKanban className="w-4 h-4 text-[#285744]" />
                <span>Proyek yang Ditugaskan:</span>
              </h4>
              <div className="p-2.5 bg-[#FAFBFB] rounded-lg border border-[#E2E8E4] space-y-1">
                {hasGlobalProjectAccess(selectedMember.role) ? (
                  <p className="text-[#1C6843] font-medium">
                    ✓ Akses portofolio penuh ke seluruh proyek PT Indotek Bangun Nusantara (Global Scope).
                  </p>
                ) : selectedMember.assignedProjects.length > 0 ? (
                  selectedMember.assignedProjects.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[#202B26]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#12352B]" />
                      <span>{p}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[#69766F]">Belum ditugaskan ke proyek aktif.</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-[#202B26] mb-2 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-[#9E6B05]" />
                <span>Wewenang Otoritas Sistem:</span>
              </h4>
              <div className="p-2.5 bg-[#FAFBFB] rounded-lg border border-[#E2E8E4] space-y-1.5">
                {(() => {
                  const rKey = (ALL_ROLES.includes(selectedMember.role as AppRole)
                    ? selectedMember.role
                    : 'Site Manager / Supervisor') as AppRole;
                  const auths = ROLE_DEFINITIONS[rKey]?.approvalAuthorities;

                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[#69766F]">Approval Addendum Revisi RAB</span>
                        <Badge variant={auths?.budgetRevision ? 'success' : 'neutral'} size="sm">
                          {auths?.budgetRevision ? 'Berwenang' : 'Dibatasi'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#69766F]">Approval Purchase Order (PO)</span>
                        <Badge variant={auths?.purchaseOrder ? 'success' : 'neutral'} size="sm">
                          {auths?.purchaseOrder ? 'Berwenang' : 'Dibatasi'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#69766F]">Approval Opname / Koreksi Stok</span>
                        <Badge variant={auths?.stockAdjustment ? 'success' : 'neutral'} size="sm">
                          {auths?.stockAdjustment ? 'Berwenang' : 'Dibatasi'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#69766F]">Verifikasi & Approval Laporan Site</span>
                        <Badge variant={auths?.fieldReport ? 'success' : 'neutral'} size="sm">
                          {auths?.fieldReport ? 'Berwenang' : 'Dibatasi'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#69766F]">Sign-off BAST Milestone Proyek</span>
                        <Badge variant={auths?.milestoneSignOff ? 'success' : 'neutral'} size="sm">
                          {auths?.milestoneSignOff ? 'Berwenang' : 'Dibatasi'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#69766F]">Manajemen Peran & Personil</span>
                        <Badge variant={auths?.roleManagement ? 'success' : 'neutral'} size="sm">
                          {auths?.roleManagement ? 'Berwenang' : 'Dibatasi'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#69766F]">Pencairan & Approval Kas Kecil</span>
                        <Badge variant={auths?.pettyCash ? 'success' : 'neutral'} size="sm">
                          {auths?.pettyCash ? 'Berwenang' : 'Dibatasi'}
                        </Badge>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: Ubah Peran & Penugasan Personil */}
      {editingMember && (
        <Modal
          isOpen={true}
          onClose={() => setEditingMember(null)}
          title={`Ubah Peran & Penugasan — ${editingMember.name}`}
          description={`NIP: ${editingMember.nip}. Modifikasi ini akan diaudit dan berlaku segera.`}
          maxWidth="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditingMember(null)}>
                Batal
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                Simpan Perubahan Hak Akses
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[#202B26] mb-1">
                Pilih Peran Struktural (Role Model) <span className="text-[#A82A20]">*</span>
              </label>
              <select
                value={editRoleForm.role}
                onChange={(e) =>
                  setEditRoleForm({ ...editRoleForm, role: e.target.value as AppRole })
                }
                className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26] focus:outline-none focus:border-[#12352B]"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r} — {ROLE_DEFINITIONS[r]?.department}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#69766F] mt-1">
                {ROLE_DEFINITIONS[editRoleForm.role]?.description}
              </p>
            </div>

            <div>
              <label className="block font-medium text-[#202B26] mb-1">
                Penugasan Proyek Aktif
              </label>
              {hasGlobalProjectAccess(editRoleForm.role) ? (
                <div className="p-3 bg-[#E5F4EB] text-[#1C6843] rounded-lg border border-[#CDE9D7]">
                  Peran <strong className="font-semibold">{editRoleForm.role}</strong> memiliki hak
                  akses global ke seluruh proyek secara default (Owner / Auditor / Finance).
                </div>
              ) : (
                <div className="space-y-2 p-3 bg-[#FAFBFB] rounded-lg border border-[#E2E8E4] max-h-48 overflow-y-auto">
                  {projects.map((proj) => {
                    const isChecked = editRoleForm.assignedProjects.includes(proj.name);
                    return (
                      <label
                        key={proj.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditRoleForm({
                                ...editRoleForm,
                                assignedProjects: [...editRoleForm.assignedProjects, proj.name],
                              });
                            } else {
                              setEditRoleForm({
                                ...editRoleForm,
                                assignedProjects: editRoleForm.assignedProjects.filter(
                                  (p) => p !== proj.name
                                ),
                              });
                            }
                          }}
                          className="rounded text-[#12352B] focus:ring-[#12352B]"
                        />
                        <span className="text-[#202B26] font-medium">{proj.name}</span>
                        <span className="text-[#69766F] text-[10px]">({proj.code})</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 bg-[#FFF8EC] border border-[#FCE6B1] rounded-lg text-[11px] text-[#9E6B05] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Perubahan peran dicatat secara permanen pada Jejak Audit Korporat dengan identitas
                Anda ({userProfile?.name || currentUser?.displayName || activeRole}).
              </span>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: Konfirmasi Aktivasi / Deaktivasi Status */}
      {confirmToggleMember && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmToggleMember(null)}
          title={`${confirmToggleMember.status === 'Nonaktif' ? 'Aktifkan Kembali' : 'Nonaktifkan'} Akun Personil`}
          description={`Personil: ${confirmToggleMember.name} (${confirmToggleMember.nip})`}
          maxWidth="sm"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setConfirmToggleMember(null)}>
                Batal
              </Button>
              <Button
                variant={confirmToggleMember.status === 'Nonaktif' ? 'primary' : 'danger'}
                size="sm"
                onClick={handleConfirmToggleStatus}
              >
                {confirmToggleMember.status === 'Nonaktif' ? 'Ya, Aktifkan Akun' : 'Ya, Nonaktifkan Akun'}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-[#202B26] leading-relaxed">
              {confirmToggleMember.status === 'Nonaktif' ? (
                <>
                  Apakah Anda yakin ingin mengaktifkan kembali akun{' '}
                  <strong>{confirmToggleMember.name}</strong>? Personil ini akan kembali mendapatkan
                  akses sesuai perannya ({confirmToggleMember.role}).
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menonaktifkan akun{' '}
                  <strong>{confirmToggleMember.name}</strong>? Personil ini akan langsung diblokir
                  dari aksi approval, pengajuan RAB, mutasi, dan verifikasi laporan.
                </>
              )}
            </p>
          </div>
        </Modal>
      )}

      {/* MODAL 4: Undang Personil Baru */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Undang Personil Baru ke Workspace"
        description="Tetapkan peran, nomor identitas pegawai (NIP), dan alokasi proyek awal."
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsInviteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleInviteSubmit}>
              Kirim Undangan & Terbitkan Akun
            </Button>
          </>
        }
      >
        <form onSubmit={handleInviteSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-[#202B26] mb-1">
              Nama Lengkap & Gelar <span className="text-[#A82A20]">*</span>
            </label>
            <input
              type="text"
              required
              value={inviteForm.name}
              onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
              placeholder="Contoh: Ir. Muhammad Rizky, S.T., IPM"
              className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B26] mb-1">
                Email Perusahaan <span className="text-[#A82A20]">*</span>
              </label>
              <input
                type="email"
                required
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="rizky.site@indotekpro.id"
                className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202B26] mb-1">
                Nomor Induk Pegawai (NIP) <span className="text-[#A82A20]">*</span>
              </label>
              <input
                type="text"
                required
                value={inviteForm.nip}
                onChange={(e) => setInviteForm({ ...inviteForm, nip: e.target.value })}
                placeholder="NIP-2026-088"
                className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg font-mono text-[#202B26]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#202B26] mb-1">
                Peran Struktural (Role) <span className="text-[#A82A20]">*</span>
              </label>
              <select
                value={inviteForm.role}
                onChange={(e) => {
                  const r = e.target.value as AppRole;
                  setInviteForm({
                    ...inviteForm,
                    role: r,
                    department: ROLE_DEFINITIONS[r]?.department || inviteForm.department,
                  });
                }}
                className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202B26] mb-1">
                Departemen / Unit
              </label>
              <input
                type="text"
                value={inviteForm.department}
                onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg text-[#202B26]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202B26] mb-1">
              Nomor Handphone / WhatsApp
            </label>
            <input
              type="text"
              value={inviteForm.phone}
              onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
              className="w-full p-2.5 bg-white border border-[#E2E8E4] rounded-lg font-mono text-[#202B26]"
            />
          </div>

          <div>
            <label className="block font-medium text-[#202B26] mb-1">
              Alokasi Penugasan Proyek
            </label>
            <div className="space-y-1.5 p-2.5 bg-[#FAFBFB] rounded-lg border border-[#E2E8E4] max-h-36 overflow-y-auto">
              {projects.map((p) => {
                const isSelected = inviteForm.assignedProjects.includes(p.name);
                return (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setInviteForm({
                            ...inviteForm,
                            assignedProjects: [...inviteForm.assignedProjects, p.name],
                          });
                        } else {
                          setInviteForm({
                            ...inviteForm,
                            assignedProjects: inviteForm.assignedProjects.filter(
                              (proj) => proj !== p.name
                            ),
                          });
                        }
                      }}
                      className="rounded text-[#12352B] focus:ring-[#12352B]"
                    />
                    <span className="text-[#202B26]">{p.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

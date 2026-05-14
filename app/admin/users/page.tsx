"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Lock,
  MoreHorizontal,
  Search,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { FilterSelect } from "@/components/ui/filter-select";

type ApiUser = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  currency: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  profile: {
    onboardingCompleted: boolean;
    city: string | null;
    occupation: string | null;
  } | null;
  _count: {
    transactions: number;
    reports: number;
    conversations: number;
  };
};

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string | null, email: string) {
  const source = name?.trim() || email.split("@")[0];
  return source
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "U";
}

const avatarColors = [
  "bg-slate-800 text-white",
  "bg-green-600 text-white",
  "bg-purple-600 text-white",
  "bg-blue-600 text-white",
  "bg-orange-500 text-white",
  "bg-teal-500 text-white",
];

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<ApiUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [dateFilter, setDateFilter] = React.useState<"ALL" | "THIS_MONTH" | "LAST_30">("ALL");
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [stats, setStats] = React.useState({ totalUsers: 0, activeUsers: 0, adminCount: 0, newThisMonth: 0 });
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [temporaryPassword, setTemporaryPassword] = React.useState<string | null>(null);

  const totalPages = Math.max(Math.ceil(total / 10), 1);
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0] ?? null;

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (dateFilter !== "ALL") params.set("created", dateFilter);

    try {
      const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);
      setUsers(json.data);
      setTotal(json.meta?.total ?? 0);
      setStats(json.meta?.stats ?? { totalUsers: 0, activeUsers: 0, adminCount: 0, newThisMonth: 0 });
      setSelectedUserId((current) => current ?? json.data[0]?.id ?? null);
    } catch {
      toast.error("Kullanıcılar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, page, roleFilter, searchTerm, statusFilter]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleToggleActive(user: ApiUser) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);
      setUsers((current) =>
        current.map((item) => item.id === user.id ? { ...item, isActive: !user.isActive } : item),
      );
      toast.success(!user.isActive ? "Kullanıcı aktif edildi." : "Kullanıcı pasife alındı.");
    } catch {
      toast.error("Kullanıcı durumu güncellenemedi.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword(user: ApiUser) {
    if (!confirm(`${user.email} için geçici parola oluşturulsun mu?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);
      setTemporaryPassword(json.data.temporaryPassword);
      toast.success(json.data.message);
    } catch {
      toast.error("Şifre sıfırlanamadı.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 font-sans text-slate-900 pb-8 h-full">
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kayıtlı kullanıcıları, rollerini, durumlarını ve kullanım özetlerini yönet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20"
            />
          </div>

          <FilterSelect
            value={roleFilter}
            onChange={(value) => { setRoleFilter(value); setPage(1); }}
            options={[
              { value: "ALL", label: "Tüm Roller" },
              { value: "USER", label: "Kullanıcı" },
              { value: "ADMIN", label: "Admin" },
            ]}
            ariaLabel="Rol filtresi"
            triggerClassName="w-32 px-3"
          />

          <FilterSelect
            value={statusFilter}
            onChange={(value) => { setStatusFilter(value); setPage(1); }}
            options={[
              { value: "ALL", label: "Tüm Durumlar" },
              { value: "ACTIVE", label: "Aktif" },
              { value: "INACTIVE", label: "Pasif" },
            ]}
            ariaLabel="Durum filtresi"
            triggerClassName="w-36 px-3"
          />

          <FilterSelect
            value={dateFilter}
            onChange={(value) => { setDateFilter(value); setPage(1); }}
            options={[
              { value: "ALL", label: "Kayıt Tarihi" },
              { value: "THIS_MONTH", label: "Bu Ay" },
              { value: "LAST_30", label: "Son 30 Gün" },
            ]}
            ariaLabel="Tarih filtresi"
            triggerClassName="w-40 px-3"
          />

          <button onClick={fetchUsers} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] ml-auto">
            <Filter className="w-4 h-4" /> Filtrele
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Toplam Kullanıcı", value: stats.totalUsers, icon: Users, bg: "bg-blue-50", color: "text-blue-500", note: "Tüm zamanlar" },
            { label: "Yeni Kullanıcı", value: stats.newThisMonth, icon: UserPlus, bg: "bg-purple-50", color: "text-purple-500", note: "Bu ay" },
            { label: "Aktif Kullanıcı", value: stats.activeUsers, icon: UserCheck, bg: "bg-green-50", color: "text-[#10B981]", note: "Aktif hesap" },
            { label: "Admin", value: stats.adminCount, icon: Shield, bg: "bg-blue-50", color: "text-blue-500", note: "Toplam admin" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0", item.bg)}>
                <item.icon className={cn("w-6 h-6", item.color)} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1">{item.label}</div>
                <div className="text-2xl font-bold text-slate-900 leading-none mb-1">{loading ? "-" : item.value.toLocaleString("tr-TR")}</div>
                <div className="text-[10px] text-slate-400">{item.note}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-5 py-4 font-semibold">Kullanıcı</th>
                  <th className="px-5 py-4 font-semibold">E-posta</th>
                  <th className="px-5 py-4 font-semibold">Rol</th>
                  <th className="px-5 py-4 font-semibold">Durum</th>
                  <th className="px-5 py-4 font-semibold">Kayıt Tarihi</th>
                  <th className="px-5 py-4 font-semibold">İşlem</th>
                  <th className="px-5 py-4 font-semibold text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Yükleniyor...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Kullanıcı bulunamadı.</td></tr>
                ) : users.map((user, index) => (
                  <tr key={user.id} onClick={() => { setSelectedUserId(user.id); setTemporaryPassword(null); }} className={cn("border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50/60", selectedUser?.id === user.id && "bg-slate-50")}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 font-bold text-slate-800">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs", avatarColors[index % avatarColors.length])}>
                          {getInitials(user.name, user.email)}
                        </div>
                        {user.name ?? user.email.split("@")[0]}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-medium">{user.email}</td>
                    <td className="px-5 py-3"><span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-700">{user.role}</span></td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 font-bold text-slate-700">
                        <span className={cn("w-2 h-2 rounded-full", user.isActive ? "bg-[#10B981]" : "bg-red-500")} />
                        {user.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-medium">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-3 text-slate-500 font-medium">{user._count.transactions}</td>
                      <td className="px-5 py-3 text-right">
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button
                              onClick={(event) => event.stopPropagation()}
                              className="text-slate-400 hover:text-slate-600"
                              aria-label={`${user.email} için işlem menüsü`}
                            >
                              <MoreHorizontal className="w-4 h-4 inline-block" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              sideOffset={8}
                              align="end"
                              className="z-50 min-w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
                            >
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50"
                                onSelect={() => { setSelectedUserId(user.id); setTemporaryPassword(null); }}
                              >
                                Detayları Aç
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50"
                                onSelect={() => void handleToggleActive(user)}
                              >
                                {user.isActive ? "Pasife Al" : "Aktif Et"}
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50"
                                onSelect={() => void handleResetPassword(user)}
                              >
                                Geçici Parola Oluştur
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50"
                                onSelect={() => navigator.clipboard?.writeText(user.email).catch(() => {})}
                              >
                                E-postayı Kopyala
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-auto px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">{total.toLocaleString("tr-TR")} kullanıcı</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs font-semibold text-slate-700">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[320px] shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full sticky top-[84px]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Kullanıcı Detayı</h2>
            <button className="text-slate-400 hover:text-slate-600" onClick={() => setSelectedUserId(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto">
            {!selectedUser ? (
              <div className="text-xs text-slate-400 text-center mt-8">Bir kullanıcı seçin.</div>
            ) : (
              <>
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-3">Profil</div>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0", avatarColors[Math.max(users.indexOf(selectedUser), 0) % avatarColors.length])}>
                      {getInitials(selectedUser.name, selectedUser.email)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{selectedUser.name ?? selectedUser.email.split("@")[0]}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{selectedUser.email}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Son giriş: {formatDate(selectedUser.lastLoginAt)}</div>
                      <div className={cn("text-[10px] font-bold mt-1", selectedUser.isActive ? "text-[#10B981]" : "text-red-500")}>
                        {selectedUser.role} · {selectedUser.isActive ? "Aktif" : "Pasif"}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-500 mb-3">Profil Bilgileri</div>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoBox label="Şehir" value={selectedUser.profile?.city ?? "-"} />
                    <InfoBox label="Meslek" value={selectedUser.profile?.occupation ?? "-"} />
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-500 mb-3">Kullanım</div>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoBox label="AI Konuşma" value={String(selectedUser._count.conversations)} />
                    <InfoBox label="Rapor" value={String(selectedUser._count.reports)} />
                    <InfoBox label="İşlem" value={String(selectedUser._count.transactions)} className="col-span-2" />
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-500 mb-3">Hesap Durumu</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Durum</span>
                    <button
                      onClick={() => handleToggleActive(selectedUser)}
                      disabled={actionLoading}
                      className={cn("w-9 h-5 rounded-full relative transition-colors", selectedUser.isActive ? "bg-[#10B981]" : "bg-slate-300")}
                    >
                      <div className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all", selectedUser.isActive ? "right-0.5" : "left-0.5")} />
                    </button>
                  </div>
                </div>

                {temporaryPassword && (
                  <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                    <div className="text-[10px] font-bold text-green-700 mb-1">Geçici Parola</div>
                    <div className="font-mono text-xs font-bold text-slate-900 break-all">{temporaryPassword}</div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold text-slate-500 mb-3">İşlemler</div>
                  <div className="space-y-2">
                    <button onClick={() => handleResetPassword(selectedUser)} disabled={actionLoading} className="w-full h-9 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                      <Lock className="w-3.5 h-3.5" /> Şifre Sıfırla
                    </button>
                    <button
                      onClick={() => handleToggleActive(selectedUser)}
                      disabled={actionLoading}
                      className={cn(
                        "w-full h-9 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm border",
                        selectedUser.isActive
                          ? "border-orange-200 text-orange-500 bg-orange-50/50 hover:bg-orange-50"
                          : "border-green-200 text-green-600 bg-green-50/50 hover:bg-green-50",
                      )}
                    >
                      {selectedUser.isActive ? "Askıya Al" : "Aktif Et"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("border border-slate-100 rounded-lg p-3 bg-slate-50/50", className)}>
      <div className="text-[10px] font-semibold text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

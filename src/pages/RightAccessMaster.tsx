import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  ChevronDown,
  ChevronRight,
  Lock,
  Save,
  RotateCcw,
  User,
  Check,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

interface UserOption {
  user_id: string;
  full_name: string;
  email: string;
  role_name: string;
  status: string;
}

interface ModuleDef {
  module_key: string;
  module_name: string;
  module_group: string;
  sort_order: number;
}

interface PermRow {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

type PermMap = Record<string, PermRow>;

const GROUP_LABELS: Record<string, string> = {
  core: 'Core',
  operations: 'Operations',
  masters: 'Masters',
  tools: 'Tools',
};

const GROUP_ORDER = ['core', 'operations', 'masters', 'tools'];

const EMPTY_PERM: PermRow = { can_view: false, can_create: false, can_edit: false, can_delete: false };

export function RightAccessMaster() {
  const { isAdmin, canView } = useAuth();

  const [users, setUsers] = useState<UserOption[]>([]);
  const [modules, setModules] = useState<ModuleDef[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [savedPerms, setSavedPerms] = useState<PermMap>({});
  const [draftPerms, setDraftPerms] = useState<PermMap>({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const hasChanges = JSON.stringify(draftPerms) !== JSON.stringify(savedPerms);

  useEffect(() => {
    loadUsers();
    loadModules();
  }, []);

  useEffect(() => {
    const u = users.find((u) => u.user_id === selectedUserId) ?? null;
    setSelectedUser(u);
    if (u) {
      loadPermissions(u.user_id);
    } else {
      setSavedPerms({});
      setDraftPerms({});
    }
  }, [selectedUserId, users]);

  async function loadUsers() {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`user_id, full_name, email, status, roles!user_profiles_role_id_fkey(role_name)`)
      .eq('status', 'active')
      .order('full_name');

    if (!error && data) {
      const mapped: UserOption[] = data.map((d: any) => ({
        user_id: d.user_id,
        full_name: d.full_name,
        email: d.email,
        role_name: d.roles?.role_name ?? '',
        status: d.status,
      }));
      setUsers(mapped);
    }
    setLoadingUsers(false);
  }

  async function loadModules() {
    const { data, error } = await supabase
      .from('modules')
      .select('module_key, module_name, module_group, sort_order')
      .order('module_group')
      .order('sort_order');

    if (!error && data) {
      setModules(data);
    }
  }

  async function loadPermissions(userId: string) {
    setLoadingPerms(true);
    const { data, error } = await supabase
      .from('user_module_permissions')
      .select('module_key, can_view, can_create, can_edit, can_delete')
      .eq('user_id', userId);

    if (!error && data) {
      const map: PermMap = {};
      for (const row of data) {
        map[row.module_key] = {
          can_view: row.can_view,
          can_create: row.can_create,
          can_edit: row.can_edit,
          can_delete: row.can_delete,
        };
      }
      setSavedPerms(map);
      setDraftPerms(map);
    }
    setLoadingPerms(false);
    setSaveStatus('idle');
  }

  const getPermForModule = useCallback(
    (moduleKey: string): PermRow => draftPerms[moduleKey] ?? { ...EMPTY_PERM },
    [draftPerms]
  );

  function setPermField(moduleKey: string, field: keyof PermRow, value: boolean) {
    setDraftPerms((prev) => {
      const current = prev[moduleKey] ?? { ...EMPTY_PERM };
      let updated = { ...current, [field]: value };
      if (field === 'can_view' && !value) {
        updated = { can_view: false, can_create: false, can_edit: false, can_delete: false };
      }
      return { ...prev, [moduleKey]: updated };
    });
    setSaveStatus('idle');
  }

  function setGroupField(group: string, field: keyof PermRow, value: boolean) {
    const groupModules = modules.filter((m) => m.module_group === group);
    setDraftPerms((prev) => {
      const next = { ...prev };
      for (const m of groupModules) {
        const current = next[m.module_key] ?? { ...EMPTY_PERM };
        let updated = { ...current, [field]: value };
        if (field === 'can_view' && !value) {
          updated = { can_view: false, can_create: false, can_edit: false, can_delete: false };
        }
        if (field !== 'can_view' && value && !current.can_view) {
          updated = { ...updated, can_view: true };
        }
        next[m.module_key] = updated;
      }
      return next;
    });
    setSaveStatus('idle');
  }

  function setAllField(field: keyof PermRow, value: boolean) {
    setDraftPerms((prev) => {
      const next = { ...prev };
      for (const m of modules) {
        const current = next[m.module_key] ?? { ...EMPTY_PERM };
        let updated = { ...current, [field]: value };
        if (field === 'can_view' && !value) {
          updated = { can_view: false, can_create: false, can_edit: false, can_delete: false };
        }
        if (field !== 'can_view' && value && !current.can_view) {
          updated = { ...updated, can_view: true };
        }
        next[m.module_key] = updated;
      }
      return next;
    });
    setSaveStatus('idle');
  }

  function handleReset() {
    setDraftPerms(savedPerms);
    setSaveStatus('idle');
  }

  async function handleSave() {
    if (!selectedUserId) return;
    setSaving(true);
    setSaveStatus('idle');

    const rows = modules.map((m) => ({
      user_id: selectedUserId,
      module_key: m.module_key,
      ...(draftPerms[m.module_key] ?? EMPTY_PERM),
    }));

    const { error } = await supabase
      .from('user_module_permissions')
      .upsert(rows, { onConflict: 'user_id,module_key' });

    if (error) {
      setSaveError(error.message);
      setSaveStatus('error');
    } else {
      setSavedPerms(draftPerms);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
    setSaving(false);
  }

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }

  function isGroupAllChecked(group: string, field: keyof PermRow) {
    const groupModules = modules.filter((m) => m.module_group === group);
    return groupModules.length > 0 && groupModules.every((m) => (draftPerms[m.module_key] ?? EMPTY_PERM)[field]);
  }

  function isAllChecked(field: keyof PermRow) {
    return modules.length > 0 && modules.every((m) => (draftPerms[m.module_key] ?? EMPTY_PERM)[field]);
  }

  if (!canView('right-access')) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <Lock className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Access Restricted</h2>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          You don't have permission to access the Right Access Master. Contact your administrator.
        </p>
      </div>
    );
  }

  const groupedModules = GROUP_ORDER.reduce<Record<string, ModuleDef[]>>((acc, g) => {
    acc[g] = modules.filter((m) => m.module_group === g);
    return acc;
  }, {});

  const isTargetAdmin = selectedUser?.role_name === 'Admin';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-sky-500" />
            Right Access Master
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Control module-level access for each user. Admin users always have full access.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Select User
        </label>
        {loadingUsers ? (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="">-- Select a user to manage permissions --</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.full_name} ({u.role_name})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )}

        {selectedUser && (
          <div className="mt-3 flex items-center gap-3 pt-3 border-t border-gray-100">
            <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sky-700 text-xs font-bold">
                {selectedUser.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{selectedUser.full_name}</p>
              <p className="text-xs text-gray-500">{selectedUser.email}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isTargetAdmin
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-sky-50 text-sky-700 border border-sky-200'
              }`}
            >
              {isTargetAdmin ? <Lock className="w-3 h-3" /> : <Users className="w-3 h-3" />}
              {selectedUser.role_name}
            </span>
          </div>
        )}
      </div>

      {selectedUser && isTargetAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Admin Full Access</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Admin users have unrestricted access to all modules by default. Module permissions cannot be configured for Admin users.
            </p>
          </div>
        </div>
      )}

      {selectedUser && !isTargetAdmin && (
        <>
          {loadingPerms ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {[1, 2, 3, 4].map((g) => (
                <div key={g} className="p-4 border-b border-gray-100 last:border-0 space-y-3">
                  <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
                  {[1, 2, 3].map((r) => (
                    <div key={r} className="h-9 bg-gray-50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center">
                <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Module</div>
                {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map((f) => (
                  <div key={f} className="w-20 text-center">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {f.replace('can_', '')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 bg-sky-50 border-b border-gray-200 flex items-center">
                <div className="flex-1 text-xs font-semibold text-sky-700">All Modules</div>
                {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map((f) => {
                  const checked = isAllChecked(f);
                  return (
                    <div key={f} className="w-20 flex justify-center">
                      <button
                        onClick={() => setAllField(f, !checked)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          checked
                            ? 'bg-sky-500 border-sky-500'
                            : 'border-gray-300 hover:border-sky-400 bg-white'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {GROUP_ORDER.map((group) => {
                const mods = groupedModules[group] ?? [];
                if (mods.length === 0) return null;
                const isCollapsed = collapsedGroups[group] ?? false;

                return (
                  <div key={group} className="border-b border-gray-100 last:border-0">
                    <div
                      className="px-5 py-2.5 flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleGroup(group)}
                    >
                      <div className="flex-1 flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                          {GROUP_LABELS[group]}
                        </span>
                        <span className="text-[10px] text-gray-400">({mods.length})</span>
                      </div>
                      {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map((f) => {
                        const checked = isGroupAllChecked(group, f);
                        return (
                          <div
                            key={f}
                            className="w-20 flex justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setGroupField(group, f, !checked);
                              }}
                              className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all ${
                                checked
                                  ? 'bg-gray-500 border-gray-500'
                                  : 'border-gray-300 hover:border-gray-500 bg-white'
                              }`}
                            >
                              {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {!isCollapsed && (
                      <div>
                        {mods.map((mod, idx) => {
                          const perm = getPermForModule(mod.module_key);
                          const isLast = idx === mods.length - 1;

                          return (
                            <div
                              key={mod.module_key}
                              className={`px-5 py-2.5 flex items-center hover:bg-gray-50 transition-colors ${
                                isLast ? '' : 'border-b border-gray-50'
                              }`}
                            >
                              <div className="flex-1 flex items-center gap-3 pl-5">
                                <span className="text-sm text-gray-700">{mod.module_name}</span>
                              </div>
                              {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map((f) => {
                                const isView = f === 'can_view';
                                const disabled = !isView && !perm.can_view;
                                const checked = perm[f];

                                return (
                                  <div key={f} className="w-20 flex justify-center">
                                    <button
                                      disabled={disabled}
                                      onClick={() => setPermField(mod.module_key, f, !checked)}
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                        disabled
                                          ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-40'
                                          : checked
                                          ? 'bg-sky-500 border-sky-500 hover:bg-sky-600'
                                          : 'border-gray-300 hover:border-sky-400 bg-white cursor-pointer'
                                      }`}
                                    >
                                      {checked && !disabled && (
                                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between gap-4 sticky bottom-0">
            <div className="flex-1">
              {saveStatus === 'success' && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Permissions saved successfully.</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{saveError || 'Failed to save permissions.'}</span>
                </div>
              )}
              {saveStatus === 'idle' && hasChanges && (
                <p className="text-xs text-amber-600 font-medium">You have unsaved changes.</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                disabled={!hasChanges || saving}
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                disabled={!hasChanges || saving}
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </>
      )}

      {!selectedUserId && !loadingUsers && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-16 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center">
            <Shield className="w-6 h-6 text-sky-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">Select a user above to configure their module permissions.</p>
          <p className="text-xs text-gray-400">Changes take effect immediately upon saving.</p>
        </div>
      )}
    </div>
  );
}

import { useState, ReactNode } from 'react';
import {
  LayoutDashboard,
  Wrench,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  DollarSign,
  Briefcase,
  Calendar,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

interface MainLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface ChildNavItem {
  id: string;
  label: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  children?: ChildNavItem[];
}

interface NavSection {
  label: string | null;
  items: NavItem[];
}

export function MainLayout({ children, currentPage, onNavigate }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const { profile, signOut, canView } = useAuth();

  const initials =
    profile?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const rawNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profitability', label: 'Profitability', icon: DollarSign },
    {
      id: 'operations',
      label: 'Operations',
      icon: Briefcase,
      children: [
        { id: 'enquiries', label: 'Enquiries' },
        { id: 'trips', label: 'Trips' },
        { id: 'truck-arrival', label: 'Truck Arrival' },
        { id: 'trip-expenses', label: 'Trip Expenses' },
        { id: 'lorry-receipt', label: 'Lorry Receipt' },
      ],
    },
    {
      id: 'masters',
      label: 'Masters',
      icon: Settings,
      children: [
        { id: 'vehicles', label: 'Vehicles' },
        { id: 'vehicle-types', label: 'Vehicle Types' },
        { id: 'vehicle-category', label: 'Vehicle Category' },
        { id: 'drivers', label: 'Drivers' },
        { id: 'routes', label: 'Routes' },
        { id: 'customers', label: 'Customers' },
        { id: 'vendors', label: 'Vendors' },
        { id: 'diesel-cards', label: 'Diesel Cards' },
        { id: 'fast-tags', label: 'Fast Tags' },
        { id: 'gst-master', label: 'GST Master' },
        { id: 'expense-heads', label: 'Expense Heads' },
        { id: 'city-master', label: 'City Master' },
        { id: 'documents', label: 'Vehicle Documents' },
        { id: 'users', label: 'Users' },
      ],
    },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'right-access', label: 'Right Access', icon: Shield },
  ];

  const navItems: NavItem[] = rawNavItems
    .map((item) => {
      if (item.children) {
        const visibleChildren = item.children.filter((c) => canView(c.id));
        if (visibleChildren.length === 0) return null;
        return { ...item, children: visibleChildren };
      }
      if (!canView(item.id)) return null;
      return item;
    })
    .filter(Boolean) as NavItem[];

  const navSections: NavSection[] = [
    {
      label: null,
      items: navItems.filter((i) => ['dashboard', 'profitability'].includes(i.id)),
    },
    {
      label: 'Operations',
      items: navItems.filter((i) => i.id === 'operations'),
    },
    {
      label: 'Masters',
      items: navItems.filter((i) => i.id === 'masters'),
    },
    {
      label: 'Tools',
      items: navItems.filter((i) => ['maintenance', 'reports', 'right-access'].includes(i.id)),
    },
  ].filter((s) => s.items.length > 0);

  const allItems = [...rawNavItems];
  const currentPageLabel =
    allItems.find((i) => i.id === currentPage)?.label ||
    allItems.flatMap((i) => i.children || []).find((c) => c.id === currentPage)?.label ||
    'Fleet Management';

  const parentSection = allItems.find((i) => i.children?.some((c) => c.id === currentPage));

  function handleNavClick(itemId: string) {
    if (navItems.find((item) => item.id === itemId && item.children)) {
      setExpandedMenu(expandedMenu === itemId ? null : itemId);
    } else {
      onNavigate(itemId);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-30 text-white flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out shadow-sidebar ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}
        style={{ background: '#0e1628' }}
      >
        <div className="flex flex-col h-full w-64">
          <div
            className="flex items-center justify-between px-5 py-[18px]"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <img src="/iceman.jpg" alt="Iceman" className="h-9 object-contain rounded" />
              <div>
                <p className="text-[13px] font-semibold text-slate-200 leading-tight tracking-tight">
                  Fleet Management
                </p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Iceman Logistics
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
            {navSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-6' : ''}>
                {section.label && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 px-3 mb-2">
                    {section.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    const isExpanded = expandedMenu === item.id;
                    const hasChildren = item.children && item.children.length > 0;
                    const hasActiveChild = item.children?.some((c) => c.id === currentPage);

                    return (
                      <div key={item.id}>
                        <button
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 text-sm ${
                            isActive || hasActiveChild
                              ? 'text-sky-300 font-medium'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          style={
                            isActive || hasActiveChild
                              ? { background: 'rgba(14,165,233,0.12)' }
                              : undefined
                          }
                          onMouseEnter={(e) => {
                            if (!isActive && !hasActiveChild) {
                              (e.currentTarget as HTMLButtonElement).style.background =
                                'rgba(255,255,255,0.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive && !hasActiveChild) {
                              (e.currentTarget as HTMLButtonElement).style.background = '';
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 flex-shrink-0 ${
                                isActive || hasActiveChild ? 'text-sky-400' : ''
                              }`}
                            />
                            <span className="text-[13px]">{item.label}</span>
                          </div>
                          {hasChildren && (
                            <ChevronDown
                              className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          )}
                        </button>

                        {hasChildren && isExpanded && (
                          <div
                            className="mt-0.5 ml-3 pl-3 space-y-0.5"
                            style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
                          >
                            {item.children!.map((child) => {
                              const isChildActive = currentPage === child.id;
                              return (
                                <button
                                  key={child.id}
                                  onClick={() => {
                                    onNavigate(child.id);
                                    if (window.innerWidth < 1024) setSidebarOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-md transition-all duration-150 text-[12.5px] ${
                                    isChildActive
                                      ? 'text-sky-300 font-medium'
                                      : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                  style={
                                    isChildActive
                                      ? { background: 'rgba(14,165,233,0.1)' }
                                      : undefined
                                  }
                                  onMouseEnter={(e) => {
                                    if (!isChildActive) {
                                      (e.currentTarget as HTMLButtonElement).style.background =
                                        'rgba(255,255,255,0.04)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isChildActive) {
                                      (e.currentTarget as HTMLButtonElement).style.background = '';
                                    }
                                  }}
                                >
                                  <span
                                    className={`w-1 h-1 rounded-full flex-shrink-0 ${
                                      isChildActive ? 'bg-sky-400' : 'bg-slate-600'
                                    }`}
                                  />
                                  {child.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div
            className="p-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                <span className="text-[11px] font-bold text-white">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-200 truncate leading-tight">
                  {profile?.full_name}
                </p>
                <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                  {profile?.role?.role_name}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 transition-all duration-150 text-[12.5px]"
              style={{ background: 'rgba(255,255,255,0.04)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-5 h-[60px] flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150"
            >
              <Menu className="w-[18px] h-[18px]" />
            </button>
            <div>
              {parentSection ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                    {parentSection.label}
                  </span>
                  <span className="text-gray-300 text-xs">/</span>
                  <span className="text-[14px] font-semibold text-gray-800">{currentPageLabel}</span>
                </div>
              ) : (
                <h1 className="text-[14px] font-semibold text-gray-800">{currentPageLabel}</h1>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[12px] font-medium text-gray-500">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 scrollbar-page">{children}</main>
      </div>
    </div>
  );
}

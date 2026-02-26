import { useState, ReactNode } from 'react';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  MapPin,
  Receipt,
  Wrench,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  UserCircle,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

interface MainLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  permission?: string;
  children?: { id: string; label: string }[];
}

export function MainLayout({ children, currentPage, onNavigate }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const { profile, signOut, hasPermission } = useAuth();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profitability', label: 'Profitability', icon: DollarSign },
    {
      id: 'operations',
      label: 'Operations',
      icon: Briefcase,
      permission: 'trips',
      children: [
        { id: 'enquiries', label: 'Enquiries' },
        { id: 'trips', label: 'Trips' },
        { id: 'trip-expenses', label: 'Trip Expenses' },
      ],
    },
    {
      id: 'masters',
      label: 'Masters',
      icon: Settings,
      children: [
        { id: 'vehicles', label: 'Vehicles' },
        { id: 'vehicle-types', label: 'Vehicle Types' },
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
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, permission: 'maintenance' },
    { id: 'reports', label: 'Reports', icon: FileText, permission: 'reports' },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission) || hasPermission('all');
  });

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
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <img
                src="/iceman.jpg"
                alt="Iceman Logo"
                className="h-12 object-contain"
              />
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <h2 className="text-sm font-medium text-slate-300">
              Fleet Management System
            </h2>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedMenu === item.id;
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      currentPage === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {hasChildren && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>

                  {hasChildren && isExpanded && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.children!.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => onNavigate(child.id)}
                          className={`w-full flex items-center px-4 py-2 rounded-lg text-sm transition-colors ${
                            currentPage === child.id
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <span className="ml-8">{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="border-t border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-4">
              <UserCircle className="w-10 h-10 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.full_name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {profile?.role?.role_name}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {navItems.find((item) => item.id === currentPage)?.label ||
                navItems
                  .flatMap((item) => item.children || [])
                  .find((child) => child.id === currentPage)?.label ||
                'Fleet Management'}
            </h1>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import {
  Truck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Fuel,
  AlertTriangle,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardKPIs {
  total_active_vehicles: number;
  vehicles_under_maintenance: number;
  vehicles_in_trip: number;
  vehicles_idle: number;
  total_trips: number;
  total_km: number;
  total_fuel_consumed: number;
  average_kmpl: number;
  total_revenue: number;
  total_cost: number;
  net_profit: number;
}

interface DocumentAlert {
  vehicle_number: string;
  document_type_name: string;
  valid_to: string;
  days_until_expiry: number;
  urgency_level: string;
}

interface DashboardProps {
  onNavigate?: (page: string, options?: { createEnquiry?: boolean }) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [alerts, setAlerts] = useState<DocumentAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [kpisResult, alertsResult] = await Promise.all([
        supabase.from('dashboard_kpis_view').select('*').maybeSingle(),
        supabase
          .from('document_expiry_alerts_view')
          .select('*')
          .order('days_until_expiry', { ascending: true })
          .limit(5),
      ]);

      if (kpisResult.data) setKpis(kpisResult.data);
      if (alertsResult.data) setAlerts(alertsResult.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'Expired':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Critical':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {kpis?.total_active_vehicles || 0}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Active Vehicles</h3>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="text-green-600 font-medium">
              {kpis?.vehicles_in_trip || 0} In Trip
            </span>
            <span className="text-gray-600">{kpis?.vehicles_idle || 0} Idle</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {kpis?.total_trips || 0}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Trips (This Month)</h3>
          <p className="mt-4 text-xs text-gray-600">
            {formatNumber(kpis?.total_km || 0)} KM covered
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(kpis?.total_revenue || 0)}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
          <p className="mt-4 text-xs text-gray-600">
            Cost: {formatCurrency(kpis?.total_cost || 0)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div
              className={`p-3 rounded-lg ${
                (kpis?.net_profit || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {(kpis?.net_profit || 0) >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
            <span
              className={`text-2xl font-bold ${
                (kpis?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(kpis?.net_profit || 0)}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Net Profit</h3>
          <p className="mt-4 text-xs text-gray-600">
            Margin:{' '}
            {kpis?.total_revenue
              ? ((kpis.net_profit / kpis.total_revenue) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Fuel Efficiency</h2>
            <Fuel className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Fuel Consumed</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatNumber(kpis?.total_fuel_consumed || 0)} L
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average KMPL</span>
              <span className="text-lg font-semibold text-gray-900">
                {(kpis?.average_kmpl || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Distance</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatNumber(kpis?.total_km || 0)} KM
              </span>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Fleet average is within normal range. Monitor individual vehicle performance
                for optimization opportunities.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Document Expiry Alerts</h2>
            <AlertTriangle className="w-6 h-6 text-orange-500" />
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No expiring documents in the next 90 days</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getUrgencyColor(alert.urgency_level)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{alert.vehicle_number}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-60">
                      {alert.urgency_level}
                    </span>
                  </div>
                  <p className="text-sm">{alert.document_type_name}</p>
                  <p className="text-xs mt-1">
                    {alert.days_until_expiry > 0
                      ? `Expires in ${alert.days_until_expiry} days`
                      : `Expired ${Math.abs(alert.days_until_expiry)} days ago`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate?.('enquiries', { createEnquiry: true })}
            className="flex items-center justify-between p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"
          >
            <div>
              <h3 className="font-semibold text-orange-900">Create New Enquiry</h3>
              <p className="text-sm text-orange-700 mt-1">Start a new enquiry</p>
            </div>
            <ArrowRight className="w-5 h-5 text-orange-600" />
          </button>
          <button className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
            <div>
              <h3 className="font-semibold text-blue-900">Create New Trip</h3>
              <p className="text-sm text-blue-700 mt-1">Start a new trip sheet</p>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-600" />
          </button>
          <button className="flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
            <div>
              <h3 className="font-semibold text-green-900">View Profitability</h3>
              <p className="text-sm text-green-700 mt-1">Truck-wise P&L analysis</p>
            </div>
            <ArrowRight className="w-5 h-5 text-green-600" />
          </button>
          <button className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
            <div>
              <h3 className="font-semibold text-slate-900">Generate Reports</h3>
              <p className="text-sm text-slate-700 mt-1">View MIS reports</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

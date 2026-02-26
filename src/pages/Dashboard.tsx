import { useEffect, useState } from 'react';
import {
  Truck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Fuel,
  AlertTriangle,
  ArrowRight,
  Package,
  Users,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  MapPin,
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

interface VehicleUtilization {
  vehicle_number: string;
  trip_count: number;
  total_km: number;
  total_revenue: number;
  utilization_percentage: number;
}

interface RevenueByCustomer {
  customer_name: string;
  trip_count: number;
  total_revenue: number;
  percentage: number;
}

interface TripStatusSummary {
  status: string;
  count: number;
  percentage: number;
}

interface RoutePerformance {
  origin: string;
  destination: string;
  trip_count: number;
  avg_distance: number;
  total_revenue: number;
}

interface DashboardProps {
  onNavigate?: (page: string, options?: { createEnquiry?: boolean }) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [alerts, setAlerts] = useState<DocumentAlert[]>([]);
  const [vehicleUtilization, setVehicleUtilization] = useState<VehicleUtilization[]>([]);
  const [revenueByCustomer, setRevenueByCustomer] = useState<RevenueByCustomer[]>([]);
  const [tripStatus, setTripStatus] = useState<TripStatusSummary[]>([]);
  const [routePerformance, setRoutePerformance] = useState<RoutePerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      await Promise.all([
        loadKPIs(),
        loadAlerts(),
        loadVehicleUtilization(),
        loadRevenueByCustomer(),
        loadTripStatus(),
        loadRoutePerformance(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadKPIs() {
    const { data } = await supabase.from('dashboard_kpis_view').select('*').maybeSingle();
    if (data) setKpis(data);
  }

  async function loadAlerts() {
    const { data } = await supabase
      .from('document_expiry_alerts_view')
      .select('*')
      .order('days_until_expiry', { ascending: true })
      .limit(5);
    if (data) setAlerts(data);
  }

  async function loadVehicleUtilization() {
    const { data: trips } = await supabase
      .from('trips')
      .select('vehicle_id, vehicle_number_text, actual_distance_km, freight_revenue, other_revenue')
      .not('vehicle_id', 'is', null)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (trips) {
      const vehicleMap = new Map<string, VehicleUtilization>();
      trips.forEach((trip) => {
        const key = trip.vehicle_number_text || 'Unknown';
        if (!vehicleMap.has(key)) {
          vehicleMap.set(key, {
            vehicle_number: key,
            trip_count: 0,
            total_km: 0,
            total_revenue: 0,
            utilization_percentage: 0,
          });
        }
        const vehicle = vehicleMap.get(key)!;
        vehicle.trip_count += 1;
        vehicle.total_km += Number(trip.actual_distance_km) || 0;
        vehicle.total_revenue += Number(trip.freight_revenue) + Number(trip.other_revenue) || 0;
      });

      const utilizationData = Array.from(vehicleMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);

      const maxRevenue = Math.max(...utilizationData.map(v => v.total_revenue));
      utilizationData.forEach(v => {
        v.utilization_percentage = maxRevenue > 0 ? (v.total_revenue / maxRevenue) * 100 : 0;
      });

      setVehicleUtilization(utilizationData);
    }
  }

  async function loadRevenueByCustomer() {
    const { data: trips } = await supabase
      .from('trips')
      .select(`
        customer_id,
        freight_revenue,
        other_revenue,
        customers (customer_name)
      `)
      .not('customer_id', 'is', null)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (trips) {
      const customerMap = new Map<string, RevenueByCustomer>();
      trips.forEach((trip: any) => {
        const customerName = trip.customers?.customer_name || 'Unknown';
        if (!customerMap.has(customerName)) {
          customerMap.set(customerName, {
            customer_name: customerName,
            trip_count: 0,
            total_revenue: 0,
            percentage: 0,
          });
        }
        const customer = customerMap.get(customerName)!;
        customer.trip_count += 1;
        customer.total_revenue += Number(trip.freight_revenue) + Number(trip.other_revenue) || 0;
      });

      const totalRevenue = Array.from(customerMap.values()).reduce((sum, c) => sum + c.total_revenue, 0);
      const revenueData = Array.from(customerMap.values())
        .map(c => ({
          ...c,
          percentage: totalRevenue > 0 ? (c.total_revenue / totalRevenue) * 100 : 0,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);

      setRevenueByCustomer(revenueData);
    }
  }

  async function loadTripStatus() {
    const { data: trips } = await supabase
      .from('trips')
      .select('trip_status')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (trips) {
      const statusMap = new Map<string, number>();
      trips.forEach((trip) => {
        const status = trip.trip_status || 'Unknown';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });

      const total = trips.length;
      const statusData = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }));

      setTripStatus(statusData);
    }
  }

  async function loadRoutePerformance() {
    const { data: trips } = await supabase
      .from('trips')
      .select('origin, destination, actual_distance_km, freight_revenue, other_revenue')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (trips) {
      const routeMap = new Map<string, RoutePerformance>();
      trips.forEach((trip) => {
        const routeKey = `${trip.origin}-${trip.destination}`;
        if (!routeMap.has(routeKey)) {
          routeMap.set(routeKey, {
            origin: trip.origin,
            destination: trip.destination,
            trip_count: 0,
            avg_distance: 0,
            total_revenue: 0,
          });
        }
        const route = routeMap.get(routeKey)!;
        route.trip_count += 1;
        route.avg_distance += Number(trip.actual_distance_km) || 0;
        route.total_revenue += Number(trip.freight_revenue) + Number(trip.other_revenue) || 0;
      });

      const routeData = Array.from(routeMap.values())
        .map(r => ({
          ...r,
          avg_distance: r.trip_count > 0 ? r.avg_distance / r.trip_count : 0,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);

      setRoutePerformance(routeData);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Closed':
        return 'bg-green-500';
      case 'In Transit':
        return 'bg-blue-500';
      case 'Planned':
        return 'bg-yellow-500';
      case 'Cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-600 mt-1">Last 30 days performance metrics</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {kpis?.total_active_vehicles || 0}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-3">Total Active Vehicles</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <Activity className="w-3 h-3" />
              {kpis?.vehicles_in_trip || 0} In Trip
            </span>
            <span className="text-gray-600">{kpis?.vehicles_idle || 0} Idle</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {kpis?.total_trips || 0}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-3">Total Trips</h3>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {formatNumber(kpis?.total_km || 0)} KM covered
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(kpis?.total_revenue || 0)}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-3">Total Revenue</h3>
          <p className="text-xs text-gray-600">
            Cost: {formatCurrency(kpis?.total_cost || 0)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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
          <h3 className="text-sm font-medium text-gray-600 mb-3">Net Profit</h3>
          <p className="text-xs text-gray-600">
            Margin:{' '}
            {kpis?.total_revenue
              ? ((kpis.net_profit / kpis.total_revenue) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Trip Status Breakdown</h2>
            <PieChart className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-3">
            {tripStatus.map((status, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{status.status}</span>
                  <span className="text-gray-600">{status.count} ({status.percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getStatusColor(status.status)}`}
                    style={{ width: `${status.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {tripStatus.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No trip data available</p>
              </div>
            )}
          </div>
        </div>

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
              <p className="text-sm">No expiring documents in the next 90 days</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getUrgencyColor(alert.urgency_level)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{alert.vehicle_number}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-60">
                      {alert.urgency_level}
                    </span>
                  </div>
                  <p className="text-xs">{alert.document_type_name}</p>
                  <p className="text-xs mt-0.5">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Top Vehicle Performance</h2>
            <BarChart3 className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            {vehicleUtilization.map((vehicle, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">{vehicle.vehicle_number}</span>
                    <span className="text-xs text-gray-500">({vehicle.trip_count} trips)</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(vehicle.total_revenue)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${vehicle.utilization_percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 w-16 text-right">{formatNumber(vehicle.total_km)} KM</span>
                </div>
              </div>
            ))}
            {vehicleUtilization.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No vehicle data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Revenue by Customer</h2>
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            {revenueByCustomer.map((customer, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">{customer.customer_name}</span>
                    <span className="text-xs text-gray-500">({customer.trip_count} trips)</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(customer.total_revenue)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${customer.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 w-12 text-right">{customer.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
            {revenueByCustomer.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No customer data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Top Routes by Revenue</h2>
          <MapPin className="w-6 h-6 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Route</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Trips</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Distance</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {routePerformance.map((route, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{route.origin}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">{route.destination}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">{route.trip_count}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{formatNumber(Math.round(route.avg_distance))} km</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(route.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {routePerformance.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No route data available</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate?.('enquiries', { createEnquiry: true })}
            className="flex items-center justify-between p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left group"
          >
            <div>
              <h3 className="font-semibold text-orange-900">Create New Enquiry</h3>
              <p className="text-sm text-orange-700 mt-1">Start a new enquiry</p>
            </div>
            <ArrowRight className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onNavigate?.('trips')}
            className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left group"
          >
            <div>
              <h3 className="font-semibold text-blue-900">Create New Trip</h3>
              <p className="text-sm text-blue-700 mt-1">Start a new trip sheet</p>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onNavigate?.('profitability')}
            className="flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left group"
          >
            <div>
              <h3 className="font-semibold text-green-900">View Profitability</h3>
              <p className="text-sm text-green-700 mt-1">Truck-wise P&L analysis</p>
            </div>
            <ArrowRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onNavigate?.('reports')}
            className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left group"
          >
            <div>
              <h3 className="font-semibold text-slate-900">Generate Reports</h3>
              <p className="text-sm text-slate-700 mt-1">View MIS reports</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Filter, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VehicleProfitability {
  vehicle_id: string;
  vehicle_number: string;
  vehicle_type: string;
  ownership_type: string;
  month: string;
  total_trips: number;
  total_km: number;
  total_revenue: number;
  total_variable_cost: number;
  total_fixed_cost: number;
  total_maintenance_cost: number;
  net_profit: number;
  profit_per_km: number;
  profit_per_trip: number;
}

export function ProfitabilityDashboard() {
  const [data, setData] = useState<VehicleProfitability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );
  const [ownershipFilter, setOwnershipFilter] = useState('All');

  useEffect(() => {
    loadProfitabilityData();
  }, [selectedMonth, ownershipFilter]);

  async function loadProfitabilityData() {
    setLoading(true);
    try {
      let query = supabase
        .from('vehicle_monthly_profitability_view')
        .select('*')
        .gte('month', `${selectedMonth}-01`)
        .lt('month', getNextMonth(selectedMonth));

      if (ownershipFilter !== 'All') {
        query = query.eq('ownership_type', ownershipFilter);
      }

      const { data: result, error } = await query.order('net_profit', {
        ascending: false,
      });

      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error('Error loading profitability:', error);
    } finally {
      setLoading(false);
    }
  }

  function getNextMonth(monthStr: string) {
    const date = new Date(monthStr + '-01');
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().substring(0, 7) + '-01';
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
  };

  const totalStats = {
    trips: data.reduce((sum, v) => sum + v.total_trips, 0),
    km: data.reduce((sum, v) => sum + v.total_km, 0),
    revenue: data.reduce((sum, v) => sum + v.total_revenue, 0),
    cost:
      data.reduce((sum, v) => sum + v.total_variable_cost, 0) +
      data.reduce((sum, v) => sum + v.total_fixed_cost, 0) +
      data.reduce((sum, v) => sum + v.total_maintenance_cost, 0),
    profit: data.reduce((sum, v) => sum + v.net_profit, 0),
  };

  const exportToCSV = () => {
    const headers = [
      'Vehicle Number',
      'Type',
      'Ownership',
      'Trips',
      'KM',
      'Revenue',
      'Variable Cost',
      'Fixed Cost',
      'Maintenance',
      'Net Profit',
      'Profit/KM',
      'Profit/Trip',
    ];

    const rows = data.map((v) => [
      v.vehicle_number,
      v.vehicle_type,
      v.ownership_type,
      v.total_trips,
      v.total_km.toFixed(2),
      v.total_revenue.toFixed(2),
      v.total_variable_cost.toFixed(2),
      v.total_fixed_cost.toFixed(2),
      v.total_maintenance_cost.toFixed(2),
      v.net_profit.toFixed(2),
      v.profit_per_km.toFixed(2),
      v.profit_per_trip.toFixed(2),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-profitability-${selectedMonth}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Vehicle-wise Profitability
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Detailed profit analysis for each vehicle
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={ownershipFilter}
              onChange={(e) => setOwnershipFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>All</option>
              <option>Owned</option>
              <option>Attached</option>
              <option>Market Vehicle</option>
            </select>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Trips</p>
          <p className="text-2xl font-bold text-gray-900">{totalStats.trips}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total KM</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(totalStats.km)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalStats.revenue)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalStats.cost)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Net Profit</p>
          <p
            className={`text-2xl font-bold ${
              totalStats.profit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(totalStats.profit)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trips
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KM
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Profit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit/KM
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No data available for the selected period
                  </td>
                </tr>
              ) : (
                data.map((vehicle) => {
                  const totalCost =
                    vehicle.total_variable_cost +
                    vehicle.total_fixed_cost +
                    vehicle.total_maintenance_cost;

                  return (
                    <tr
                      key={vehicle.vehicle_id + vehicle.month}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {vehicle.vehicle_number}
                          </div>
                          <div className="text-xs text-gray-500">
                            {vehicle.ownership_type}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {vehicle.vehicle_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                        {vehicle.total_trips}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatNumber(vehicle.total_km)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                        {formatCurrency(vehicle.total_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(totalCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {vehicle.net_profit >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span
                            className={`font-semibold ${
                              vehicle.net_profit >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(vehicle.net_profit)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(vehicle.profit_per_km)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

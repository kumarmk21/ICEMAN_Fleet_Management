import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth-context';
import { LoginPage } from './components/auth/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { ProfitabilityDashboard } from './pages/ProfitabilityDashboard';
import { EnquiriesList } from './pages/EnquiriesList';
import { TripsList } from './pages/TripsList';
import { TripExpensesList } from './pages/TripExpensesList';
import { VehiclesList } from './pages/VehiclesList';
import { VehicleTypesList } from './pages/VehicleTypesList';
import { DriversList } from './pages/DriversList';
import { RoutesList } from './pages/RoutesList';
import { CustomersList } from './pages/CustomersList';
import { VendorsList } from './pages/VendorsList';
import { DieselCardsList } from './pages/DieselCardsList';
import { FastTagsList } from './pages/FastTagsList';
import { GSTMasterList } from './pages/GSTMasterList';
import { ExpenseHeadsList } from './pages/ExpenseHeadsList';
import { CityMasterList } from './pages/CityMasterList';
import { VehicleDocumentsList } from './pages/VehicleDocumentsList';
import { MaintenanceList } from './pages/MaintenanceList';
import { ReportsList } from './pages/ReportsList';
import { UsersManagement } from './pages/UsersManagement';
import { VehicleCategoryMaster } from './pages/VehicleCategoryMaster';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [createEnquiry, setCreateEnquiry] = useState(false);
  const [convertEnquiryData, setConvertEnquiryData] = useState<any>(null);
  const [editTripData, setEditTripData] = useState<any>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleNavigate = (page: string, options?: { createEnquiry?: boolean; convertEnquiry?: any; editTrip?: any }) => {
    setCurrentPage(page);
    setCreateEnquiry(options?.createEnquiry || false);
    setConvertEnquiryData(options?.convertEnquiry || null);
    setEditTripData(options?.editTrip || null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'profitability':
        return <ProfitabilityDashboard />;
      case 'enquiries':
        return <EnquiriesList autoOpenCreate={createEnquiry} onNavigate={handleNavigate} />;
      case 'trips':
        return <TripsList convertEnquiryData={convertEnquiryData} editTripData={editTripData} />;
      case 'trip-expenses':
        return <TripExpensesList />;
      case 'vehicles':
        return <VehiclesList />;
      case 'vehicle-types':
        return <VehicleTypesList />;
      case 'drivers':
        return <DriversList />;
      case 'routes':
        return <RoutesList />;
      case 'customers':
        return <CustomersList />;
      case 'vendors':
        return <VendorsList />;
      case 'diesel-cards':
        return <DieselCardsList />;
      case 'fast-tags':
        return <FastTagsList />;
      case 'gst-master':
        return <GSTMasterList />;
      case 'expense-heads':
        return <ExpenseHeadsList />;
      case 'city-master':
        return <CityMasterList />;
      case 'documents':
        return <VehicleDocumentsList />;
      case 'maintenance':
        return <MaintenanceList />;
      case 'reports':
        return <ReportsList />;
      case 'users':
        return <UsersManagement />;
      case 'vehicle-category':
        return <VehicleCategoryMaster />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  const handleSimpleNavigate = (page: string) => {
    setCurrentPage(page);
    setCreateEnquiry(false);
    setConvertEnquiryData(null);
    setEditTripData(null);
  };

  return (
    <MainLayout currentPage={currentPage} onNavigate={handleSimpleNavigate}>
      {renderPage()}
    </MainLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

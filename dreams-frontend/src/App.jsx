import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Packages from './pages/Packages';
import PackageDetails from './pages/PackageDetails';
import BookingForm from './pages/BookingForm';
import Recommendations from './pages/Recommendations';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/Dashboard/ClientDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import ManagePackages from './pages/Dashboard/ManagePackages';
import CreatePackage from './pages/Dashboard/CreatePackage';
import EditPackage from './pages/Dashboard/EditPackage';
import ManageBookings from './pages/Dashboard/ManageBookings';
import ManageClients from './pages/Dashboard/ManageClients';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout><Home /></MainLayout>} />
          <Route path="/packages" element={<MainLayout><Packages /></MainLayout>} />
          <Route path="/packages/:id" element={<MainLayout><PackageDetails /></MainLayout>} />
          <Route 
            path="/booking/:packageId" 
            element={
              <MainLayout>
                <ProtectedRoute>
                  <BookingForm />
                </ProtectedRoute>
              </MainLayout>
            } 
          />
          <Route path="/recommendations" element={<MainLayout><Recommendations /></MainLayout>} />
          <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
          <Route path="/register" element={<MainLayout><Register /></MainLayout>} />
          <Route 
            path="/dashboard" 
            element={
              <MainLayout>
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              </MainLayout>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminLayout>
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/packages" 
            element={
              <AdminLayout>
                <ProtectedRoute requireAdmin>
                  <ManagePackages />
                </ProtectedRoute>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/packages/create" 
            element={
              <AdminLayout>
                <ProtectedRoute requireAdmin>
                  <CreatePackage />
                </ProtectedRoute>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/packages/:id/edit" 
            element={
              <AdminLayout>
                <ProtectedRoute requireAdmin>
                  <EditPackage />
                </ProtectedRoute>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/bookings" 
            element={
              <AdminLayout>
                <ProtectedRoute requireAdmin>
                  <ManageBookings />
                </ProtectedRoute>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/clients" 
            element={
              <AdminLayout>
                <ProtectedRoute requireAdmin>
                  <ManageClients />
                </ProtectedRoute>
              </AdminLayout>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;


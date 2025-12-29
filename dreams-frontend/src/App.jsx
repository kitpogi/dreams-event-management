import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/features';
import { MainLayout, AdminLayout } from './components/layout';
import { ErrorBoundary, Toaster } from './components/ui';
// Public pages
import Home from './pages/public/Home';
import Packages from './pages/public/Packages';
import Services from './pages/public/Services';
import Portfolio from './pages/public/Portfolio';
import Reviews from './pages/public/Reviews';
import PackageDetails from './pages/public/PackageDetails';
import BookingForm from './pages/public/BookingForm';
import Recommendations from './pages/public/Recommendations';
import SetAnEvent from './pages/public/SetAnEvent';
import ContactUs from './pages/public/ContactUs';
// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
// Client dashboard pages
import ClientDashboard from './pages/Dashboard/client/ClientDashboard';
import SubmitTestimonial from './pages/Dashboard/client/SubmitTestimonial';
// Admin dashboard pages
import AdminDashboard from './pages/Dashboard/admin/AdminDashboard';
import ManagePackages from './pages/Dashboard/admin/ManagePackages';
import CreatePackage from './pages/Dashboard/admin/CreatePackage';
import EditPackage from './pages/Dashboard/admin/EditPackage';
import ManageBookings from './pages/Dashboard/admin/ManageBookings';
import ManageClients from './pages/Dashboard/admin/ManageClients';
import ManageContactInquiries from './pages/Dashboard/admin/ManageContactInquiries';
import ManageVenues from './pages/Dashboard/admin/ManageVenues';
import ManagePortfolio from './pages/Dashboard/admin/ManagePortfolio';
import ManageTestimonials from './pages/Dashboard/admin/ManageTestimonials';
import AnalyticsDashboard from './pages/Dashboard/admin/AnalyticsDashboard';
import AdminBookingsCalendar from './pages/Dashboard/admin/AdminBookingsCalendar';
import AuditLogs from './pages/Dashboard/admin/AuditLogs';
// Test component for UI verification
import SpacingSystemTest from './components/test/SpacingSystemTest';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/" element={<MainLayout><Home /></MainLayout>} />
          <Route path="/services" element={<MainLayout><Services /></MainLayout>} />
          <Route path="/portfolio" element={<MainLayout><Portfolio /></MainLayout>} />
          <Route path="/reviews" element={<MainLayout><Reviews /></MainLayout>} />
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
          <Route path="/set-an-event" element={<MainLayout><SetAnEvent /></MainLayout>} />
          <Route path="/contact-us" element={<MainLayout><ContactUs /></MainLayout>} />
          <Route path="/test-spacing" element={<MainLayout><SpacingSystemTest /></MainLayout>} />
          <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
          <Route path="/register" element={<MainLayout><Register /></MainLayout>} />
          <Route path="/forgot-password" element={<MainLayout><ForgotPassword /></MainLayout>} />
          <Route path="/reset-password" element={<MainLayout><ResetPassword /></MainLayout>} />
          <Route path="/verify-email" element={<MainLayout><VerifyEmail /></MainLayout>} />
          <Route 
            path="/dashboard" 
            element={
              <MainLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute>
                    <ClientDashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              </MainLayout>
            } 
          />
          <Route 
            path="/dashboard/testimonial" 
            element={
              <MainLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute>
                    <SubmitTestimonial />
                  </ProtectedRoute>
                </ErrorBoundary>
              </MainLayout>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/packages" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <ManagePackages />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/packages/create" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <CreatePackage />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/packages/:id/edit" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <EditPackage />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/bookings" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <ManageBookings />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/bookings/calendar" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <AdminBookingsCalendar />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/clients" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <ManageClients />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/contact-inquiries" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <ManageContactInquiries />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/venues" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <ManageVenues />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/portfolio" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <ManagePortfolio />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/testimonials" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <ManageTestimonials />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/audit-logs" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <AuditLogs />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/analytics" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
        </Routes>
      </Router>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


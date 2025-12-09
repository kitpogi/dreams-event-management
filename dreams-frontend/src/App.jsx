import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/features';
import { MainLayout, AdminLayout } from './components/layout';
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
// Client dashboard pages
import ClientDashboard from './pages/dashboard/client/ClientDashboard';
import SubmitTestimonial from './pages/dashboard/client/SubmitTestimonial';
// Admin dashboard pages
import AdminDashboard from './pages/dashboard/admin/AdminDashboard';
import ManagePackages from './pages/dashboard/admin/ManagePackages';
import CreatePackage from './pages/dashboard/admin/CreatePackage';
import EditPackage from './pages/dashboard/admin/EditPackage';
import ManageBookings from './pages/dashboard/admin/ManageBookings';
import ManageClients from './pages/dashboard/admin/ManageClients';
import ManageContactInquiries from './pages/dashboard/admin/ManageContactInquiries';
import ManageVenues from './pages/dashboard/admin/ManageVenues';
import ManagePortfolio from './pages/dashboard/admin/ManagePortfolio';
import ManageTestimonials from './pages/dashboard/admin/ManageTestimonials';

function App() {
  return (
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
            path="/dashboard/testimonial" 
            element={
              <MainLayout>
                <ProtectedRoute>
                  <SubmitTestimonial />
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
          <Route 
            path="/admin/contact-inquiries" 
            element={
              <AdminLayout>
                <ProtectedRoute requireAdmin>
                  <ManageContactInquiries />
                </ProtectedRoute>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/venues" 
            element={
              <AdminLayout>
                <ProtectedRoute requireAdmin>
                  <ManageVenues />
                </ProtectedRoute>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/portfolio" 
            element={
              <AdminLayout>
                <ProtectedRoute requireAdmin>
                  <ManagePortfolio />
                </ProtectedRoute>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/testimonials" 
            element={
              <AdminLayout>
                <ProtectedRoute requireAdmin>
                  <ManageTestimonials />
                </ProtectedRoute>
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
    </AuthProvider>
  );
}

export default App;


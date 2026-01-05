import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
// SidebarProvider available but not currently used in App.jsx
// import { SidebarProvider } from './context/SidebarContext';
import { ProtectedRoute } from './components/features';
import { MainLayout, AdminLayout } from './components/layout';
import { ErrorBoundary, Toaster, LazyRoute } from './components/ui';
// Lazy-loaded routes
import * as LazyRoutes from './routes/lazyRoutes';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
        <Routes>
          <Route path="/" element={<MainLayout><LazyRoute component={LazyRoutes.Home} /></MainLayout>} />
          <Route path="/services" element={<MainLayout><LazyRoute component={LazyRoutes.Services} /></MainLayout>} />
          <Route path="/portfolio" element={<MainLayout><LazyRoute component={LazyRoutes.Portfolio} /></MainLayout>} />
          <Route path="/reviews" element={<MainLayout><LazyRoute component={LazyRoutes.Reviews} /></MainLayout>} />
          <Route path="/packages" element={<MainLayout><LazyRoute component={LazyRoutes.Packages} /></MainLayout>} />
          <Route path="/packages/:id" element={<MainLayout><LazyRoute component={LazyRoutes.PackageDetails} /></MainLayout>} />
          <Route 
            path="/booking/:packageId" 
            element={
              <MainLayout>
                <ProtectedRoute>
                  <LazyRoute component={LazyRoutes.BookingForm} />
                </ProtectedRoute>
              </MainLayout>
            } 
          />
          <Route 
            path="/booking-confirmation/:bookingId" 
            element={
              <MainLayout>
                <ProtectedRoute>
                  <LazyRoute component={LazyRoutes.BookingConfirmation} />
                </ProtectedRoute>
              </MainLayout>
            } 
          />
          <Route path="/recommendations" element={<MainLayout><LazyRoute component={LazyRoutes.Recommendations} /></MainLayout>} />
          <Route path="/set-an-event" element={<MainLayout><LazyRoute component={LazyRoutes.SetAnEvent} /></MainLayout>} />
          <Route path="/contact-us" element={<MainLayout><LazyRoute component={LazyRoutes.ContactUs} /></MainLayout>} />
          <Route path="/favorites" element={<MainLayout><LazyRoute component={LazyRoutes.Favorites} /></MainLayout>} />
          <Route path="/test-spacing" element={<MainLayout><LazyRoute component={LazyRoutes.SpacingSystemTest} /></MainLayout>} />
          <Route path="/login" element={<MainLayout><LazyRoute component={LazyRoutes.Login} /></MainLayout>} />
          <Route path="/register" element={<MainLayout><LazyRoute component={LazyRoutes.Register} /></MainLayout>} />
          <Route path="/forgot-password" element={<MainLayout><LazyRoute component={LazyRoutes.ForgotPassword} /></MainLayout>} />
          <Route path="/reset-password" element={<MainLayout><LazyRoute component={LazyRoutes.ResetPassword} /></MainLayout>} />
          <Route path="/verify-email" element={<MainLayout><LazyRoute component={LazyRoutes.VerifyEmail} /></MainLayout>} />
          <Route 
            path="/dashboard" 
            element={
              <MainLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute>
                    <LazyRoute component={LazyRoutes.ClientDashboard} />
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
                    <LazyRoute component={LazyRoutes.SubmitTestimonial} />
                  </ProtectedRoute>
                </ErrorBoundary>
              </MainLayout>
            } 
          />
          <Route 
            path="/profile/settings" 
            element={
              <MainLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute>
                    <LazyRoute component={LazyRoutes.ProfileSettings} />
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
                    <LazyRoute component={LazyRoutes.AdminDashboard} />
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
                    <LazyRoute component={LazyRoutes.ManagePackages} />
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
                    <LazyRoute component={LazyRoutes.CreatePackage} />
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
                    <LazyRoute component={LazyRoutes.EditPackage} />
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
                    <LazyRoute component={LazyRoutes.ManageBookings} />
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
                    <LazyRoute component={LazyRoutes.AdminBookingsCalendar} />
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
                    <LazyRoute component={LazyRoutes.ManageClients} />
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
                    <LazyRoute component={LazyRoutes.ManageContactInquiries} />
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
                    <LazyRoute component={LazyRoutes.ManageVenues} />
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
                    <LazyRoute component={LazyRoutes.ManagePortfolio} />
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
                    <LazyRoute component={LazyRoutes.ManageTestimonials} />
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
                    <LazyRoute component={LazyRoutes.AuditLogs} />
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
                    <LazyRoute component={LazyRoutes.AnalyticsDashboard} />
                  </ProtectedRoute>
                </ErrorBoundary>
              </AdminLayout>
            } 
          />
          <Route 
            path="/admin/profile/settings" 
            element={
              <AdminLayout>
                <ErrorBoundary showContact>
                  <ProtectedRoute requireAdmin>
                    <LazyRoute component={LazyRoutes.ProfileSettings} />
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


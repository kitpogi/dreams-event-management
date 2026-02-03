import React, { lazy } from 'react';

// Public pages - lazy loaded
export const Home = lazy(() => import('../pages/public/Home'));
export const Packages = lazy(() => import('../pages/public/Packages'));
export const Services = lazy(() => import('../pages/public/Services'));
export const Portfolio = lazy(() => import('../pages/public/Portfolio'));
export const Reviews = lazy(() => import('../pages/public/Reviews'));
export const PackageDetails = lazy(() => import('../pages/public/PackageDetails'));
export const BookingForm = lazy(() => import('../pages/public/BookingForm'));
export const BookingConfirmation = lazy(() => import('../pages/public/BookingConfirmation'));
export const Recommendations = lazy(() => import('../pages/public/Recommendations'));
export const SetAnEvent = lazy(() => import('../pages/public/SetAnEvent'));
export const ContactUs = lazy(() => import('../pages/public/ContactUs'));
export const Favorites = lazy(() => import('../pages/public/Favorites'));

// Auth pages - lazy loaded
export const Login = lazy(() => import('../pages/auth/Login'));
export const Register = lazy(() => import('../pages/auth/Register'));
export const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
export const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
export const VerifyEmail = lazy(() => import('../pages/auth/VerifyEmail'));
export const FacebookCallback = lazy(() => import('../pages/auth/FacebookCallback'));

// Client dashboard pages - lazy loaded
export const ClientDashboard = lazy(() => import('../pages/Dashboard/client/ClientDashboard'));
export const ClientBookings = lazy(() => import('../pages/Dashboard/client/ClientBookings'));
export const ClientRecommendations = lazy(() => import('../pages/Dashboard/client/ClientRecommendations'));
export const ClientPackages = lazy(() => import('../pages/Dashboard/client/ClientPackages'));
export const ClientReviews = lazy(() => import('../pages/Dashboard/client/ClientReviews'));
export const ClientPayments = lazy(() => import('../pages/Dashboard/client/ClientPayments'));
export const SubmitTestimonial = lazy(() => import('../pages/Dashboard/client/SubmitTestimonial'));
export const ProfileSettings = lazy(() => import('../pages/Dashboard/client/ProfileSettings'));

// Payment pages - lazy loaded
export const PaymentConfirmation = lazy(() => import('../pages/Payment/PaymentConfirmation'));

// Admin dashboard pages - lazy loaded
export const AdminDashboard = lazy(() => import('../pages/Dashboard/admin/AdminDashboard'));
export const ManagePackages = lazy(() => import('../pages/Dashboard/admin/ManagePackages'));
export const CreatePackage = lazy(() => import('../pages/Dashboard/admin/CreatePackage'));
export const EditPackage = lazy(() => import('../pages/Dashboard/admin/EditPackage'));
export const ManageBookings = lazy(() => import('../pages/Dashboard/admin/ManageBookings'));
export const ManageClients = lazy(() => import('../pages/Dashboard/admin/ManageClients'));
export const ManageContactInquiries = lazy(() => import('../pages/Dashboard/admin/ManageContactInquiries'));
export const ManageVenues = lazy(() => import('../pages/Dashboard/admin/ManageVenues'));
export const ManagePortfolio = lazy(() => import('../pages/Dashboard/admin/ManagePortfolio'));
export const ManageServices = lazy(() => import('../pages/Dashboard/admin/ManageServices'));
export const ManageTestimonials = lazy(() => import('../pages/Dashboard/admin/ManageTestimonials'));
export const ManageTeam = lazy(() => import('../pages/Dashboard/admin/ManageTeam'));
export const AnalyticsDashboard = lazy(() => import('../pages/Dashboard/admin/AnalyticsDashboard'));
export const AdminBookingsCalendar = lazy(() => import('../pages/Dashboard/admin/AdminBookingsCalendar'));
export const AuditLogs = lazy(() => import('../pages/Dashboard/admin/AuditLogs'));

// Test component
export const SpacingSystemTest = lazy(() => import('../components/test/SpacingSystemTest'));


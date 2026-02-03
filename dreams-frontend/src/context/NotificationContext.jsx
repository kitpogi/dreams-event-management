import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotificationCounts = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationCounts must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { isAuthenticated, isAdmin, isCoordinator } = useAuth();
    const [counts, setCounts] = useState({
        pendingBookings: 0,
        newInquiries: 0,
        upcomingEvents: 0,
        unassignedBookings: 0,
    });
    const [loading, setLoading] = useState(false);

    const isAdminUser = isAdmin || isCoordinator;

    const fetchCounts = useCallback(async () => {
        if (!isAuthenticated || !isAdminUser) {
            setCounts({
                pendingBookings: 0,
                newInquiries: 0,
                upcomingEvents: 0,
                unassignedBookings: 0,
            });
            return;
        }

        try {
            setLoading(true);
            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            // Fetch bookings
            const bookingsResponse = await api.get('/bookings');
            const bookings = bookingsResponse.data.data || bookingsResponse.data || [];

            // Count pending bookings
            const pendingBookings = bookings.filter(
                (b) => (b.booking_status || b.status || '').toLowerCase() === 'pending'
            ).length;

            // Count unassigned bookings (approved but no coordinator)
            const unassignedBookings = bookings.filter(
                (b) =>
                    !b.coordinator_id &&
                    (b.booking_status || b.status || '').toLowerCase() !== 'cancelled' &&
                    (b.booking_status || b.status || '').toLowerCase() !== 'pending'
            ).length;

            // Count upcoming events (within 7 days)
            const upcomingEvents = bookings.filter((b) => {
                if (!b.event_date) return false;
                const eventDate = new Date(b.event_date);
                return (
                    eventDate >= now &&
                    eventDate <= nextWeek &&
                    (b.booking_status || b.status || '').toLowerCase() !== 'cancelled'
                );
            }).length;

            // Fetch contact inquiries
            let newInquiries = 0;
            try {
                const inquiriesResponse = await api.get('/contact-inquiries');
                const data = inquiriesResponse.data.data || {};

                if (data.new_inquiries && Array.isArray(data.new_inquiries)) {
                    newInquiries = data.new_inquiries.length;
                } else if (data.all_inquiries && Array.isArray(data.all_inquiries)) {
                    newInquiries = data.all_inquiries.filter(
                        (inq) => (inq.status || '').toLowerCase() === 'new' && !inq.is_old
                    ).length;
                } else if (Array.isArray(data)) {
                    newInquiries = data.filter(
                        (inq) => (inq.status || '').toLowerCase() === 'new'
                    ).length;
                }
            } catch (error) {
                if (error.response?.status !== 401) {
                    console.error('Error fetching inquiries for count:', error);
                }
            }

            setCounts({
                pendingBookings,
                newInquiries,
                upcomingEvents,
                unassignedBookings,
            });
        } catch (error) {
            if (error.response?.status !== 401) {
                console.error('Error fetching notification counts:', error);
            }
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, isAdminUser]);

    // Fetch counts on mount and when auth changes
    useEffect(() => {
        fetchCounts();

        // Refresh every 30 seconds
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, [fetchCounts]);

    // Manual refresh function
    const refreshCounts = useCallback(() => {
        fetchCounts();
    }, [fetchCounts]);

    return (
        <NotificationContext.Provider
            value={{
                counts,
                loading,
                refreshCounts,
                totalActionRequired: counts.pendingBookings + counts.newInquiries,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;

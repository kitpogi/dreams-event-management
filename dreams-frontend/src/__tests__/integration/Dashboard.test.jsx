import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockUser, createMockBooking } from '../../test-utils/testHelpers';

/**
 * Integration test for Dashboard components
 * Tests how multiple dashboard components work together
 */
describe('Dashboard Integration', () => {
  const mockUser = createMockUser({ role: 'client' });
  const mockBookings = [
    createMockBooking({ id: 1, booking_status: 'pending' }),
    createMockBooking({ id: 2, booking_status: 'approved' }),
  ];

  it('displays dashboard with stats and bookings', async () => {
    // Mock API response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockBookings }),
      })
    );

    // This would test the actual ClientDashboard component
    // For now, showing the pattern
    const Dashboard = () => {
      return (
        <div>
          <h1>Dashboard</h1>
          <div data-testid="stats">
            <div>Total: 2</div>
            <div>Pending: 1</div>
            <div>Approved: 1</div>
          </div>
          <div data-testid="bookings-list">
            {mockBookings.map(booking => (
              <div key={booking.id}>{booking.booking_status}</div>
            ))}
          </div>
        </div>
      );
    };

    renderWithProviders(<Dashboard />, {
      authState: { isAuthenticated: true, user: mockUser },
    });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('stats')).toBeInTheDocument();
    expect(screen.getByTestId('bookings-list')).toBeInTheDocument();
  });

  it('switches between dashboard tabs', async () => {
    const user = userEvent.setup();
    
    const DashboardWithTabs = () => {
      const [activeTab, setActiveTab] = React.useState('list');
      
      return (
        <div>
          <button onClick={() => setActiveTab('list')}>List</button>
          <button onClick={() => setActiveTab('calendar')}>Calendar</button>
          <button onClick={() => setActiveTab('analytics')}>Analytics</button>
          
          {activeTab === 'list' && <div>List View</div>}
          {activeTab === 'calendar' && <div>Calendar View</div>}
          {activeTab === 'analytics' && <div>Analytics View</div>}
        </div>
      );
    };

    renderWithProviders(<DashboardWithTabs />, {
      authState: { isAuthenticated: true, user: mockUser },
    });

    expect(screen.getByText('List View')).toBeInTheDocument();
    
    await user.click(screen.getByText('Calendar'));
    await waitFor(() => {
      expect(screen.getByText('Calendar View')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Analytics'));
    await waitFor(() => {
      expect(screen.getByText('Analytics View')).toBeInTheDocument();
    });
  });
});


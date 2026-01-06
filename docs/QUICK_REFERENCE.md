# Quick Reference Guide - New Structure

## 📚 Documentation

- **[Vercel Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md)** - Complete guide for deploying to Vercel
- [System Analysis](./SYSTEM_ANALYSIS.md) - System architecture and design
- [Payment Flow](./PAYMENT_FLOW.md) - Payment integration details
- [Quick Fixes Guide](./QUICK_FIXES_GUIDE.md) - Common issues and solutions

## 🚀 Quick Import Examples

### Components

```javascript
// Layout components
import { MainLayout, AdminLayout, Navbar, Footer } from "./components/layout";
import { AdminSidebar } from "./components/layout";

// UI components
import { Button, Input, Card, LoadingSpinner } from "./components/ui";

// Feature components
import { PackageCard, ProtectedRoute } from "./components/features";
```

### API Services

```javascript
// Import all services
import {
  authService,
  packageService,
  bookingService,
  clientService,
} from "./api/services";

// Or import individually
import { packageService } from "./api/services/packageService";
```

### Hooks

```javascript
import { useApi, useDebounce, useLocalStorage } from "./hooks";
```

### Pages

```javascript
// Public pages
import Home from "./pages/public/Home";
import Packages from "./pages/public/Packages";

// Auth pages
import Login from "./pages/auth/Login";

// Dashboard pages
import ClientDashboard from "./pages/dashboard/client/ClientDashboard";
import AdminDashboard from "./pages/dashboard/admin/AdminDashboard";
```

## 📝 Common Patterns

### Using API Services

```javascript
// Before
import api from "../api/axios";
const response = await api.get("/packages");

// After
import { packageService } from "../api/services";
const response = await packageService.getAll();
```

### Using Custom Hooks

```javascript
import { useApi } from "../hooks";
import { packageService } from "../api/services";

const MyComponent = () => {
  const { data, loading, error } = useApi(() => packageService.getAll(), []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* render data */}</div>;
};
```

### Component Structure

```javascript
import { MainLayout } from "../components/layout";
import { Button, Card } from "../components/ui";
import { packageService } from "../api/services";

const MyPage = () => {
  // Component logic
  return (
    <MainLayout>
      <Card>
        <Button>Click me</Button>
      </Card>
    </MainLayout>
  );
};
```

## 🔗 Backend API Endpoints

### New Endpoints

- `GET /api/clients` - Get all clients (Admin)
- `GET /api/clients/{id}` - Get client details (Admin)

### Using Services in Backend

```php
// In Controller
use App\Services\ClientService;

class BookingController extends Controller
{
    protected $clientService;

    public function __construct(ClientService $clientService)
    {
        $this->clientService = $clientService;
    }

    public function store(Request $request)
    {
        $client = $this->clientService->findOrCreateFromUser($request->user());
        // ...
    }
}
```

## 📂 Directory Quick Look

```
dreams-frontend/src/
├── api/services/     → All API service functions
├── components/
│   ├── layout/       → Layout components
│   ├── ui/           → Reusable UI components
│   └── features/     → Feature-specific components
├── pages/
│   ├── public/       → Public pages
│   ├── auth/         → Auth pages
│   └── dashboard/    → Dashboard pages
└── hooks/            → Custom React hooks
```

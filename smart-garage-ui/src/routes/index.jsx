import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import Users from '../pages/Users/Users';
import Vehicles from '../pages/Vehicles/Vehicles';
import Mechanics from '../pages/Mechanics/Mechanics';
import Services from '../pages/Services/Services';
import Branches from '../pages/Branches/Branches';
import Bookings from '../pages/Bookings/Bookings';
import Invoices from '../pages/Invoices/Invoices';
import Parts from '../pages/Parts/Parts';
import Settings from '../pages/Settings/Settings';
import Login from '../pages/Login/Login';
import Chats from '../pages/Chats/Chats';
import authService from '../services/authService';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },  
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
            {
              index: true,
              element: <Navigate to="/admin/dashboard" replace />,
            },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'bookings',
        element: <Bookings />,
      },
      {
        path: 'invoices',
        element: <Invoices />,
      },
      {
        path: 'vehicles',
        element: <Vehicles />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'mechanics',
        element: <Mechanics />,
      },
      {
        path: 'services',
        element: <Services />,
      },
      {
        path: 'parts',
        element: <Parts />,
      },
      {
        path: 'branches',
        element: <Branches />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'chats',
        element: <Chats />,
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;

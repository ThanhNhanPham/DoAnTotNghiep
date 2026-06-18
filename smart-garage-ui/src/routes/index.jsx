import { useEffect, useState } from 'react';
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
import BranchSettings from '../pages/BranchSettings/BranchSettings';
import Login from '../pages/Login/Login';
import Chats from '../pages/Chats/Chats';
import Unauthorized from '../pages/Unauthorized/Unauthorized';
import authService from '../services/authService';
import { ADMIN_ROLES, ADMIN_ROUTE_PERMISSIONS, getFirstAllowedAdminPath } from '../config/permissions';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const [isRestoring, setIsRestoring] = useState(() =>
    authService.isAuthenticated() && !authService.hasCompleteAdminSession()
  );

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      if (!authService.isAuthenticated() || authService.hasCompleteAdminSession()) {
        setIsRestoring(false);
        return;
      }

      try {
        await authService.restoreSession();
      } catch {
        authService.logout();
      } finally {
        if (isMounted) {
          setIsRestoring(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isRestoring) {
    return null;
  }

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !authService.hasAnyRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const PermissionRoute = ({ path, children }) => (
  <ProtectedRoute allowedRoles={ADMIN_ROUTE_PERMISSIONS[path]}>{children}</ProtectedRoute>
);

const AdminIndexRedirect = () => <Navigate to={getFirstAllowedAdminPath(authService.getUserRole())} replace />;

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={ADMIN_ROLES}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminIndexRedirect />,
      },
      {
        path: 'dashboard',
        element: <PermissionRoute path="/admin/dashboard"><Dashboard /></PermissionRoute>,
      },
      {
        path: 'bookings',
        element: <PermissionRoute path="/admin/bookings"><Bookings /></PermissionRoute>,
      },
      {
        path: 'invoices',
        element: <PermissionRoute path="/admin/invoices"><Invoices /></PermissionRoute>,
      },
      {
        path: 'vehicles',
        element: <PermissionRoute path="/admin/vehicles"><Vehicles /></PermissionRoute>,
      },
      {
        path: 'users',
        element: <PermissionRoute path="/admin/users"><Users /></PermissionRoute>,
      },
      {
        path: 'mechanics',
        element: <PermissionRoute path="/admin/mechanics"><Mechanics /></PermissionRoute>,
      },
      {
        path: 'services',
        element: <PermissionRoute path="/admin/services"><Services /></PermissionRoute>,
      },
      {
        path: 'parts',
        element: <PermissionRoute path="/admin/parts"><Parts /></PermissionRoute>,
      },
      {
        path: 'branches',
        element: <PermissionRoute path="/admin/branches"><Branches /></PermissionRoute>,
      },
      {
        path: 'settings',
        element: <PermissionRoute path="/admin/settings"><Settings /></PermissionRoute>,
      },
      {
        path: 'branch-settings',
        element: <PermissionRoute path="/admin/branch-settings"><BranchSettings /></PermissionRoute>,
      },
      {
        path: 'chats',
        element: <PermissionRoute path="/admin/chats"><Chats /></PermissionRoute>,
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;

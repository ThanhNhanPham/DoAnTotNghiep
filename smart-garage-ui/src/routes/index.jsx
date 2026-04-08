import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import Users from '../pages/Users/Users';
import Motorbikes from '../pages/Motorbikes/Motorbikes';
import Mechanics from '../pages/Mechanics/Mechanics';
import Services from '../pages/Services/Services';
import Branches from '../pages/Branches/Branches';
import Bookings from '../pages/Bookings/Bookings';
import Parts from '../pages/Parts/Parts';

// Placeholder components - tạo các trang này sau
const Settings = () => <div style={{ padding: 24 }}><h2>Cài đặt hệ thống</h2></div>;

const router = createBrowserRouter([
  {
    path: '/admin',
    element: <MainLayout />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'bookings',
        element: <Bookings />,
      },
      {
        path: 'motorbikes',
        element: <Motorbikes />,
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
    ],
  },
  {
    path: '/',
    element: <div>Redirect to /admin/dashboard</div>,
  },
]);

export default router;

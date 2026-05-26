import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Calendar,
  Car,
  Package,
  FileText,
  ReceiptText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  MessageSquare
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/bookings', icon: Calendar, label: 'Đặt lịch' },
    { path: '/admin/invoices', icon: ReceiptText, label: 'Quản lý hoá đơn' },
    { path: '/admin/users', icon: Users, label: 'Quản lý Tài khoản' },
    { path: '/admin/mechanics', icon: Wrench, label: 'Thợ sửa xe' },
    { path: '/admin/vehicles', icon: Car, label: 'Phương tiện' },
    { path: '/admin/services', icon: FileText, label: 'Dịch vụ' },
    { path: '/admin/parts', icon: Package, label: 'Phụ tùng' },
    { path: '/admin/branches', icon: Store, label: 'Chi nhánh' },
    { path: '/admin/chats', icon: MessageSquare, label: 'Chat khách hàng' },
    { path: '/admin/settings', icon: Settings, label: 'Cài đặt' },
  ];

  const mainMenuItems = menuItems.slice(0, -1);
  const utilityMenuItems = menuItems.slice(-1);
  const isActive = (path) => location.pathname === path;

  const renderNavItem = (item) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
        title={collapsed ? item.label : ''}
      >
        <Icon size={20} className="nav-icon" />
        {!collapsed && <span className="nav-label">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-brand">
            <div className="brand-mark">SG</div>
            <div>
              <h2 className="sidebar-title">Smart Garage</h2>
              <span>Admin Center</span>
            </div>
          </div>
        )}
        {collapsed && <div className="brand-mark compact">SG</div>}
        <button className="toggle-btn" onClick={onToggle}>
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">Quản trị</div>}
        {mainMenuItems.map(renderNavItem)}
        <div className="nav-spacer" />
        {!collapsed && <div className="nav-section-label">Hệ thống</div>}
        {utilityMenuItems.map(renderNavItem)}
      </nav>
    </aside>
  );
};

export default Sidebar;

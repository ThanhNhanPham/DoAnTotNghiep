import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Calendar,
  Car,
  Package,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/bookings', icon: Calendar, label: 'Đặt lịch' },
    { path: '/admin/users', icon: Users, label: 'Người dùng' },
    { path: '/admin/mechanics', icon: Wrench, label: 'Thợ sửa xe' },
    { path: '/admin/motorbikes', icon: Car, label: 'Xe máy' },
    { path: '/admin/services', icon: FileText, label: 'Dịch vụ' },
    { path: '/admin/parts', icon: Package, label: 'Phụ tùng' },
    { path: '/admin/branches', icon: Store, label: 'Chi nhánh' },
    { path: '/admin/settings', icon: Settings, label: 'Cài đặt' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h2 className="sidebar-title">Smart Garage</h2>}
        <button className="toggle-btn" onClick={onToggle}>
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
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
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

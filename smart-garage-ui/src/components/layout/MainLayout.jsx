import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './MainLayout.css';

const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMobileMenu = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="admin-layout">
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="mobile-overlay" 
          onClick={handleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar-wrapper ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={handleToggleSidebar}
        />
      </div>

      {/* Main Content */}
      <div className={`main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Header 
          onMenuClick={handleMobileMenu}
        />
        
        <main className="main-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>

        <footer className="main-footer">
          <div className="footer-content">
            <span>© 2026 Smart Garage. All rights reserved.</span>
            <div className="footer-links">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#support">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
import { useState } from 'react';
import { Bell, Search, User, LogOut, Settings, Menu } from 'lucide-react';
import { Dropdown } from 'antd';
import './Header.css';

const Header = ({ onMenuClick }) => {
  const [searchValue, setSearchValue] = useState('');

  // Mock user data - thay thế bằng dữ liệu thực từ context/store
  const user = {
    name: 'Admin User',
    email: 'admin@smartgarage.com',
    avatar: null,
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div className="menu-item">
          <User size={16} />
          <span>Hồ sơ</span>
        </div>
      ),
    },
    {
      key: 'settings',
      label: (
        <div className="menu-item">
          <Settings size={16} />
          <span>Cài đặt</span>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <div className="menu-item">
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </div>
      ),
    },
  ];

  const notificationItems = [
    {
      key: '1',
      label: (
        <div className="notification-item">
          <div className="notification-title">Đặt lịch mới</div>
          <div className="notification-time">5 phút trước</div>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div className="notification-item">
          <div className="notification-title">Dịch vụ hoàn thành</div>
          <div className="notification-time">1 giờ trước</div>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <div className="notification-item">
          <div className="notification-title">Thanh toán thành công</div>
          <div className="notification-time">2 giờ trước</div>
        </div>
      ),
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      // Handle logout
      console.log('Logging out...');
    } else if (key === 'profile') {
      // Navigate to profile
      console.log('Navigate to profile');
    } else if (key === 'settings') {
      // Navigate to settings
      console.log('Navigate to settings');
    }
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="header-right">
        <Dropdown
          menu={{ items: notificationItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <button className="header-icon-btn">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>
        </Dropdown>

        <Dropdown
          menu={{ items: userMenuItems, onClick: handleMenuClick }}
          trigger={['click']}
          placement="bottomRight"
        >
          <div className="user-profile">
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <User size={18} />
              )}
            </div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
};

export default Header;

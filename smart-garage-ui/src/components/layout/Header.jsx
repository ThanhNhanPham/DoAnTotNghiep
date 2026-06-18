import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Settings, Menu, KeyRound, Trash2, Search, ChevronDown } from 'lucide-react';
import { Dropdown, Input, message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import authService from '../../services/authService';
import adminSearchService from '../../services/adminSearchService';
import notificationService from '../../services/notificationService';
import ChangePasswordModal from './ChangePasswordModal';
import ProfileModal from './ProfileModal';
import './Header.css';

const NOTIFICATION_POLL_INTERVAL = 10000;

const isChatNotification = (notification) => {
  const title = (notification?.title || '').toLowerCase();
  const content = (notification?.content || '').toLowerCase();

  return title.includes('tin nhắn') || content.includes('vừa gửi tin nhắn');
};

const pageTitles = {
  '/admin/dashboard': { title: 'Dashboard', subtitle: 'Theo dõi vận hành hệ thống gara' },
  '/admin/bookings': { title: 'Đặt lịch', subtitle: 'Quản lý lịch hẹn và tiến độ sửa chữa' },
  '/admin/invoices': { title: 'Hóa đơn', subtitle: 'Kiểm soát thanh toán và doanh thu' },
  '/admin/users': { title: 'Tài khoản', subtitle: 'Quản lý quản trị viên và khách hàng' },
  '/admin/mechanics': { title: 'Thợ sửa xe', subtitle: 'Theo dõi nhân sự kỹ thuật' },
  '/admin/vehicles': { title: 'Phương tiện', subtitle: 'Quản lý hồ sơ xe khách hàng' },
  '/admin/services': { title: 'Dịch vụ', subtitle: 'Cấu hình dịch vụ sửa chữa' },
  '/admin/parts': { title: 'Phụ tùng', subtitle: 'Quản lý kho phụ tùng' },
  '/admin/branches': { title: 'Chi nhánh', subtitle: 'Vận hành mạng lưới gara' },
  '/admin/chats': { title: 'Chat khách hàng', subtitle: 'Hỗ trợ khách hàng theo thời gian thực' },
  '/admin/settings': { title: 'Cài đặt', subtitle: 'Thiết lập hệ thống' },
};

const Header = ({ onMenuClick, sidebarCollapsed }) => {
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState({
    name: 'Admin User',
    email: 'admin@smartgarage.com',
    avatar: null,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = pageTitles[location.pathname] || pageTitles['/admin/dashboard'];

  const flattenSearchResults = (results) => [
    ...(results?.customers || []),
    ...(results?.bookings || []),
    ...(results?.invoices || []),
  ];

  const searchGroups = [
    { key: 'customers', label: 'Khách hàng' },
    { key: 'bookings', label: 'Lịch hẹn' },
    { key: 'invoices', label: 'Hóa đơn' },
  ];

  const getInitials = (name) => {
    if (!name) return 'AD';
    const words = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  };

  const fetchNotifications = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) {
      setNotificationLoading(true);
    }

    try {
      const [items, countData] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(Array.isArray(items) ? items : []);
      setUnreadCount(Number(countData?.unreadCount || 0));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (showLoading) {
        setNotificationLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Lấy thông tin user từ backend
    const fetchUserInfo = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser({
            name: userData.fullName || userData.email.split('@')[0],
            email: userData.email,
            avatar: userData.avatar || null,
            phone: userData.phone || '',
            houseNumber: userData.houseNumber || '',
            ward: userData.ward || '',
            province: userData.province || '',
          });
          // Lưu vào localStorage
          localStorage.setItem('userPhone', userData.phone || '');
          localStorage.setItem('userHouseNumber', userData.houseNumber || '');
          localStorage.setItem('userWard', userData.ward || '');
          localStorage.setItem('userProvince', userData.province || '');
        }
      } catch (error) {
        console.log('Error fetching user info:', error);
        // Fallback nếu API thất bại, lấy từ localStorage
        const userInfo = authService.getUserInfo();
        if (userInfo.email) {
          setUser((prev) => ({
            ...prev,
            email: userInfo.email,
            name: userInfo.email.split('@')[0],
          }));
        }
      }
    };

    if (authService.isAuthenticated()) {
      fetchUserInfo();
      fetchNotifications({ showLoading: true });
    }
  }, [fetchNotifications]);

  useEffect(() => {
    if (!authService.isAuthenticated()) return undefined;

    const refreshWhenVisible = () => {
      if (!document.hidden) {
        fetchNotifications();
      }
    };

    const intervalId = window.setInterval(refreshWhenVisible, NOTIFICATION_POLL_INTERVAL);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const keyword = searchKeyword.trim();
    if (keyword.length < 2 || !authService.isAuthenticated()) {
      setSearchResults(null);
      setSearchLoading(false);
      return undefined;
    }

    let cancelled = false;
    setSearchLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const data = await adminSearchService.search(keyword);
        if (!cancelled) {
          setSearchResults(data);
          setSearchOpen(true);
        }
      } catch (error) {
        if (!cancelled) {
          setSearchResults({ customers: [], bookings: [], invoices: [] });
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchKeyword]);

  useEffect(() => {
    if (!authService.isAuthenticated()) return undefined;

    const refreshAfterFocus = () => {
      fetchNotifications();
    };

    window.addEventListener('focus', refreshAfterFocus);

    return () => {
      window.removeEventListener('focus', refreshAfterFocus);
    };
  }, [fetchNotifications]);

  const refreshNotifications = () => {
    if (authService.isAuthenticated()) {
      fetchNotifications({ showLoading: true });
    }
  };

  const handleSearchSelect = (item) => {
    if (!item?.route) return;
    setSearchKeyword('');
    setSearchResults(null);
    setSearchOpen(false);
    navigate(item.route);
  };

  const handleSearchEnter = () => {
    const items = flattenSearchResults(searchResults);
    if (items.length === 1) {
      handleSearchSelect(items[0]);
    }
  };

  const formatNotificationTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('vi-VN');
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
    // đổi mặt khẩu
    {
      key: 'change-password',
      label: (
        <div className="menu-item">
          <KeyRound size={16} />
          <span>Đổi mật khẩu</span>
        </div>
      ),
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

  const handleDeleteNotification = (item) => {
    Modal.confirm({
      title: 'Xóa thông báo',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa thông báo này không?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      centered: true,
      async onOk() {
        try {
          await notificationService.deleteNotification(item.id);
          const isUnread = !(item.isRead ?? item.read ?? false);

          setNotifications((prev) => prev.filter((notification) => notification.id !== item.id));
          if (isUnread) {
            setUnreadCount((prev) => Math.max(prev - 1, 0));
          }
          message.success('Đã xóa thông báo!');
        } catch (error) {
          console.error('Error deleting notification:', error);
          message.error('Không thể xóa thông báo!');
        }
      },
    });
  };

  const notificationItems = notificationLoading
    ? [
        {
          key: 'loading',
          disabled: true,
          label: <div className="notification-empty">Đang tải thông báo...</div>,
        },
      ]
    : [
        ...(notifications.length > 0
          ? notifications.slice(0, 8).map((item) => {
              const isRead = item.isRead ?? item.read ?? false;

              return {
                key: String(item.id),
                label: (
                  <div className={`notification-item ${isRead ? 'read' : 'unread'}`}>
                    <div className="notification-heading">
                      <span className="notification-title">{item.title || 'Thông báo'}</span>
                      <div className="notification-actions">
                        <span className={`notification-status ${isRead ? 'read' : 'unread'}`}>
                          {isRead ? 'Đã đọc' : 'Chưa đọc'}
                        </span>
                        <button
                          type="button"
                          className="notification-delete-btn"
                          aria-label="Xóa thông báo"
                          title="Xóa thông báo"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleDeleteNotification(item);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {item.content && <div className="notification-content">{item.content}</div>}
                    <div className="notification-time">{formatNotificationTime(item.createdAt)}</div>
                  </div>
                ),
              };
            })
          : [
              {
                key: 'empty',
                disabled: true,
                label: <div className="notification-empty">Chưa có thông báo</div>,
              },
            ]),
        ...(notifications.length > 0
          ? [
              { type: 'divider' },
              {
                key: 'read-all',
                label: <div className="notification-read-all">Đánh dấu tất cả đã đọc</div>,
              },
            ]
          : []),
      ];

  const handleNotificationClick = async ({ key }) => {
    if (key === 'empty' || key === 'loading') return;

    try {
      if (key === 'read-all') {
        await notificationService.markAllAsRead();
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        setUnreadCount(0);
        return;
      }

      const notificationId = Number(key);
      const selected = notifications.find((item) => item.id === notificationId);
      if (!selected) return;

      if (!(selected.isRead ?? selected.read ?? false)) {
        await notificationService.markAsRead(notificationId);
        setNotifications((prev) =>
          prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }

      if (selected.bookingId) {
        const targetPath = isChatNotification(selected) ? '/admin/chats' : '/admin/bookings';
        navigate(`${targetPath}?bookingId=${selected.bookingId}`);
      } else {
        message.info('Thông báo này chưa liên kết với đơn hàng.');
      }
    } catch (error) {
      console.error('Error updating notification:', error);
      message.error('Không thể cập nhật thông báo!');
    }
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      // Mở modal xác nhận đăng xuất
      Modal.confirm({
        title: 'Xác Nhận Đăng Xuất',
        icon: <ExclamationCircleOutlined />,
        content: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?',
        okText: 'Đăng xuất',
        cancelText: 'Hủy',
        okType: 'danger',
        centered: true,
        onOk() {
          authService.logout();
          message.success('Đăng xuất thành công!');
          navigate('/login');
        },
        onCancel() {
          console.log('Cancel logout');
        },
      });
    } else if (key === 'profile') {
      // Mở modal hồ sơ
      setProfileVisible(true);
    } else if (key === 'settings') {
      // Navigate to settings
      navigate('/admin/settings');
    } else if (key === 'change-password') {
      // Mở modal đổi mật khẩu
      setChangePasswordVisible(true);
    }
  };

  return (
    <header className={`admin-header ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div className="header-page-title">
          <strong>{currentPage.title}</strong>
          <span>{currentPage.subtitle}</span>
        </div>
      </div>

      <div className="header-search-wrapper">
        <Input
          className="header-search"
          value={searchKeyword}
          prefix={<Search size={16} />}
          placeholder="Tìm khách hàng, lịch hẹn, hóa đơn..."
          onChange={(event) => {
            setSearchKeyword(event.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => {
            if (searchKeyword.trim().length >= 2) {
              setSearchOpen(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setSearchOpen(false), 160);
          }}
          onPressEnter={handleSearchEnter}
        />
        {searchOpen && searchKeyword.trim().length >= 2 && (
          <div className="header-search-panel">
            {searchLoading ? (
              <div className="header-search-empty">Đang tìm kiếm...</div>
            ) : flattenSearchResults(searchResults).length === 0 ? (
              <div className="header-search-empty">Không tìm thấy kết quả phù hợp</div>
            ) : (
              searchGroups.map((group) => {
                const items = searchResults?.[group.key] || [];
                if (items.length === 0) return null;

                return (
                  <div className="header-search-group" key={group.key}>
                    <div className="header-search-group-title">{group.label}</div>
                    {items.map((item) => (
                      <button
                        type="button"
                        className="header-search-result"
                        key={`${item.type}-${item.id}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSearchSelect(item)}
                      >
                        <span>{item.title}</span>
                        {item.subtitle ? <small>{item.subtitle}</small> : null}
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="header-right">
        <Dropdown
          menu={{ items: notificationItems, onClick: handleNotificationClick }}
          trigger={['click']}
          placement="bottomRight"
          onOpenChange={(open) => {
            if (open && authService.isAuthenticated()) {
              refreshNotifications();
            }
          }}
        >
          <button className="header-icon-btn">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
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
                <span>{getInitials(user.name)}</span>
              )}
              <span className="user-status-dot" />
            </div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
            </div>
            <ChevronDown size={16} className="user-dropdown-icon" />
          </div>
        </Dropdown>
      </div>

      <ChangePasswordModal 
        visible={changePasswordVisible} 
        onClose={() => setChangePasswordVisible(false)} 
      />
      <ProfileModal 
        visible={profileVisible} 
        onClose={() => setProfileVisible(false)} 
        userEmail={user.email}
      />
    </header>
  );
};

export default Header;

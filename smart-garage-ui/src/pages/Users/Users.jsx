import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Tag,
  Popconfirm,
  Row,
  Col,
  Select,
  message,
  Descriptions,
} from 'antd';
import {
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Mail, Phone, MapPin } from 'lucide-react';
import userService from '../../services/userService';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const getDisplayAddress = (user) => {
    if (!user) return 'N/A';
    if (user.fullAddress) return user.fullAddress;
    const parts = [user.houseNumber, user.ward, user.province].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getRoleConfig = (role) => {
    const normalizedRole = role?.toLowerCase();
    const roleConfig = {
      customer: { color: 'blue', text: 'Khách hàng' },
      admin: { color: 'red', text: 'Admin' },
      superadmin: { color: 'purple', text: 'Super Admin' },
      super_admin: { color: 'purple', text: 'Super Admin' },
    };
    return roleConfig[normalizedRole] || { color: 'default', text: role || 'N/A' };
  };

  const getActiveValue = (user) => (
    user?.isActive !== undefined ? user.isActive :
    user?.active !== undefined ? user.active :
    user?.is_active
  );

  // Fetch dữ liệu người dùng từ backend
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      // Xử lý linh hoạt: Nếu là mảng trực tiếp, hoặc nằm trong trường 'content'/'data'
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && Array.isArray(data.content)) {
        setUsers(data.content);
      } else if (data && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        console.warn('Dữ liệu trả về không phải là mảng:', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      message.error(error.message || 'Không thể tải danh sách người dùng!');
      setUsers([]); // Đảm bảo luôn là mảng để không crash
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Lọc danh sách người dùng (An toàn)
  const filteredUsers = Array.isArray(users) ? users.filter((user) => {
    if (!user) return false;
    
    // Chuyển role về chữ thường để so sánh an toàn
    const userRole = user.role?.toLowerCase();
    const isAllowedRole = userRole === 'admin' || userRole === 'customer' || userRole === 'superadmin' || userRole === 'super_admin';
    
    // Tìm kiếm an toàn
    const userName = (user.fullName || '').toLowerCase();
    const userEmail = (user.email || '').toLowerCase();
    const userPhone = user.phone || '';
    
    const matchSearch = userName.includes(searchText.toLowerCase()) ||
                        userEmail.includes(searchText.toLowerCase()) ||
                        userPhone.includes(searchText);
    
    const matchRole = !roleFilter ? isAllowedRole : userRole === roleFilter.toLowerCase();
    const matchStatus = !statusFilter || 
                        (statusFilter === 'active' && user.isActive === true) ||
                        (statusFilter === 'inactive' && user.isActive === false);
    
    return isAllowedRole && matchSearch && matchRole && matchStatus;
  }) : [];


  // Xóa người dùng
  const handleDeleteUser = async (userId) => {
    try {
      await userService.deleteUser(userId);
      message.success('Xóa người dùng thành công!');
      fetchUsers();
    } catch (error) {
      message.error(error.message || 'Lỗi khi xóa người dùng!');
    }
  };

  const openDetailModal = async (userId) => {
    setIsDetailModalVisible(true);
    setUserDetail(null);
    setDetailLoading(true);
    try {
      const data = await userService.getUserById(userId);
      setUserDetail(data);
    } catch (error) {
      message.error(error.message || 'Không thể tải chi tiết người dùng!');
      setIsDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };


  // Cấu hình cột bảng
  const columns = [
    {
      title: 'STT',
      dataIndex: 'stt',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => {
        const displayName = record.fullName || record.name || text || 'N/A';
        return (
          <div className="user-name-cell">
            <div className="user-avatar">
              {record.avatar ? (
                <img src={record.avatar} alt={displayName} />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="user-fullname">{displayName}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email) => (
        <div className="cell-with-icon email-cell">
          <Mail size={14} />
          <a href={`mailto:${email}`}>{email}</a>
        </div>
      ),
    },
    {
      title: 'Điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (phone) => (
        <div className="cell-with-icon no-wrap-text">
          <Phone size={14} />
          {phone}
        </div>
      ),
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'fullAddress',
      key: 'fullAddress',
      width: 200,
      render: (address, record) => {
        return (
          <div className="cell-with-icon">
            <MapPin size={14} />
            <span>{getDisplayAddress(record)}</span>
          </div>
        );
      },
      responsive: ['lg'],
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => {
        const config = getRoleConfig(role);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (_, record) => {
        const isActive = getActiveValue(record);
        
        if (isActive === undefined || isActive === null) {
          return <Tag color="default">N/A</Tag>;
        }

        return (
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? 'Hoạt động' : 'Không hoạt động'}
          </Tag>
        );
      },
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) : 'N/A',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetailModal(record.id)}
          />
          <Popconfirm
            title="Xóa người dùng"
            description="Bạn có chắc muốn xóa người dùng này?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Quản lý Tài khoản</h1>
        <p>Quản lý danh sách quản trị viên và khách hàng của hệ thống</p>
      </div>

      <Card className="users-card" bordered={false}>
        {/* Filters and Actions */}
        <div className="users-toolbar">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Tìm kiếm theo tên, email, phone..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Vai trò"
                value={roleFilter}
                onChange={setRoleFilter}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: 'Khách hàng', value: 'customer' },
                  { label: 'Quản trị viên (Admin)', value: 'admin' },
                  { label: 'Super Admin', value: 'super_admin' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: 'Hoạt động', value: 'active' },
                  { label: 'Không hoạt động', value: 'inactive' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={10} className="text-right">
              {/* Nút thêm đã được gỡ bỏ theo yêu cầu */}
            </Col>
          </Row>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Tổng người dùng</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {users.filter((u) => u.isActive === true).length}
              </div>
              <div className="stat-label">Đang hoạt động</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {users.filter((u) => u.role?.toLowerCase() === 'customer').length}
              </div>
              <div className="stat-label">Tổng khách hàng</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {users.filter((u) => {
                  const r = u.role?.toLowerCase();
                  return r === 'admin' || r === 'super_admin';
                }).length}
              </div>
              <div className="stat-label">Tổng Quản trị viên</div>
            </div>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} người dùng`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="Chi tiết người dùng"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={760}
        loading={detailLoading}
      >
        {userDetail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã người dùng">#{userDetail.id}</Descriptions.Item>
            <Descriptions.Item label="Họ và tên">
              <div className="user-detail-name">
                <div className="user-avatar">
                  {(userDetail.fullName || userDetail.name || '?').charAt(0).toUpperCase()}
                </div>
                <span>{userDetail.fullName || userDetail.name || 'N/A'}</span>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {userDetail.email ? <a href={`mailto:${userDetail.email}`}>{userDetail.email}</a> : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {userDetail.phone ? <a href={`tel:${userDetail.phone}`}>{userDetail.phone}</a> : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Vai trò">
              <Tag color={getRoleConfig(userDetail.role).color}>{getRoleConfig(userDetail.role).text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {getActiveValue(userDetail) === undefined || getActiveValue(userDetail) === null ? (
                <Tag color="default">N/A</Tag>
              ) : (
                <Tag color={getActiveValue(userDetail) ? 'green' : 'red'}>
                  {getActiveValue(userDetail) ? 'Hoạt động' : 'Không hoạt động'}
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{getDisplayAddress(userDetail)}</Descriptions.Item>
            <Descriptions.Item label="Số nhà">{userDetail.houseNumber || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Phường/Xã">{userDetail.ward || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Tỉnh/Thành phố">{userDetail.province || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Chi nhánh">
              {userDetail.branch?.name || 'Không thuộc chi nhánh'}
            </Descriptions.Item>
            <Descriptions.Item label="Số phương tiện">
              {Array.isArray(userDetail.vehicles) ? userDetail.vehicles.length : 0}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tham gia">
              {userDetail.createdAt ? new Date(userDetail.createdAt).toLocaleString('vi-VN') : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Form chỉnh sửa đã được gỡ bỏ theo yêu cầu */}
    </div>
  );
};

export default Users;

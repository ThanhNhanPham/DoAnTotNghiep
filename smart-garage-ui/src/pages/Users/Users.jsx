import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  Form,
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
  CheckCircleOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  LockOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Mail, Phone, MapPin } from 'lucide-react';
import userService from '../../services/userService';
import branchService from '../../services/branchService';
import './Users.css';

const Users = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [adminForm] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [isCreateAdminModalVisible, setIsCreateAdminModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const userIdFromSearch = searchParams.get('userId');

  const getDisplayAddress = (user) => {
    if (!user) return 'N/A';
    if (user.fullAddress) return user.fullAddress;
    const parts = [user.houseNumber, user.ward, user.province].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getRoleConfig = (role) => {
    const normalizedRole = normalizeRole(role);
    const roleConfig = {
      customer: { color: 'blue', text: 'Khách hàng' },
      admin: { color: 'red', text: 'Admin' },
      superadmin: { color: 'purple', text: 'Super Admin' },
    };
    return roleConfig[normalizedRole] || { color: 'default', text: role || 'N/A' };
  };

  const normalizeRole = (role) => String(role || '').replace(/^ROLE_/i, '').replace(/_/g, '').toLowerCase();

  const getActiveValue = (user) => (
    user?.isActive !== undefined ? user.isActive :
    user?.active !== undefined ? user.active :
    user?.is_active
  );

  const getAccountStatus = (user) => {
    if (user?.accountStatus) return String(user.accountStatus).toUpperCase();
    return getActiveValue(user) === false ? 'INACTIVE' : 'ACTIVE';
  };

  const getStatusConfig = (status) => {
    const statusConfig = {
      ACTIVE: { color: 'green', text: 'Đang hoạt động' },
      LOCKED: { color: 'volcano', text: 'Bị khóa' },
      INACTIVE: { color: 'red', text: 'Ngừng hoạt động' },
    };
    return statusConfig[status] || { color: 'default', text: 'N/A' };
  };

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

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await branchService.getActiveBranches();
        setBranches(Array.isArray(data) ? data : []);
      } catch (error) {
        message.error(error?.response?.data?.message || error.message || 'Không thể tải danh sách chi nhánh!');
      }
    };

    fetchBranches();
  }, []);

  // Lọc danh sách người dùng (An toàn)
  const filteredUsers = Array.isArray(users) ? users.filter((user) => {
    if (!user) return false;
    
    // Chuyển role về chữ thường để so sánh an toàn
    const userRole = normalizeRole(user.role);
    const isAllowedRole = userRole === 'admin' || userRole === 'customer' || userRole === 'superadmin';
    
    // Tìm kiếm an toàn
    const userName = (user.fullName || '').toLowerCase();
    const userEmail = (user.email || '').toLowerCase();
    const userPhone = user.phone || '';
    
    const matchSearch = userName.includes(searchText.toLowerCase()) ||
                        userEmail.includes(searchText.toLowerCase()) ||
                        userPhone.includes(searchText);
    
    const matchRole = !roleFilter ? isAllowedRole : userRole === roleFilter;
    const matchStatus = !statusFilter || getAccountStatus(user) === statusFilter;
    
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

  const handleCreateAdmin = async () => {
    try {
      const values = await adminForm.validateFields();
      setCreateLoading(true);
      await userService.createAdmin(values);
      message.success('Tạo tài khoản Admin thành công!');
      adminForm.resetFields();
      setIsCreateAdminModalVisible(false);
      fetchUsers();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || 'Lỗi khi tạo tài khoản Admin!');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateAccountStatus = async (userId, accountStatus) => {
    try {
      await userService.updateAccountStatus(userId, accountStatus);
      message.success('Cập nhật trạng thái tài khoản thành công!');
      fetchUsers();
      if (userDetail?.id === userId) {
        const updatedDetail = await userService.getUserById(userId);
        setUserDetail(updatedDetail);
      }
    } catch (error) {
      message.error(error.message || 'Lỗi khi cập nhật trạng thái tài khoản!');
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

  useEffect(() => {
    if (!userIdFromSearch) return;

    const userId = Number(userIdFromSearch);
    if (!Number.isFinite(userId)) {
      setSearchParams({}, { replace: true });
      return;
    }

    openDetailModal(userId);
    setSearchParams({}, { replace: true });
  }, [userIdFromSearch, setSearchParams]);


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
      dataIndex: 'accountStatus',
      key: 'accountStatus',
      width: 140,
      render: (_, record) => {
        const config = getStatusConfig(getAccountStatus(record));
        return <Tag color={config.color}>{config.text}</Tag>;
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
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        const accountStatus = getAccountStatus(record);
        const isSuperAdmin = normalizeRole(record.role) === 'superadmin';

        return (
          <Space>
            <Button
              size="small"
              icon={<EyeOutlined />}
              title="Xem chi tiết"
              onClick={() => openDetailModal(record.id)}
            />
            {!isSuperAdmin && accountStatus !== 'ACTIVE' && (
              <Popconfirm
                title="Kích hoạt tài khoản"
                description="Bạn có chắc muốn kích hoạt tài khoản này?"
                onConfirm={() => handleUpdateAccountStatus(record.id, 'ACTIVE')}
                okText="Kích hoạt"
                cancelText="Hủy"
              >
                <Button size="small" icon={<CheckCircleOutlined />} title="Kích hoạt" />
              </Popconfirm>
            )}
            {!isSuperAdmin && accountStatus !== 'LOCKED' && (
              <Popconfirm
                title="Khóa tài khoản"
                description="Tài khoản bị khóa sẽ không thể đăng nhập."
                onConfirm={() => handleUpdateAccountStatus(record.id, 'LOCKED')}
                okText="Khóa"
                cancelText="Hủy"
              >
                <Button size="small" icon={<LockOutlined />} title="Khóa tài khoản" />
              </Popconfirm>
            )}
            {!isSuperAdmin && accountStatus !== 'INACTIVE' && (
              <Popconfirm
                title="Ngừng hoạt động"
                description="Tài khoản ngừng hoạt động sẽ không thể đăng nhập."
                onConfirm={() => handleUpdateAccountStatus(record.id, 'INACTIVE')}
                okText="Ngừng"
                cancelText="Hủy"
              >
                <Button size="small" icon={<StopOutlined />} title="Ngừng hoạt động" />
              </Popconfirm>
            )}
            {!isSuperAdmin && (
              <Popconfirm
                title="Xóa người dùng"
                description="Bạn có chắc muốn xóa người dùng này?"
                onConfirm={() => handleDeleteUser(record.id)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button type="primary" danger size="small" icon={<DeleteOutlined />} title="Xóa người dùng" />
              </Popconfirm>
            )}
          </Space>
        );
      },
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
                  { label: 'Super Admin', value: 'superadmin' },
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
                  { label: 'Đang hoạt động', value: 'ACTIVE' },
                  { label: 'Bị khóa', value: 'LOCKED' },
                  { label: 'Ngừng hoạt động', value: 'INACTIVE' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={10} className="text-right">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateAdminModalVisible(true)}
              >
                Tạo tài khoản Admin
              </Button>
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
                {users.filter((u) => getAccountStatus(u) === 'ACTIVE').length}
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
                  const r = normalizeRole(u.role);
                  return r === 'admin' || r === 'superadmin';
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
        title="Tạo tài khoản Admin"
        open={isCreateAdminModalVisible}
        onOk={handleCreateAdmin}
        onCancel={() => {
          setIsCreateAdminModalVisible(false);
          adminForm.resetFields();
        }}
        confirmLoading={createLoading}
        okText="Tạo tài khoản"
        cancelText="Hủy"
        width={720}
      >
        <Form
          form={adminForm}
          layout="vertical"
          className="admin-account-form"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
              >
                <Input placeholder="Nhập họ và tên Admin" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' },
                ]}
              >
                <Input placeholder="admin@smartgarage.vn" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu ban đầu" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  {
                    pattern: /^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/,
                    message: 'Số điện thoại không đúng định dạng Việt Nam!',
                  },
                ]}
              >
                <Input placeholder="0912345678" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Chi nhánh quản lý"
            name="branchId"
            rules={[{ required: true, message: 'Vui lòng chọn chi nhánh!' }]}
          >
            <Select
              placeholder="Chọn chi nhánh cho Admin"
              showSearch
              optionFilterProp="label"
              options={branches.map((branch) => ({
                label: branch.name,
                value: branch.id,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Tỉnh/Thành phố"
                name="province"
                rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố!' }]}
              >
                <Input placeholder="TP. Hồ Chí Minh" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Phường/Xã"
                name="ward"
                rules={[{ required: true, message: 'Vui lòng nhập phường/xã!' }]}
              >
                <Input placeholder="Phường/Xã" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Số nhà, tên đường"
                name="houseNumber"
                rules={[{ required: true, message: 'Vui lòng nhập số nhà, tên đường!' }]}
              >
                <Input placeholder="123 Nguyễn Trãi" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        className="detail-modal"
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
              <Tag color={getStatusConfig(getAccountStatus(userDetail)).color}>
                {getStatusConfig(getAccountStatus(userDetail)).text}
              </Tag>
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

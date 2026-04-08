import { useState, useCallback } from 'react';
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
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Mail, Phone, MapPin } from 'lucide-react';
import UserForm from './UserForm';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Nguyễn Văn A',
      email: 'nguyena@example.com',
      phone: '0901234567',
      address: '123 Đường Lê Lợi, TPHCM',
      role: 'customer',
      status: 'active',
      joinDate: '2025-01-15',
      avatar: null,
    },
    {
      id: 2,
      name: 'Trần Thị B',
      email: 'tranb@example.com',
      phone: '0912345678',
      address: '456 Đường Nguyễn Hue, TPHCM',
      role: 'customer',
      status: 'active',
      joinDate: '2025-01-20',
      avatar: null,
    },
    {
      id: 3,
      name: 'Lê Văn C',
      email: 'levanc@example.com',
      phone: '0923456789',
      address: '789 Đường Hoàng Sa, TPHCM',
      role: 'mechanic',
      status: 'active',
      joinDate: '2024-12-01',
      avatar: null,
    },
    {
      id: 4,
      name: 'Phạm Thị D',
      email: 'phamd@example.com',
      phone: '0934567890',
      address: '321 Đường Võ Văn Kiệt, TPHCM',
      role: 'customer',
      status: 'inactive',
      joinDate: '2025-01-10',
      avatar: null,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(null);

  // Lọc danh sách người dùng
  const filteredUsers = users.filter((user) => {
    const matchSearch = user.name.toLowerCase().includes(searchText.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
                        user.phone.includes(searchText);
    const matchRole = !roleFilter || user.role === roleFilter;
    const matchStatus = !statusFilter || user.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  // Mở modal thêm người dùng
  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalVisible(true);
  };

  // Mở modal sửa người dùng
  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsModalVisible(true);
  };

  // Xóa người dùng
  const handleDeleteUser = (userId) => {
    setUsers(users.filter((user) => user.id !== userId));
    message.success('Xóa người dùng thành công!');
  };

  // Lưu người dùng
  const handleSaveUser = (values) => {
    if (editingUser) {
      // Cập nhật người dùng
      setUsers(users.map((user) =>
        user.id === editingUser.id ? { ...user, ...values } : user
      ));
      message.success('Cập nhật người dùng thành công!');
    } else {
      // Thêm người dùng mới
      const newUser = {
        id: Math.max(...users.map((u) => u.id), 0) + 1,
        ...values,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
        avatar: null,
      };
      setUsers([...users, newUser]);
      message.success('Thêm người dùng thành công!');
    }
    setIsModalVisible(false);
  };

  // Cấu hình cột bảng
  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <div className="user-name-cell">
          <div className="user-avatar">
            {record.avatar ? (
              <img src={record.avatar} alt={text} />
            ) : (
              text.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="user-fullname">{text}</div>
            <div className="user-email-small">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email) => (
        <div className="cell-with-icon">
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
        <div className="cell-with-icon">
          <Phone size={14} />
          {phone}
        </div>
      ),
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      width: 200,
      render: (address) => (
        <div className="cell-with-icon">
          <MapPin size={14} />
          <span>{address}</span>
        </div>
      ),
      responsive: ['lg'],
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => {
        const roleConfig = {
          customer: { color: 'blue', text: 'Khách hàng' },
          mechanic: { color: 'orange', text: 'Thợ sửa xe' },
          admin: { color: 'red', text: 'Admin' },
          staff: { color: 'green', text: 'Nhân viên' },
        };
        const config = roleConfig[role];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => {
        const statusConfig = {
          active: { color: 'green', text: 'Hoạt động' },
          inactive: { color: 'red', text: 'Không hoạt động' },
          banned: { color: 'volcano', text: 'Bị khóa' },
        };
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 130,
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
      responsive: ['md'],
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
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
        <h1>Quản lý người dùng</h1>
        <p>Quản lý danh sách người dùng và quyền hạn của hệ thống</p>
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
                options={[
                  { label: 'Khách hàng', value: 'customer' },
                  { label: 'Thợ sửa xe', value: 'mechanic' },
                  { label: 'Admin', value: 'admin' },
                  { label: 'Nhân viên', value: 'staff' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                options={[
                  { label: 'Hoạt động', value: 'active' },
                  { label: 'Không hoạt động', value: 'inactive' },
                  { label: 'Bị khóa', value: 'banned' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={10} className="text-right">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddUser}
              >
                Thêm người dùng
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
                {users.filter((u) => u.status === 'active').length}
              </div>
              <div className="stat-label">Hoạt động</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {users.filter((u) => u.role === 'customer').length}
              </div>
              <div className="stat-label">Khách hàng</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {users.filter((u) => u.role === 'mechanic').length}
              </div>
              <div className="stat-label">Thợ sửa xe</div>
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

      {/* User Form Modal */}
      <UserForm
        visible={isModalVisible}
        editingUser={editingUser}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default Users;

import { useState } from 'react';
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
import { Wrench, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import MechanicsForm from './MechanicsForm';
import './Mechanics.css';

const Mechanics = () => {
  const [mechanics, setMechanics] = useState([
    {
      id: 1,
      fullName: 'Nguyễn Văn Nam',
      phone: '0901234567',
      address: '123 Đường Nguyễn Huệ, Quận 1, TPHCM',
      status: 'ACTIVE',
      createdAt: '2022-01-10T10:30:00',
      branch: {
        id: 1,
        name: 'Chi nhánh Quận 1',
      },
      bookings: [
        { id: 1, serviceName: 'Bảo dưỡng' },
        { id: 2, serviceName: 'Sửa chữa động cơ' },
        { id: 3, serviceName: 'Thay dầu' },
      ],
    },
    {
      id: 2,
      fullName: 'Trần Đức Anh',
      phone: '0912345678',
      address: '456 Đường Lê Lợi, Quận 1, TPHCM',
      status: 'ACTIVE',
      createdAt: '2022-06-15T14:20:00',
      branch: {
        id: 1,
        name: 'Chi nhánh Quận 1',
      },
      bookings: [
        { id: 4, serviceName: 'Sửa chữa' },
        { id: 5, serviceName: 'Bảo dưỡng' },
      ],
    },
    {
      id: 3,
      fullName: 'Lê Hoàng Long',
      phone: '0923456789',
      address: '789 Đường Hoàng Sa, Quận 3, TPHCM',
      status: 'BUSY',
      createdAt: '2023-03-20T09:15:00',
      branch: {
        id: 2,
        name: 'Chi nhánh Quận 3',
      },
      bookings: [
        { id: 6, serviceName: 'Sửa chữa' },
      ],
    },
    {
      id: 4,
      fullName: 'Phạm Quốc Toàn',
      phone: '0934567890',
      address: '321 Đường Võ Văn Kiệt, Quận 4, TPHCM',
      status: 'INACTIVE',
      createdAt: '2023-08-05T16:45:00',
      branch: {
        id: 3,
        name: 'Chi nhánh Quận 4',
      },
      bookings: [],
    },
  ]);

  const [branches] = useState([
    { id: 1, name: 'Chi nhánh Quận 1' },
    { id: 2, name: 'Chi nhánh Quận 3' },
    { id: 3, name: 'Chi nhánh Quận 4' },
    { id: 4, name: 'Chi nhánh Quận 5' },
  ]);

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMechanic, setEditingMechanic] = useState(null);

  // Lọc danh sách thợ sửa xe
  const filteredMechanics = mechanics.filter((mechanic) => {
    const matchSearch = mechanic.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
                        mechanic.phone.includes(searchText) ||
                        mechanic.address.toLowerCase().includes(searchText.toLowerCase());
    const matchBranch = !branchFilter || mechanic.branch.id.toString() === branchFilter;
    const matchStatus = !statusFilter || mechanic.status === statusFilter;
    return matchSearch && matchBranch && matchStatus;
  });

  // Mở modal thêm thợ sửa xe
  const handleAddMechanic = () => {
    setEditingMechanic(null);
    setIsModalVisible(true);
  };

  // Mở modal sửa thợ sửa xe
  const handleEditMechanic = (mechanic) => {
    setEditingMechanic(mechanic);
    setIsModalVisible(true);
  };

  // Xóa thợ sửa xe
  const handleDeleteMechanic = (mechanicId) => {
    setMechanics(mechanics.filter((m) => m.id !== mechanicId));
    message.success('Xóa thợ sửa xe thành công!');
  };

  // Lưu thợ sửa xe
  const handleSaveMechanic = (values) => {
    if (editingMechanic) {
      // Cập nhật thợ sửa xe
      setMechanics(mechanics.map((m) =>
        m.id === editingMechanic.id
          ? {
              ...m,
              ...values,
              branch: branches.find((b) => b.id === values.branchId),
            }
          : m
      ));
      message.success('Cập nhật thợ sửa xe thành công!');
    } else {
      // Thêm thợ sửa xe mới
      const newMechanic = {
        id: Math.max(...mechanics.map((m) => m.id), 0) + 1,
        ...values,
        branch: branches.find((b) => b.id === values.branchId),
        createdAt: new Date().toISOString(),
        bookings: [],
      };
      setMechanics([...mechanics, newMechanic]);
      message.success('Thêm thợ sửa xe thành công!');
    }
    setIsModalVisible(false);
  };

  // Cấu hình cột bảng
  const columns = [
    {
      title: 'Tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 160,
      render: (text, record) => (
        <div className="mechanic-name-cell">
          <div className="mechanic-avatar">
            {text.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="mechanic-fullname">{text}</div>
            <div className="mechanic-branch-small">{record.branch.name}</div>
          </div>
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
          <a href={`tel:${phone}`}>{phone}</a>
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
          <span title={address} className="address-cell">
            {address}
          </span>
        </div>
      ),
      responsive: ['lg'],
    },
    {
      title: 'Chi nhánh',
      dataIndex: ['branch', 'name'],
      key: 'branchName',
      width: 160,
      render: (branch) => <Tag color="blue">{branch}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusConfig = {
          ACTIVE: { color: 'green', text: 'Hoạt động' },
          INACTIVE: { color: 'red', text: 'Không hoạt động' },
          BUSY: { color: 'orange', text: 'Đang bận' },
        };
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'createdAt',
      key: 'createdAt',
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
            onClick={() => handleEditMechanic(record)}
          />
          <Popconfirm
            title="Xóa thợ sửa xe"
            description="Bạn có chắc muốn xóa thợ sửa xe này?"
            onConfirm={() => handleDeleteMechanic(record.id)}
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
    <div className="mechanics-page">
      <div className="page-header">
        <h1>Quản lý thợ sửa xe</h1>
        <p>Quản lý thông tin và trạng thái của các thợ sửa xe</p>
      </div>

      <Card className="mechanics-card" bordered={false}>
        {/* Filters and Actions */}
        <div className="mechanics-toolbar">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Tìm kiếm theo tên, phone, địa chỉ..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Chi nhánh"
                value={branchFilter}
                onChange={setBranchFilter}
                allowClear
                options={branches.map((branch) => ({
                  label: branch.name,
                  value: branch.id.toString(),
                }))}
              />
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                options={[
                  { label: 'Hoạt động', value: 'ACTIVE' },
                  { label: 'Không hoạt động', value: 'INACTIVE' },
                  { label: 'Đang bận', value: 'BUSY' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={6} className="text-right">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddMechanic}
              >
                Thêm thợ sửa xe
              </Button>
            </Col>
          </Row>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">{mechanics.length}</div>
              <div className="stat-label">Tổng thợ sửa xe</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {mechanics.filter((m) => m.status === 'ACTIVE').length}
              </div>
              <div className="stat-label">Hoạt động</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {mechanics.filter((m) => m.status === 'BUSY').length}
              </div>
              <div className="stat-label">Đang bận</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {mechanics.reduce((sum, m) => sum + m.bookings.length, 0)}
              </div>
              <div className="stat-label">Tổng công việc</div>
            </div>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredMechanics}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} thợ sửa xe`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* Mechanic Form Modal */}
      <MechanicsForm
        visible={isModalVisible}
        editingMechanic={editingMechanic}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveMechanic}
        branches={branches}
      />
    </div>
  );
};

export default Mechanics;

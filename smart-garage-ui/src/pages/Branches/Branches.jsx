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
import { Building2, MapPin, Phone } from 'lucide-react';
import BranchesForm from './BranchesForm';
import './Branches.css';

const Branches = () => {
  const [branches, setBranches] = useState([
    {
      id: 1,
      name: 'Chi nhánh Quận 1',
      address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
      phone: '0283456789',
      imageUrl: 'https://via.placeholder.com/150?text=Q1',
      isActive: true,
    },
    {
      id: 2,
      name: 'Chi nhánh Quận 3',
      address: '456 Võ Văn Tần, Phường 6, Quận 3, TP.HCM',
      phone: '0287654321',
      imageUrl: 'https://via.placeholder.com/150?text=Q3',
      isActive: true,
    },
    {
      id: 3,
      name: 'Chi nhánh Bình Thạnh',
      address: '789 Xô Viết Nghệ Tĩnh, Phường 25, Bình Thạnh, TP.HCM',
      phone: '0289876543',
      imageUrl: 'https://via.placeholder.com/150?text=BT',
      isActive: true,
    },
    {
      id: 4,
      name: 'Chi nhánh Tân Bình',
      address: '321 Cộng Hòa, Phường 4, Tân Bình, TP.HCM',
      phone: '0281234567',
      imageUrl: 'https://via.placeholder.com/150?text=TB',
      isActive: false,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // Lọc danh sách chi nhánh
  const filteredBranches = branches.filter((branch) => {
    const matchSearch =
      branch.name.toLowerCase().includes(searchText.toLowerCase()) ||
      branch.address.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !statusFilter || (statusFilter === 'active' ? branch.isActive : !branch.isActive);
    return matchSearch && matchStatus;
  });

  // Mở modal thêm chi nhánh
  const handleAddBranch = () => {
    setEditingBranch(null);
    setIsModalVisible(true);
  };

  // Mở modal sửa chi nhánh
  const handleEditBranch = (branch) => {
    setEditingBranch(branch);
    setIsModalVisible(true);
  };

  // Xóa chi nhánh
  const handleDeleteBranch = (branchId) => {
    setBranches(branches.filter((b) => b.id !== branchId));
    message.success('Xóa chi nhánh thành công!');
  };

  // Lưu chi nhánh
  const handleSaveBranch = (values) => {
    if (editingBranch) {
      // Cập nhật chi nhánh
      setBranches(
        branches.map((b) =>
          b.id === editingBranch.id ? { ...b, ...values } : b
        )
      );
      message.success('Cập nhật chi nhánh thành công!');
    } else {
      // Thêm chi nhánh mới
      const newBranch = {
        id: Math.max(...branches.map((b) => b.id), 0) + 1,
        ...values,
      };
      setBranches([...branches, newBranch]);
      message.success('Thêm chi nhánh thành công!');
    }
    setIsModalVisible(false);
  };

  // Cấu hình cột bảng
  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Tên chi nhánh',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <div className="branch-name-cell">
          <div className="branch-icon">
            <Building2 size={16} />
          </div>
          <div className="branch-title">{text}</div>
        </div>
      ),
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      width: 250,
      render: (address) => (
        <div className="address-cell">
          <MapPin size={14} />
          <span>{address}</span>
        </div>
      ),
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (phone) => (
        <div className="contact-item">
          <Phone size={14} />
          <a href={`tel:${phone}`}>{phone}</a>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
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
            onClick={() => handleEditBranch(record)}
          />
          <Popconfirm
            title="Xóa chi nhánh"
            description="Bạn có chắc muốn xóa chi nhánh này?"
            onConfirm={() => handleDeleteBranch(record.id)}
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
    <div className="branches-page">
      <div className="page-header">
        <h1>Quản lý chi nhánh</h1>
        <p>Quản lý các chi nhánh garage trên toàn hệ thống</p>
      </div>

      <Card className="branches-card" bordered={false}>
        {/* Filters and Actions */}
        <div className="branches-toolbar">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={10}>
              <Input
                placeholder="Tìm kiếm theo tên, địa chỉ..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
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

            <Col xs={24} sm={12} md={8} className="text-right">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddBranch}
              >
                Thêm chi nhánh
              </Button>
            </Col>
          </Row>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8}>
            <div className="stat-item">
              <div className="stat-value">{branches.length}</div>
              <div className="stat-label">Tổng chi nhánh</div>
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div className="stat-item">
              <div className="stat-value">
                {branches.filter((b) => b.isActive).length}
              </div>
              <div className="stat-label">Đang hoạt động</div>
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div className="stat-item">
              <div className="stat-value">
                {branches.filter((b) => !b.isActive).length}
              </div>
              <div className="stat-label">Không hoạt động</div>
            </div>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredBranches}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} chi nhánh`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* Branch Form Modal */}
      <BranchesForm
        visible={isModalVisible}
        editingBranch={editingBranch}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveBranch}
      />
    </div>
  );
};

export default Branches;

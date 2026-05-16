import { useState, useEffect } from 'react';
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
  Image,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Building2, MapPin, Phone, CheckCircle, XCircle } from 'lucide-react';
import BranchesForm from './BranchesForm';
import branchService from '../../services/branchService';
import './Branches.css';

const Branches = () => {
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [branchDetail, setBranchDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const data = await branchService.getAllBranches();
      setBranches(data || []);
    } catch {
      message.error('Không thể tải danh sách chi nhánh');
    } finally {
      setLoading(false);
    }
  };

  // Lọc danh sách chi nhánh
  const filteredBranches = branches.filter((branch) => {
    const search = searchText.toLowerCase();
    const matchSearch =
      (branch.name || '').toLowerCase().includes(search) ||
      (branch.address || '').toLowerCase().includes(search) ||
      (branch.phone || '').includes(searchText);
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

  const openDetailModal = async (branchId) => {
    setIsDetailModalVisible(true);
    setBranchDetail(null);
    setDetailLoading(true);
    try {
      const data = await branchService.getBranchById(branchId);
      setBranchDetail(data);
    } catch {
      message.error('Không thể tải chi tiết chi nhánh!');
      setIsDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Xóa chi nhánh
  const handleDeleteBranch = async (branchId) => {
    try {
      await branchService.deactivateBranch(branchId);
      message.success('Xóa chi nhánh thành công!');
      fetchBranches();
    } catch {
      message.error('Lỗi khi xóa chi nhánh!');
    }
  };

  // Lưu chi nhánh
  const handleSaveBranch = async (values) => {
    try {
      if (editingBranch) {
        // Cập nhật chi nhánh
        await branchService.updateBranch(editingBranch.id, {
          ...editingBranch,
          ...values,
        });
        message.success('Cập nhật chi nhánh thành công!');
      } else {
        // Thêm chi nhánh mới
        await branchService.createBranch(values);
        message.success('Thêm chi nhánh thành công!');
      }
      setIsModalVisible(false);
      fetchBranches();
    } catch (error) {
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message;
      message.error(serverMessage || (editingBranch ? 'Lỗi khi cập nhật chi nhánh!' : 'Lỗi khi thêm chi nhánh!'));
    }
  };

  // Cấu hình cột bảng
  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Tên chi nhánh',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text) => (
        <div className="branch-name-cell">
          <div className="branch-icon">
            <Building2 size={16} />
          </div>
          <div className="branch-title">{text}</div>
        </div>
      ),
    },
    {
      title: 'Ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 110,
      align: 'center',
      render: (imageUrl, record) => (
        imageUrl ? (
          <Image
            src={imageUrl}
            alt={record.name || 'Ảnh chi nhánh'}
            width={72}
            height={48}
            className="branch-table-image"
          />
        ) : (
          <div className="branch-table-image-placeholder">
            <Building2 size={18} />
          </div>
        )
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
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetailModal(record.id)}
          />
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
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={8}>
            <div className="stat-card stat-total">
              <div className="stat-icon-wrapper blue">
                <Building2 size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{branches.length}</div>
                <div className="stat-label">Tổng chi nhánh</div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="stat-card stat-active">
              <div className="stat-icon-wrapper green">
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">
                  {branches.filter((b) => b.isActive).length}
                </div>
                <div className="stat-label">Đang hoạt động</div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="stat-card stat-inactive">
              <div className="stat-icon-wrapper red">
                <XCircle size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">
                  {branches.filter((b) => !b.isActive).length}
                </div>
                <div className="stat-label">Không hoạt động</div>
              </div>
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

      <Modal
        title="Chi tiết chi nhánh"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={760}
        loading={detailLoading}
      >
        {branchDetail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã chi nhánh">#{branchDetail.id}</Descriptions.Item>
            <Descriptions.Item label="Ảnh chi nhánh">
              {branchDetail.imageUrl ? (
                <Image
                  src={branchDetail.imageUrl}
                  alt="Ảnh chi nhánh"
                  width={240}
                  className="branch-detail-image"
                />
              ) : (
                'Chưa có ảnh'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Tên chi nhánh">
              <div className="branch-detail-name">
                <div className="branch-icon">
                  <Building2 size={16} />
                </div>
                <span>{branchDetail.name || 'N/A'}</span>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{branchDetail.address || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {branchDetail.phone ? <a href={`tel:${branchDetail.phone}`}>{branchDetail.phone}</a> : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Tọa độ">
              {branchDetail.latitude != null && branchDetail.longitude != null
                ? `${branchDetail.latitude}, ${branchDetail.longitude}`
                : 'Chưa cập nhật'}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={branchDetail.isActive ? 'green' : 'red'}>
                {branchDetail.isActive ? 'Hoạt động' : 'Không hoạt động'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

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

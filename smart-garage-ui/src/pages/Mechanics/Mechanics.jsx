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
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Phone, MapPin } from 'lucide-react';
import MechanicsForm from './MechanicsForm';
import mechanicService from '../../services/mechanicService';
import branchService from '../../services/branchService';
import './Mechanics.css';

const Mechanics = () => {
  const [mechanics, setMechanics] = useState([]);

  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [branchFilter, setBranchFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMechanic, setEditingMechanic] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [mechanicDetail, setMechanicDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const statusConfig = {
    ACTIVE: { color: 'green', text: 'Hoạt động' },
    INACTIVE: { color: 'red', text: 'Không hoạt động' },
    BUSY: { color: 'orange', text: 'Đang bận' },
  };

  // Lọc danh sách thợ sửa xe
  const filteredMechanics = mechanics.filter((mechanic) => {
    const search = searchText.toLowerCase();
    const matchSearch = (mechanic.fullName || '').toLowerCase().includes(search) ||
                        (mechanic.phone || '').includes(searchText) ||
                        (mechanic.address || '').toLowerCase().includes(search) ||
                        (mechanic.specialization || '').toLowerCase().includes(search);
    const matchBranch = !branchFilter || mechanic.branch?.id?.toString() === branchFilter;
    const matchStatus = !statusFilter || mechanic.status === statusFilter;
    return matchSearch && matchBranch && matchStatus;
  });

  const fetchMechanics = async () => {
    setLoading(true);
    try {
      const data = await mechanicService.getAllMechanics();
      setMechanics(data || []);
    } catch {
      message.error('Lỗi khi tải danh sách thợ sửa xe!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanics();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await branchService.getActiveBranches();
      setBranches(data || []);
    } catch {
      message.error('Lỗi khi tải danh sách chi nhánh!');
    }
  };

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

  const openDetailModal = async (mechanicId) => {
    setIsDetailModalVisible(true);
    setMechanicDetail(null);
    setDetailLoading(true);
    try {
      const data = await mechanicService.getMechanicById(mechanicId);
      setMechanicDetail(data);
    } catch {
      message.error('Không thể tải chi tiết thợ sửa xe!');
      setIsDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Xóa thợ sửa xe
  const handleDeleteMechanic = async (mechanicId) => {
    try {
      await mechanicService.deleteMechanic(mechanicId);
      message.success('Xóa thợ sửa xe thành công!');
      fetchMechanics();
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi xóa thợ!');
    }
  };

  // Lưu thợ sửa xe
  const handleSaveMechanic = async (values) => {
    try {
      if (editingMechanic) {
        // Cập nhật thợ sửa xe
        await mechanicService.updateMechanic(editingMechanic.id, values);
        message.success('Cập nhật thợ sửa xe thành công!');
      } else {
        // Thêm thợ sửa xe mới
        await mechanicService.createMechanic(values.branchId, values);
        message.success('Thêm thợ sửa xe thành công!');
      }
      setIsModalVisible(false);
      fetchMechanics();
    } catch (error) {
      console.error(error);
      message.error(editingMechanic ? 'Lỗi khi cập nhật thợ!' : 'Lỗi khi thêm thợ!');
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
      dataIndex: 'fullName',
      key: 'fullName',
      width: 160,
      render: (text, record) => (
        <div className="mechanic-name-cell">
          <div className="mechanic-avatar">
            {text ? text.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div className="mechanic-fullname">{text}</div>
            <div className="mechanic-branch-small">{record.branch?.name}</div>
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
      title: 'Chuyên môn',
      dataIndex: 'specialization',
      key: 'specialization',
      width: 180,
      render: (specialization) => (
        <Tag color="blue" className="specialization-tag">
          {specialization || 'Chưa cập nhật'}
        </Tag>
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
      render: (branch) => (
        <Tag 
          color="blue" 
          style={{ 
            whiteSpace: 'normal', 
            height: 'auto', 
            padding: '2px 8px', 
            display: 'inline-block',
            lineHeight: '1.4'
          }}
        >
          {branch || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const config = statusConfig[status] || { color: 'default', text: status || 'N/A' };
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
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetailModal(record.id)}
          />
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
                placeholder="Tìm kiếm theo tên, phone, chuyên môn, địa chỉ..."
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
                style={{ width: '100%' }}
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
                style={{ width: '100%' }}
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
                {mechanics.reduce((sum, m) => sum + (m.bookings?.length || 0), 0)}
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

      <Modal
        className="detail-modal"
        title="Chi tiết thợ sửa xe"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={720}
        loading={detailLoading}
      >
        {mechanicDetail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã thợ">#{mechanicDetail.id}</Descriptions.Item>
            <Descriptions.Item label="Họ và tên">
              <div className="mechanic-detail-name">
                <div className="mechanic-avatar">
                  {mechanicDetail.fullName ? mechanicDetail.fullName.charAt(0).toUpperCase() : '?'}
                </div>
                <span>{mechanicDetail.fullName || 'N/A'}</span>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {mechanicDetail.phone ? <a href={`tel:${mechanicDetail.phone}`}>{mechanicDetail.phone}</a> : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Chuyên môn">
              <Tag color="blue">{mechanicDetail.specialization || 'Chưa cập nhật'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{mechanicDetail.address || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Chi nhánh">
              {mechanicDetail.branch ? (
                <div>
                  <div>{mechanicDetail.branch.name || 'N/A'}</div>
                  <div className="mechanic-detail-muted">{mechanicDetail.branch.address || ''}</div>
                </div>
              ) : (
                'N/A'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={(statusConfig[mechanicDetail.status] || {}).color || 'default'}>
                {(statusConfig[mechanicDetail.status] || {}).text || mechanicDetail.status || 'N/A'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tham gia">
              {mechanicDetail.createdAt ? new Date(mechanicDetail.createdAt).toLocaleString('vi-VN') : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

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

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
  Image,
  Descriptions,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Car, Bike, User, Palette } from 'lucide-react';
import VehiclesForm from './VehiclesForm';
import vehicleService from '../../services/vehicleService';
import './Vehicles.css';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [brandFilter, setBrandFilter] = useState(undefined);
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [vehiclePagination, setVehiclePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [vehicleDetail, setVehicleDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, [vehiclePagination.current, vehiclePagination.pageSize, searchText, typeFilter, brandFilter, statusFilter]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getVehiclesPage({
        page: vehiclePagination.current,
        size: vehiclePagination.pageSize,
        keyword: searchText,
        type: typeFilter,
        brand: brandFilter,
        isActive: statusFilter,
      });

      if (Array.isArray(data)) {
        setVehicles(data);
        setVehiclePagination((prev) => ({ ...prev, total: data.length }));
      } else {
        setVehicles(data?.content || []);
        setVehiclePagination((prev) => ({
          ...prev,
          current: (data?.number ?? prev.current - 1) + 1,
          pageSize: data?.size || prev.pageSize,
          total: data?.totalElements || 0,
        }));
      }
    } catch (error) {
      console.error(error);
      message.error('Không thể tải danh sách phương tiện!');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const resetVehiclePagination = () => {
    setVehiclePagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
    resetVehiclePagination();
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
    resetVehiclePagination();
  };

  const handleBrandFilterChange = (value) => {
    setBrandFilter(value);
    resetVehiclePagination();
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    resetVehiclePagination();
  };

  const handleTableChange = (pagination) => {
    setVehiclePagination((prev) => ({
      ...prev,
      current: pagination.current || 1,
      pageSize: pagination.pageSize || prev.pageSize,
    }));
  };

  // Mở modal sửa phương tiện
  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalVisible(true);
  };

  const openDetailModal = async (vehicleId) => {
    setIsDetailModalVisible(true);
    setDetailLoading(true);
    try {
      const data = await vehicleService.getVehicleById(vehicleId);
      setVehicleDetail(data);
    } catch {
      message.error('Không thể tải chi tiết phương tiện!');
      setIsDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Xóa phương tiện
  const handleDeleteVehicle = async (vehicleId) => {
    try {
      await vehicleService.deleteVehicle(vehicleId);
      message.success('Xóa phương tiện thành công!');
      fetchVehicles(); // Reload danh sách
    } catch {
      message.error('Không thể xóa phương tiện!');
    }
  };

  // Lưu phương tiện
  const handleSaveVehicle = async (values) => {
    try {
      if (editingVehicle) {
        // Cập nhật phương tiện
        const { userId: _userId, ...vehicleData } = values;
        await vehicleService.updateVehicle(editingVehicle.id, vehicleData);
        message.success('Cập nhật phương tiện thành công!');
      } else {
        // Thêm phương tiện mới
        const { userId, ...vehicleData } = values;
        await vehicleService.createVehicle(userId, vehicleData);
        message.success('Thêm phương tiện thành công!');
      }
      setIsModalVisible(false);
      fetchVehicles(); // Reload danh sách
    } catch (error) {
      console.error(error);
      message.error(editingVehicle ? 'Không thể cập nhật phương tiện!' : 'Không thể thêm phương tiện!');
    }
  };

  // Cấu hình cột bảng
  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      render: (_, __, index) => (vehiclePagination.current - 1) * vehiclePagination.pageSize + index + 1,
    },
    {
      title: 'Loại xe',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Tag color={type === 'CAR' ? 'blue' : 'orange'}>
          {type === 'CAR' ? 'Ô tô' : 'Xe máy'}
        </Tag>
      ),
    },
    {
      title: 'Ảnh xe',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (imageUrl) => (
        <div className="vehicle-image-cell">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Ảnh xe"
              width={56}
              height={40}
              className="vehicle-thumbnail"
              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='40' viewBox='0 0 56 40'%3E%3Crect width='56' height='40' fill='%23f5f5f5'/%3E%3Cpath d='M14 25h28l-3-9H17z' fill='%23bfbfbf'/%3E%3Ccircle cx='20' cy='27' r='3' fill='%238c8c8c'/%3E%3Ccircle cx='36' cy='27' r='3' fill='%238c8c8c'/%3E%3C/svg%3E"
            />
          ) : (
            <span className="vehicle-image-empty">Chưa có ảnh</span>
          )}
        </div>
      ),
    },
    {
      title: 'Biển số',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 140,
      render: (plate, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#1890ff', marginBottom: '4px' }}>
            {plate}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {record.type === 'CAR' ? (
              <Car size={14} style={{ color: '#52c41a' }} />
            ) : (
              <Bike size={14} style={{ color: '#fa8c16' }} />
            )}
            <span style={{ fontSize: '12px', color: '#8c8c8c', fontWeight: 500 }}>
              {record.type === 'CAR' ? 'Ô tô' : 'Xe máy'}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Hãng',
      dataIndex: 'brand',
      key: 'brand',
      width: 120,
      render: (brand) => <span className="brand-cell">{brand}</span>,
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      width: 160,
      render: (model) => <span className="model-cell">{model}</span>,
    },
    {
      title: 'Màu sắc',
      dataIndex: 'color',
      key: 'color',
      width: 110,
      render: (color) => (
        <div className="color-cell">
          <Palette size={14} />
          <span>{color}</span>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 130,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Chủ sở hữu',
      dataIndex: 'ownerName',
      key: 'ownerName',
      width: 160,
      render: (ownerName) => (
        <div className="owner-cell">
          <User size={14} />
          <span className="owner-name">{ownerName || 'N/A'}</span>
        </div>
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
            onClick={() => handleEditVehicle(record)}
          />
          <Popconfirm
            title="Xóa phương tiện"
            description="Bạn có chắc muốn xóa phương tiện này?"
            onConfirm={() => handleDeleteVehicle(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Lấy danh sách các hãng xe độc nhất
  const brands = [...new Set(vehicles.filter(v => v && v.brand).map((v) => v.brand))].sort();

  return (
    <div className="vehicles-page">
      <div className="page-header">
        <h1>Quản lý phương tiện</h1>
        <p>Quản lý thông tin ô tô và xe máy của khách hàng</p>
      </div>

      <Card className="vehicles-card" bordered={false}>
        {/* Filters and Actions */}
        <div className="vehicles-toolbar">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={10}>
              <Input
                placeholder="Tìm kiếm biển số, model, chủ sở hữu..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={handleSearchChange}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Loại xe"
                value={typeFilter}
                onChange={handleTypeFilterChange}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: 'Ô tô', value: 'CAR' },
                  { label: 'Xe máy', value: 'MOTORBIKE' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Hãng xe"
                value={brandFilter}
                onChange={handleBrandFilterChange}
                allowClear
                style={{ width: '100%' }}
                options={brands.map((brand) => ({ label: brand, value: brand }))}
              />
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Trạng thái"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: 'Hoạt động', value: true },
                  { label: 'Không hoạt động', value: false },
                ]}
              />
            </Col>
          </Row>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">{vehiclePagination.total}</div>
              <div className="stat-label">Tổng phương tiện</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {vehicles.filter(v => v?.type === 'CAR').length}
              </div>
              <div className="stat-label">Ô tô</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {vehicles.filter(v => v?.type === 'MOTORBIKE').length}
              </div>
              <div className="stat-label">Xe máy</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">{vehiclePagination.total}</div>
              <div className="stat-label">Kết quả tìm kiếm</div>
            </div>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={vehicles}
          loading={loading}
          rowKey="id"
          pagination={{
            current: vehiclePagination.current,
            pageSize: vehiclePagination.pageSize,
            total: vehiclePagination.total,
            showTotal: (total) => `Tổng ${total} phương tiện`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="Chi tiết phương tiện"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={760}
        loading={detailLoading}
      >
        {vehicleDetail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã phương tiện">#{vehicleDetail.id}</Descriptions.Item>
            <Descriptions.Item label="Ảnh xe">
              {vehicleDetail.imageUrl ? (
                <Image
                  src={vehicleDetail.imageUrl}
                  alt="Ảnh xe"
                  width={220}
                  className="vehicle-detail-image"
                  fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='140' viewBox='0 0 220 140'%3E%3Crect width='220' height='140' fill='%23f5f5f5'/%3E%3Cpath d='M50 88h120l-14-38H64z' fill='%23bfbfbf'/%3E%3Ccircle cx='76' cy='96' r='12' fill='%238c8c8c'/%3E%3Ccircle cx='144' cy='96' r='12' fill='%238c8c8c'/%3E%3C/svg%3E"
                />
              ) : (
                'Chưa có ảnh'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Loại xe">
              <Tag color={vehicleDetail.type === 'CAR' ? 'blue' : 'orange'}>
                {vehicleDetail.type === 'CAR' ? 'Ô tô' : 'Xe máy'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Biển số">{vehicleDetail.licensePlate || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Hãng">{vehicleDetail.brand || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Model">{vehicleDetail.model || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Màu sắc">{vehicleDetail.color || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Chủ sở hữu">{vehicleDetail.ownerName || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={vehicleDetail.isActive ? 'green' : 'red'}>
                {vehicleDetail.isActive ? 'Hoạt động' : 'Không hoạt động'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Vehicle Form Modal */}
      <VehiclesForm
        visible={isModalVisible}
        editingVehicle={editingVehicle}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveVehicle}
      />
    </div>
  );
};

export default Vehicles;

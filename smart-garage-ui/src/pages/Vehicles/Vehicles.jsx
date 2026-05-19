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
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  // Fetch dữ liệu từ backend khi component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Hàm fetch danh sách phương tiện
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getAllVehicles();
      // Đảm bảo data là mảng
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      message.error('Không thể tải danh sách phương tiện!');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  // Lọc danh sách phương tiện
  const filteredVehicles = (vehicles || []).filter((vehicle) => {
    if (!vehicle) return false;
    
    const plate = (vehicle.licensePlate || '').toLowerCase();
    const model = (vehicle.model || '').toLowerCase();
    const owner = (vehicle.ownerName || '').toLowerCase();
    const search = searchText.toLowerCase();

    const matchSearch = plate.includes(search) || 
                        model.includes(search) || 
                        owner.includes(search);
                        
    const matchBrand = !brandFilter || vehicle.brand === brandFilter;
    const matchType = !typeFilter || vehicle.type === typeFilter;
    
    return matchSearch && matchBrand && matchType;
  });

  // Mở modal sửa phương tiện
  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalVisible(true);
  };

  // Xóa phương tiện
  const handleDeleteVehicle = async (vehicleId) => {
    try {
      await vehicleService.deleteVehicle(vehicleId);
      message.success('Xóa phương tiện thành công!');
      fetchVehicles(); // Reload danh sách
    } catch (error) {
      message.error('Không thể xóa phương tiện!');
    }
  };

  // Lưu phương tiện
  const handleSaveVehicle = async (values) => {
    try {
      if (editingVehicle) {
        // Cập nhật phương tiện
        const { userId, ...vehicleData } = values;
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
      render: (_, __, index) => index + 1,
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
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Loại xe"
                value={typeFilter}
                onChange={setTypeFilter}
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
                onChange={setBrandFilter}
                allowClear
                style={{ width: '100%' }}
                options={brands.map((brand) => ({ label: brand, value: brand }))}
              />
            </Col>

          </Row>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">{vehicles.length}</div>
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
              <div className="stat-value">{filteredVehicles.length}</div>
              <div className="stat-label">Kết quả tìm kiếm</div>
            </div>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredVehicles}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} phương tiện`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

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

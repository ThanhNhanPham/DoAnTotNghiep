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
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Bike, User, Palette } from 'lucide-react';
import MotorbikesForm from './MotorbikesForm';
import motorbikeService from '../../services/motorbikeService';
import './Motorbikes.css';

const Motorbikes = () => {
  const [motorbikes, setMotorbikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMotorbike, setEditingMotorbike] = useState(null);

  // Fetch dữ liệu từ backend khi component mount
  useEffect(() => {
    fetchMotorbikes();
  }, []);

  // Hàm fetch danh sách xe máy
  const fetchMotorbikes = async () => {
    setLoading(true);
    try {
      const data = await motorbikeService.getAllMotorbikes();
      setMotorbikes(data);
    } catch (error) {
      message.error('Không thể tải danh sách xe máy!');
    } finally {
      setLoading(false);
    }
  };

  // Lọc danh sách xe máy
  const filteredMotorbikes = motorbikes.filter((bike) => {
    const matchSearch = bike.licensePlate.toLowerCase().includes(searchText.toLowerCase()) ||
                        bike.model.toLowerCase().includes(searchText.toLowerCase()) ||
                        (bike.user?.name && bike.user.name.toLowerCase().includes(searchText.toLowerCase()));
    const matchBrand = !brandFilter || bike.brand === brandFilter;
    return matchSearch && matchBrand;
  });

  // Mở modal thêm xe máy
  const handleAddMotorbike = () => {
    setEditingMotorbike(null);
    setIsModalVisible(true);
  };

  // Mở modal sửa xe máy
  const handleEditMotorbike = (bike) => {
    setEditingMotorbike(bike);
    setIsModalVisible(true);
  };

  // Xóa xe máy
  const handleDeleteMotorbike = async (bikeId) => {
    try {
      await motorbikeService.deleteMotorbike(bikeId);
      message.success('Xóa xe máy thành công!');
      fetchMotorbikes(); // Reload danh sách
    } catch (error) {
      message.error('Không thể xóa xe máy!');
    }
  };

  // Lưu xe máy
  const handleSaveMotorbike = async (values) => {
    try {
      if (editingMotorbike) {
        // Cập nhật xe máy
        const { userId, ...motorbikeData } = values;
        await motorbikeService.updateMotorbike(editingMotorbike.id, motorbikeData);
        message.success('Cập nhật xe máy thành công!');
      } else {
        // Thêm xe máy mới - cần userId
        if (!values.userId) {
          message.error('Vui lòng chọn chủ sở hữu!');
          return;
        }
        const { userId, ...motorbikeData } = values;
        await motorbikeService.createMotorbike(userId, motorbikeData);
        message.success('Thêm xe máy thành công!');
      }
      setIsModalVisible(false);
      fetchMotorbikes(); // Reload danh sách
    } catch (error) {
      message.error(editingMotorbike ? 'Không thể cập nhật xe máy!' : 'Không thể thêm xe máy!');
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
      title: 'Biển số',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 130,
      render: (plate) => (
        <div className="plate-cell">
          <Bike size={16} />
          <span className="plate-text">{plate}</span>
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
      title: 'Chủ sở hữu',
      dataIndex: ['user', 'name'],
      key: 'userName',
      width: 160,
      render: (name, record) => (
        <div className="owner-cell">
          <User size={14} />
          <div>
            <div className="owner-name">{record.user?.name || 'N/A'}</div>
            <div className="owner-email">{record.user?.email || ''}</div>
          </div>
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
            onClick={() => handleEditMotorbike(record)}
          />
          <Popconfirm
            title="Xóa xe máy"
            description="Bạn có chắc muốn xóa xe máy này?"
            onConfirm={() => handleDeleteMotorbike(record.id)}
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
  const brands = [...new Set(motorbikes.filter(b => b.brand).map((b) => b.brand))].sort();

  return (
    <div className="motorbikes-page">
      <div className="page-header">
        <h1>Quản lý xe máy</h1>
        <p>Quản lý thông tin xe máy của khách hàng</p>
      </div>

      <Card className="motorbikes-card" bordered={false}>
        {/* Filters and Actions */}
        <div className="motorbikes-toolbar">
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

            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Hãng xe"
                value={brandFilter}
                onChange={setBrandFilter}
                allowClear
                options={brands.map((brand) => ({ label: brand, value: brand }))}
              />
            </Col>

            <Col xs={24} sm={12} md={8} className="text-right">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddMotorbike}
              >
                Thêm xe máy
              </Button>
            </Col>
          </Row>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">{motorbikes.length}</div>
              <div className="stat-label">Tổng xe máy</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">{brands.length}</div>
              <div className="stat-label">Hãng xe</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {[...new Set(motorbikes.filter(b => b.user?.id).map((b) => b.user.id))].length}
              </div>
              <div className="stat-label">Chủ sở hữu</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">{filteredMotorbikes.length}</div>
              <div className="stat-label">Kết quả tìm kiếm</div>
            </div>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredMotorbikes}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} xe máy`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Motorbike Form Modal */}
      <MotorbikesForm
        visible={isModalVisible}
        editingMotorbike={editingMotorbike}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveMotorbike}
        motorbikes={motorbikes}
      />
    </div>
  );
};

export default Motorbikes;

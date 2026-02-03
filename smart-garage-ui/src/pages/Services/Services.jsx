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
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Wrench, DollarSign, Clock } from 'lucide-react';
import ServicesForm from './ServicesForm';
import serviceService from '../../services/serviceService';
import './Services.css';

const Services = () => {
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Fetch dữ liệu từ backend khi component mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Hàm fetch danh sách dịch vụ
  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await serviceService.getAllServices();
      setServices(data);
    } catch (error) {
      message.error('Không thể tải danh sách dịch vụ!');
    } finally {
      setLoading(false);
    }
  };

  // Lọc danh sách dịch vụ
  const filteredServices = services.filter((service) => {
    const matchSearch = service.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                        service.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !statusFilter || (statusFilter === 'active' ? service.isActive : !service.isActive);
    return matchSearch && matchStatus;
  });

  // Mở modal thêm dịch vụ
  const handleAddService = () => {
    setEditingService(null);
    setIsModalVisible(true);
  };

  // Mở modal sửa dịch vụ
  const handleEditService = (service) => {
    setEditingService(service);
    setIsModalVisible(true);
  };

  // Xóa dịch vụ
  const handleDeleteService = async (serviceId) => {
    try {
      await serviceService.deleteService(serviceId);
      message.success('Xóa dịch vụ thành công!');
      fetchServices(); // Reload danh sách
    } catch (error) {
      message.error('Không thể xóa dịch vụ!');
    }
  };

  // Lưu dịch vụ
  const handleSaveService = async (values) => {
    try {
      console.log('Saving service with values:', values);
      console.log('Editing service:', editingService);
      if (editingService) {
        // Cập nhật dịch vụ
        console.log('Updating service ID:', editingService.id);
        await serviceService.updateService(editingService.id, values);
        message.success('Cập nhật dịch vụ thành công!');
      } else {
        // Thêm dịch vụ mới
        await serviceService.createService(values);
        message.success('Thêm dịch vụ thành công!');
      }
      setIsModalVisible(false);
      fetchServices(); // Reload danh sách
    } catch (error) {
      console.error('Save error:', error);
      message.error(editingService ? 'Không thể cập nhật dịch vụ!' : 'Không thể thêm dịch vụ!');
    }
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
      title: 'Tên dịch vụ',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text, record) => (
        <div className="service-name-cell">
          <Wrench size={16} className="service-icon" />
          <div>
            <div className="service-title">{text}</div>
            <div className="service-desc">{record.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Giá dịch vụ',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      render: (price) => (
        <div className="price-cell">
          <DollarSign size={14} />
          <span>{price.toLocaleString('vi-VN')} đ</span>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'durationMinutes',
      key: 'durationMinutes',
      width: 110,
      render: (duration) => (
        <div className="duration-cell">
          <Clock size={14} />
          <span>{duration} phút</span>
        </div>
      ),
    },
    {
      title: 'Phụ tùng gợi ý',
      dataIndex: 'suggestedParts',
      key: 'suggestedParts',
      width: 130,
      render: (parts) => (
        <Tag>{parts} phụ tùng</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (text, record) => {
        console.log('Rendering action buttons for record:', record.id);
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                padding: '4px 15px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onClick={() => {
                console.log('***** BUTTON CLICKED *****');
                console.log('Service ID:', record.id);
                console.log('Service Name:', record.name);
                setEditingService(record);
                setIsModalVisible(true);
                console.log('Modal should be visible now');
              }}
            >
              Chỉnh sửa
            </button>
            <button
              style={{
                padding: '4px 15px',
                backgroundColor: '#ff4d4f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onClick={() => handleDeleteService(record.id)}
            >
              Xóa
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="services-page">
      <div className="page-header">
        <h1>Quản lý dịch vụ</h1>
        <p>Quản lý các dịch vụ sửa chữa và bảo dưỡng xe máy</p>
      </div>

      <Card className="services-card" bordered={false}>
        {/* Filters and Actions */}
        <div className="services-toolbar">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Tìm kiếm theo tên hoặc mô tả..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                options={[
                  { label: 'Hoạt động', value: 'active' },
                  { label: 'Không hoạt động', value: 'inactive' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={6} className="text-right">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddService}
              >
                Thêm dịch vụ
              </Button>
            </Col>
          </Row>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">{services.length}</div>
              <div className="stat-label">Tổng dịch vụ</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {services.filter((s) => s.isActive).length}
              </div>
              <div className="stat-label">Đang hoạt động</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {services.filter((s) => !s.isActive).length}
              </div>
              <div className="stat-label">Không hoạt động</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-value">
                {(services.reduce((sum, s) => sum + s.price, 0) / services.length / 1000).toFixed(0)}k
              </div>
              <div className="stat-label">Giá TB</div>
            </div>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredServices}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} dịch vụ`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* Service Form Modal */}
      {console.log('isModalVisible:', isModalVisible, 'editingService:', editingService)}
      <ServicesForm
        visible={isModalVisible}
        editingService={editingService}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveService}
        loading={loading}
      />
    </div>
  );
};

export default Services;

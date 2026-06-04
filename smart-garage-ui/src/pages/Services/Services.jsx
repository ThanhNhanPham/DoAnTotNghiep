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
import { Wrench, DollarSign, Clock } from 'lucide-react';
import ServicesForm from './ServicesForm';
import serviceService from '../../services/serviceService';
import './Services.css';

const Services = () => {
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [servicePagination, setServicePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [serviceDetail, setServiceDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `${amount.toLocaleString('vi-VN')} đ`;
  };

  const getVehicleTypeLabel = (type) => {
    if (type === 'CAR') return 'Ô tô';
    if (type === 'MOTORBIKE') return 'Xe máy';
    return type || 'N/A';
  };

  useEffect(() => {
    fetchServices();
  }, [servicePagination.current, servicePagination.pageSize, statusFilter, typeFilter, searchText]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await serviceService.getServicesPage({
        page: servicePagination.current,
        size: servicePagination.pageSize,
        status: statusFilter,
        type: typeFilter,
        keyword: searchText,
      });

      if (Array.isArray(data)) {
        setServices(data);
        setServicePagination((prev) => ({ ...prev, total: data.length }));
      } else {
        setServices(data?.content || []);
        setServicePagination((prev) => ({
          ...prev,
          current: (data?.number ?? prev.current - 1) + 1,
          pageSize: data?.size || prev.pageSize,
          total: data?.totalElements || 0,
        }));
      }
    } catch {
      message.error('Không thể tải danh sách dịch vụ!');
    } finally {
      setLoading(false);
    }
  };

  const resetServicePagination = () => {
    setServicePagination((prev) => ({ ...prev, current: 1 }));
  };

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

  const openDetailModal = async (serviceId) => {
    setIsDetailModalVisible(true);
    setServiceDetail(null);
    setDetailLoading(true);
    try {
      const data = await serviceService.getServiceById(serviceId);
      setServiceDetail(data);
    } catch {
      message.error('Không thể tải chi tiết dịch vụ!');
      setIsDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Xóa dịch vụ
  const handleDeleteService = async (serviceId) => {
    try {
      await serviceService.deleteService(serviceId);
      message.success('Xóa dịch vụ thành công!');
      fetchServices(); // Reload danh sách
    } catch {
      message.error('Không thể xóa dịch vụ!');
    }
  };

  // Lưu dịch vụ
  const handleSaveService = async (values) => {
    try {
      const payload = {
        ...(editingService || {}),
        ...values,
        price: Number(values.price),
        durationMinutes: Number(values.durationMinutes),
      };
      delete payload.suggestedParts;

      if (editingService) {
        // Cập nhật dịch vụ
        await serviceService.updateService(editingService.id, payload);
        message.success('Cập nhật dịch vụ thành công!');
      } else {
        // Thêm dịch vụ mới
        await serviceService.createService(payload);
        message.success('Thêm dịch vụ thành công!');
      }
      setIsModalVisible(false);
      fetchServices(); // Reload danh sách
    } catch (error) {
      console.error('Save error:', error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message;
      message.error(serverMessage || (editingService ? 'Không thể cập nhật dịch vụ!' : 'Không thể thêm dịch vụ!'));
    }
  };

  // Cấu hình cột bảng
  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_, __, index) => (servicePagination.current - 1) * servicePagination.pageSize + index + 1,
    },
    {
      title: 'Tên dịch vụ',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text, record) => (
        <div className="service-name-cell">
          <Wrench size={16} className="service-icon" />
          <div className="service-title">{text}</div>
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
          <span>{formatCurrency(price)}</span>
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
        <Tag>{Array.isArray(parts) ? parts.length : Number(parts || 0)} phụ tùng</Tag>
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
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => openDetailModal(record.id)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
  
              onClick={() => handleEditService(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa dịch vụ này?"
              onConfirm={() => handleDeleteService(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                type="primary"
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
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
                onChange={(e) => {
                  setSearchText(e.target.value);
                  resetServicePagination();
                }}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Trạng thái"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  resetServicePagination();
                }}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: 'Hoạt động', value: 'active' },
                  { label: 'Không hoạt động', value: 'inactive' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Loại xe"
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value);
                  resetServicePagination();
                }}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: 'Xe máy', value: 'MOTORBIKE' },
                  { label: 'Ô tô', value: 'CAR' },
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
              <div className="stat-value">{servicePagination.total}</div>
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
                {services.length > 0
                  ? `${(services.reduce((sum, s) => sum + Number(s.price || 0), 0) / services.length / 1000).toFixed(0)}k`
                  : '0k'}
              </div>
              <div className="stat-label">Giá TB</div>
            </div>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={services}
          loading={loading}
          rowKey="id"
          pagination={{
            current: servicePagination.current,
            pageSize: servicePagination.pageSize,
            total: servicePagination.total,
            showTotal: (total) => `Tổng ${total} dịch vụ`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          onChange={(pagination) => {
            setServicePagination((prev) => ({
              ...prev,
              current: pagination.current || 1,
              pageSize: pagination.pageSize || prev.pageSize,
            }));
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        className="detail-modal"
        title="Chi tiết dịch vụ"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={760}
        loading={detailLoading}
      >
        {serviceDetail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã dịch vụ">#{serviceDetail.id}</Descriptions.Item>
            <Descriptions.Item label="Ảnh dịch vụ">
              {serviceDetail.imageUrl ? (
                <Image
                  src={serviceDetail.imageUrl}
                  alt="Ảnh dịch vụ"
                  width={240}
                  className="service-detail-image"
                />
              ) : (
                'Chưa có ảnh'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Tên dịch vụ">
              <div className="service-detail-name">
                <Wrench size={16} className="service-icon" />
                <span>{serviceDetail.name || 'N/A'}</span>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả">{serviceDetail.description || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Loại xe áp dụng">
              <Tag color={serviceDetail.type === 'CAR' ? 'blue' : 'orange'}>
                {getVehicleTypeLabel(serviceDetail.type)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Giá dịch vụ">{formatCurrency(serviceDetail.price)}</Descriptions.Item>
            <Descriptions.Item label="Thời gian thực hiện">
              {serviceDetail.durationMinutes ? `${serviceDetail.durationMinutes} phút` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Phụ tùng gợi ý">
              {Array.isArray(serviceDetail.suggestedParts) && serviceDetail.suggestedParts.length > 0 ? (
                <Space wrap>
                  {serviceDetail.suggestedParts.map((part) => (
                    <Tag key={part.id || part.name}>{part.name || `#${part.id}`}</Tag>
                  ))}
                </Space>
              ) : (
                'Chưa có phụ tùng gợi ý'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={serviceDetail.isActive ? 'green' : 'red'}>
                {serviceDetail.isActive ? 'Hoạt động' : 'Không hoạt động'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Service Form Modal */}
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

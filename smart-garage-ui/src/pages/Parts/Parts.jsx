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
import { Package, DollarSign } from 'lucide-react';
import PartsForm from './PartsForm';
import './Parts.css';

const Parts = () => {
  const [parts, setParts] = useState([
    {
      id: 1,
      name: 'Nhớt Castrol 10W40',
      description: 'Nhớt tổng hợp cao cấp cho động cơ xe máy',
      quantity: 50,
      price: 120000,
      unit: 'Lít',
    },
    {
      id: 2,
      name: 'Lốp Michelin Pilot Street 2',
      description: 'Lốp xe máy cao cấp, độ bám đường tốt',
      quantity: 8,
      price: 450000,
      unit: 'Cái',
    },
    {
      id: 3,
      name: 'Phanh trước AB-100',
      description: 'Má phanh chính hãng cho xe tay ga',
      quantity: 3,
      price: 250000,
      unit: 'Bộ',
    },
    {
      id: 4,
      name: 'Bugi NGK CPR7EA-9',
      description: 'Bugi chuẩn cho động cơ 150cc',
      quantity: 0,
      price: 45000,
      unit: 'Cái',
    },
    {
      id: 5,
      name: 'Dây curoa đai',
      description: 'Dây đai truyền động chính hãng Honda',
      quantity: 25,
      price: 180000,
      unit: 'Sợi',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPart, setEditingPart] = useState(null);

  // Lọc danh sách phụ tùng
  const filteredParts = parts.filter((part) => {
    const matchSearch =
      part.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (part.description && part.description.toLowerCase().includes(searchText.toLowerCase()));
    const matchStatus = !statusFilter || 
      (statusFilter === 'in-stock' && part.quantity > 0) ||
      (statusFilter === 'out-of-stock' && part.quantity === 0);
    return matchSearch && matchStatus;
  });

  // Mở modal thêm phụ tùng
  const handleAddPart = () => {
    setEditingPart(null);
    setIsModalVisible(true);
  };

  // Mở modal sửa phụ tùng
  const handleEditPart = (part) => {
    setEditingPart(part);
    setIsModalVisible(true);
  };

  // Xóa phụ tùng
  const handleDeletePart = (partId) => {
    setParts(parts.filter((p) => p.id !== partId));
    message.success('Xóa phụ tùng thành công!');
  };

  // Lưu phụ tùng
  const handleSavePart = (values) => {
    if (editingPart) {
      // Cập nhật phụ tùng
      setParts(parts.map((p) =>
        p.id === editingPart.id ? { ...p, ...values } : p
      ));
      message.success('Cập nhật phụ tùng thành công!');
    } else {
      // Thêm phụ tùng mới
      const newPart = {
        id: Math.max(...parts.map((p) => p.id), 0) + 1,
        ...values,
      };
      setParts([...parts, newPart]);
      message.success('Thêm phụ tùng thành công!');
    }
    setIsModalVisible(false);
  };

  // Hàm xác định trạng thái kho
  const getStockStatus = (part) => {
    if (part.quantity === 0) {
      return { color: 'red', text: 'Hết hàng', status: 'out' };
    } else {
      return { color: 'green', text: 'Còn hàng', status: 'in' };
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
      title: 'Tên phụ tùng',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text, record) => (
        <div className="part-name-cell">
          <Package size={16} className="part-icon" />
          <div>
            <div className="part-title">{text}</div>
            <div className="part-desc">{record.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 110,
      align: 'center',
      render: (quantity, record) => {
        const status = getStockStatus(record);
        return (
          <div className={`quantity-cell quantity-${status.status}`}>
            <span>{quantity}</span>
          </div>
        );
      },
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 100,
      align: 'center',
      render: (unit) => <Tag>{unit}</Tag>,
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 130,
      render: (price) => (
        <div className="price-cell">
          <DollarSign size={14} />
          <span>{price.toLocaleString('vi-VN')} đ</span>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'stockStatus',
      width: 120,
      render: (_, record) => {
        const status = getStockStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
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
            onClick={() => handleEditPart(record)}
          />
          <Popconfirm
            title="Xóa phụ tùng"
            description="Bạn có chắc muốn xóa phụ tùng này?"
            onConfirm={() => handleDeletePart(record.id)}
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
    <div className="parts-page">
      <div className="page-header">
        <h1>Quản lý kho phụ tùng</h1>
        <p>Quản lý tồn kho và phụ tùng thay thế</p>
      </div>

      <Card className="parts-card" bordered={false}>
        {/* Filters and Actions */}
        <div className="parts-toolbar">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={10}>
              <Input
                placeholder="Tìm kiếm theo tên, mô tả..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Trạng thái kho"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: 'Còn hàng', value: 'in-stock' },
                  { label: 'Hết hàng', value: 'out-of-stock' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={8} className="text-right">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddPart}
              >
                Thêm phụ tùng
              </Button>
            </Col>
          </Row>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8}>
            <div className="stat-item">
              <div className="stat-value">{parts.length}</div>
              <div className="stat-label">Tổng phụ tùng</div>
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div className="stat-item stat-in-stock">
              <div className="stat-value">
                {parts.filter((p) => p.quantity > 0).length}
              </div>
              <div className="stat-label">Còn hàng</div>
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div className="stat-item stat-out-stock">
              <div className="stat-value">
                {parts.filter((p) => p.quantity === 0).length}
              </div>
              <div className="stat-label">Hết hàng</div>
            </div>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredParts}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} phụ tùng`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 1600 }}
        />
      </Card>

      {/* Part Form Modal */}
      <PartsForm
        visible={isModalVisible}
        editingPart={editingPart}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSavePart}
      />
    </div>
  );
};

export default Parts;

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
import { Calendar, User, Car, Building2, Wrench, DollarSign } from 'lucide-react';
import BookingsForm from './BookingsForm';
import './Bookings.css';

const Bookings = () => {
  const [bookings, setBookings] = useState([
    {
      id: 1,
      user: { id: 1, fullName: 'Nguyễn Văn A', phone: '0901234567' },
      motorbike: { id: 1, licensePlate: '59A-12345', brand: 'Honda' },
      branch: { id: 1, name: 'Chi nhánh Quận 1' },
      mechanic: { id: 1, fullName: 'Trần Văn B' },
      bookingTime: '2024-12-20T10:00:00',
      status: 'CONFIRMED',
      note: 'Khách yêu cầu sửa nhanh',
      totalAmount: 500000,
      createdAt: '2024-12-15T08:30:00',
    },
    {
      id: 2,
      user: { id: 2, fullName: 'Trần Thị B', phone: '0912345678' },
      motorbike: { id: 2, licensePlate: '59B-67890', brand: 'Yamaha' },
      branch: { id: 2, name: 'Chi nhánh Quận 3' },
      mechanic: null,
      bookingTime: '2024-12-21T14:00:00',
      status: 'PENDING',
      note: '',
      totalAmount: 0,
      createdAt: '2024-12-16T09:00:00',
    },
    {
      id: 3,
      user: { id: 3, fullName: 'Lê Văn C', phone: '0923456789' },
      motorbike: { id: 3, licensePlate: '59C-11111', brand: 'Honda' },
      branch: { id: 1, name: 'Chi nhánh Quận 1' },
      mechanic: { id: 2, fullName: 'Phạm Thị D' },
      bookingTime: '2024-12-18T09:00:00',
      status: 'COMPLETED',
      note: '',
      totalAmount: 750000,
      createdAt: '2024-12-10T10:00:00',
    },
    {
      id: 4,
      user: { id: 4, fullName: 'Phạm Thị D', phone: '0934567890' },
      motorbike: { id: 4, licensePlate: '59D-22222', brand: 'Suzuki' },
      branch: { id: 3, name: 'Chi nhánh Bình Thạnh' },
      mechanic: null,
      bookingTime: '2024-12-19T15:00:00',
      status: 'CANCELLED',
      note: 'Khách hủy lịch',
      totalAmount: 0,
      createdAt: '2024-12-12T11:00:00',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  // Danh sách chi nhánh (mock - trong thực tế sẽ fetch từ API)
  const branches = [
    { id: 1, name: 'Chi nhánh Quận 1' },
    { id: 2, name: 'Chi nhánh Quận 3' },
    { id: 3, name: 'Chi nhánh Bình Thạnh' },
  ];

  // Lọc danh sách đặt lịch
  const filteredBookings = bookings.filter((booking) => {
    const matchSearch =
      booking.user.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.motorbike.licensePlate.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !statusFilter || booking.status === statusFilter;
    const matchBranch = !branchFilter || booking.branch.id === branchFilter;
    return matchSearch && matchStatus && matchBranch;
  });

  // Mở modal thêm đặt lịch
  const handleAddBooking = () => {
    setEditingBooking(null);
    setIsModalVisible(true);
  };

  // Mở modal sửa đặt lịch
  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setIsModalVisible(true);
  };

  // Xóa đặt lịch
  const handleDeleteBooking = (bookingId) => {
    setBookings(bookings.filter((b) => b.id !== bookingId));
    message.success('Xóa đặt lịch thành công!');
  };

  // Lưu đặt lịch
  const handleSaveBooking = (values) => {
    if (editingBooking) {
      // Cập nhật đặt lịch
      setBookings(
        bookings.map((b) =>
          b.id === editingBooking.id ? { ...b, ...values } : b
        )
      );
      message.success('Cập nhật đặt lịch thành công!');
    } else {
      // Thêm đặt lịch mới
      const newBooking = {
        id: Math.max(...bookings.map((b) => b.id), 0) + 1,
        ...values,
        createdAt: new Date().toISOString(),
      };
      setBookings([...bookings, newBooking]);
      message.success('Thêm đặt lịch thành công!');
    }
    setIsModalVisible(false);
  };

  // Cấu hình trạng thái
  const statusConfig = {
    PENDING: { color: 'orange', text: 'Chờ xử lý' },
    CONFIRMED: { color: 'blue', text: 'Đã xác nhận' },
    COMPLETED: { color: 'green', text: 'Hoàn thành' },
    CANCELLED: { color: 'red', text: 'Đã hủy' },
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
      title: 'Khách hàng',
      dataIndex: 'user',
      key: 'user',
      width: 180,
      render: (user) => (
        <div className="user-cell">
          <User size={14} />
          <div>
            <div className="user-name">{user.fullName}</div>
            <div className="user-phone">{user.phone}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Xe',
      dataIndex: 'motorbike',
      key: 'motorbike',
      width: 150,
      render: (motorbike) => (
        <div className="motorbike-cell">
          <Car size={14} />
          <div>
            <div className="license-plate">{motorbike.licensePlate}</div>
            <div className="brand">{motorbike.brand}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Chi nhánh',
      dataIndex: 'branch',
      key: 'branch',
      width: 150,
      render: (branch) => (
        <div className="branch-cell">
          <Building2 size={14} />
          <span>{branch.name}</span>
        </div>
      ),
    },
    {
      title: 'Thợ sửa',
      dataIndex: 'mechanic',
      key: 'mechanic',
      width: 150,
      render: (mechanic) => (
        <div className="mechanic-cell">
          <Wrench size={14} />
          <span>{mechanic ? mechanic.fullName : 'Chưa phân công'}</span>
        </div>
      ),
    },
    {
      title: 'Thời gian đặt',
      dataIndex: 'bookingTime',
      key: 'bookingTime',
      width: 160,
      render: (time) => (
        <div className="time-cell">
          <Calendar size={14} />
          <span>{new Date(time).toLocaleString('vi-VN')}</span>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => {
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      render: (amount) => (
        <div className="amount-cell">
          <DollarSign size={14} />
          <span>{amount.toLocaleString('vi-VN')} đ</span>
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
            onClick={() => handleEditBooking(record)}
          />
          <Popconfirm
            title="Xóa đặt lịch"
            description="Bạn có chắc muốn xóa đặt lịch này?"
            onConfirm={() => handleDeleteBooking(record.id)}
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
    <div className="bookings-page">
      <div className="page-header">
        <h1>Quản lý đặt lịch</h1>
        <p>Quản lý các lịch hẹn sửa chữa và bảo dưỡng xe</p>
      </div>

      <Card className="bookings-card" bordered={false}>
        {/* Filters and Actions */}
        <div className="bookings-toolbar">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Tìm kiếm theo khách hàng, biển số..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: 'Chờ xử lý', value: 'PENDING' },
                  { label: 'Đã xác nhận', value: 'CONFIRMED' },
                  { label: 'Hoàn thành', value: 'COMPLETED' },
                  { label: 'Đã hủy', value: 'CANCELLED' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Chi nhánh"
                value={branchFilter}
                onChange={setBranchFilter}
                allowClear
                style={{ width: '100%' }}
                options={branches.map((b) => ({ label: b.name, value: b.id }))}
              />
            </Col>

            <Col xs={24} sm={12} md={6} className="text-right">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddBooking}
              >
                Thêm đặt lịch
              </Button>
            </Col>
          </Row>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6} md={4}>
            <div className="stat-item">
              <div className="stat-value">{bookings.length}</div>
              <div className="stat-label">Tổng đơn</div>
            </div>
          </Col>
          <Col xs={12} sm={6} md={5}>
            <div className="stat-item stat-pending">
              <div className="stat-value">
                {bookings.filter((b) => b.status === 'PENDING').length}
              </div>
              <div className="stat-label">Chờ xử lý</div>
            </div>
          </Col>
          <Col xs={12} sm={6} md={5}>
            <div className="stat-item stat-confirmed">
              <div className="stat-value">
                {bookings.filter((b) => b.status === 'CONFIRMED').length}
              </div>
              <div className="stat-label">Đã xác nhận</div>
            </div>
          </Col>
          <Col xs={12} sm={6} md={5}>
            <div className="stat-item stat-completed">
              <div className="stat-value">
                {bookings.filter((b) => b.status === 'COMPLETED').length}
              </div>
              <div className="stat-label">Hoàn thành</div>
            </div>
          </Col>
          <Col xs={12} sm={6} md={5}>
            <div className="stat-item stat-cancelled">
              <div className="stat-value">
                {bookings.filter((b) => b.status === 'CANCELLED').length}
              </div>
              <div className="stat-label">Đã hủy</div>
            </div>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredBookings}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} đặt lịch`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* Booking Form Modal */}
      <BookingsForm
        visible={isModalVisible}
        editingBooking={editingBooking}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveBooking}
        branches={branches}
      />
    </div>
  );
};

export default Bookings;

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Popconfirm,
  Row,
  Col,
  Select,
  message,
  Tooltip,
  Modal,
  Form
} from 'antd';
import {
  DeleteOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { Calendar, User, Car, Bike, Building2, Wrench, DollarSign } from 'lucide-react';
import bookingService from '../../services/bookingService';
import branchService from '../../services/branchService';
import mechanicService from '../../services/mechanicService';
import './Bookings.css';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [branchFilter, setBranchFilter] = useState(undefined);

  // States for Confirming Booking
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [bookingToConfirm, setBookingToConfirm] = useState(null);
  const [mechanics, setMechanics] = useState([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState(undefined);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchBranches();
    fetchMechanics();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getAllBookings();
      setBookings(data || []);
    } catch (error) {
      message.error('Lỗi khi tải danh sách lịch hẹn!');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await branchService.getActiveBranches();
      setBranches(data || []);
    } catch (error) {
      message.error('Lỗi khi tải danh sách chi nhánh!');
    }
  };

  const fetchMechanics = async () => {
    try {
      const data = await mechanicService.getAllMechanics(); // you can filter active ones later
      setMechanics(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((booking) => {
    const userStr = booking.vehicleOwnerName || booking.customerName || booking.user?.fullName || booking.userName || booking.email || '';
    const plateStr = booking.vehicle?.licensePlate || booking.licensePlate || '';
    const matchSearch =
      userStr.toLowerCase().includes(searchText.toLowerCase()) ||
      plateStr.toLowerCase().includes(searchText.toLowerCase());
    
    // Fallbacks because response schema is unknown yet
    const currentStatus = booking.status || 'PENDING'; 
    const matchStatus = !statusFilter || currentStatus === statusFilter;
    
    const branchId = booking.branch?.id || booking.branchId;
    const matchBranch = !branchFilter || branchId === branchFilter;
    
    return matchSearch && matchStatus && matchBranch;
  });

  const handleDeleteBooking = async (bookingId) => {
    try {
      await bookingService.cancelBooking(bookingId);
      message.success('Đã xóa/hủy lịch hẹn thành công!');
      fetchBookings();
    } catch (error) {
       message.error('Lỗi khi hủy lịch hẹn!');
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      await bookingService.completeBooking(bookingId);
      message.success('Đánh dấu hoàn thành lịch sửa xe thành công!');
      fetchBookings();
    } catch (error) {
      message.error('Lỗi khi hoàn thành lịch hẹn!');
    }
  };
  
  // Logic to show confirm modal
  const openConfirmModal = (booking) => {
    setBookingToConfirm(booking);
    setSelectedMechanicId(undefined);
    setIsConfirmModalVisible(true);
  };
  
  const handleConfirmBooking = async () => {
    if (!selectedMechanicId) {
      message.warning('Vui lòng chọn thợ sửa xe!');
      return;
    }
    setConfirmLoading(true);
    try {
      await bookingService.confirmBooking(bookingToConfirm.id, selectedMechanicId);
      message.success('Xác nhận lịch hẹn thành công!');
      setIsConfirmModalVisible(false);
      fetchBookings();
    } catch (error) {
      message.error('Lỗi khi xác nhận lịch hẹn!');
    } finally {
      setConfirmLoading(false);
    }
  };

  const statusConfig = {
    PENDING: { color: 'orange', text: 'Chờ xử lý' },
    CONFIRMED: { color: 'blue', text: 'Đã xác nhận' },
    COMPLETED: { color: 'green', text: 'Hoàn thành' },
    CANCELLED: { color: 'red', text: 'Đã hủy' },
  };

  const paymentMethodConfig = {
    CASH: { color: 'default', text: 'Tiền mặt' },
    MOMO: { color: 'magenta', text: 'MoMo' },
    BANK_TRANSFER: { color: 'geekblue', text: 'Chuyển khoản' },
  };

  const paymentStatusConfig = {
    PENDING: { color: 'orange', text: 'Chờ thanh toán' },
    SUCCESS: { color: 'green', text: 'Đã thanh toán' },
    FAILED: { color: 'red', text: 'Thất bại' },
    CANCELLED: { color: 'default', text: 'Đã hủy' },
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('vi-VN');
  };

  const renderTagList = (items, emptyText = 'Chưa có') => {
    if (!items || items.length === 0) {
      return <span style={{ color: '#8c8c8c' }}>{emptyText}</span>;
    }

    return (
      <Space size={[4, 4]} wrap>
        {items.map((item) => (
          <Tag key={item} color="processing" style={{ marginInlineEnd: 0 }}>
            {item}
          </Tag>
        ))}
      </Space>
    );
  };

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
      key: 'user',
      width: 180,
      render: (_, record) => {
        const name = record.vehicleOwnerName || record.customerName || record.user?.fullName || record.userName || record.user?.name || 'Khách Vãng Lai';
        const phone = record.customerPhone || record.user?.phone || record.phone || '';
        return (
          <div className="user-cell">
            <User size={14} />
            <div>
              <div className="user-name">{name}</div>
              <div className="user-phone">{phone}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Phương tiện',
      key: 'vehicle',
      width: 200,
      render: (_, record) => {
        const plate = record.vehicle?.licensePlate || record.licensePlate || 'Chưa rõ';
        const vehicleName = record.vehicleName || record.vehicle?.name || record.brand || '';
        const type = record.vehicle?.type || 'MOTORBIKE';
        const isCar = type === 'CAR';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div className="license-plate" style={{ fontSize: '14px', fontWeight: 600, color: '#262626' }}>
              {plate}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isCar ? <Car size={14} color="#52c41a" /> : <Bike size={14} color="#fa8c16" />}
              <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{isCar ? 'Ô tô' : 'Xe máy'}</span>
            </div>
            <div className="brand" style={{ fontSize: '12px', color: '#bfbfbf', fontStyle: 'italic' }}>
              {vehicleName}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Chi nhánh',
      key: 'branch',
      width: 150,
      render: (_, record) => {
        const bName = record.branch?.name || record.branchName || 'Chưa phân bổ';
        return (
          <div className="branch-cell">
            <Building2 size={14} />
            <span style={{whiteSpace: 'normal'}}>{bName}</span>
          </div>
        );
      },
    },
    {
      title: 'Thợ sửa',
      key: 'mechanic',
      width: 160,
      render: (_, record) => {
        const mName = record.mechanic?.fullName || record.mechanicName;
        return (
          <div className="mechanic-cell">
            <Wrench size={14} />
            <span>{mName ? mName : 'Chưa phân công'}</span>
          </div>
        );
      },
    },
    {
      title: 'Thời gian đặt',
      dataIndex: 'bookingTime',
      key: 'bookingTime',
      width: 160,
      render: (time) => (
        <div className="time-cell">
          <Calendar size={14} />
          <span>{formatDateTime(time)}</span>
        </div>
      ),
    },
    {
      title: 'Khung giờ hẹn',
      key: 'arrivalSlot',
      width: 220,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>
            <strong>Từ:</strong> {formatDateTime(record.arrivalSlotStart)}
          </span>
          <span>
            <strong>Đến:</strong> {formatDateTime(record.arrivalSlotEnd)}
          </span>
        </div>
      ),
    },
    {
      title: 'Giờ nhận xe',
      dataIndex: 'arrivalTime',
      key: 'arrivalTime',
      width: 170,
      render: (time) => formatDateTime(time),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => {
        const badge = statusConfig[status || 'PENDING'] || statusConfig.PENDING;
        return <Tag color={badge.color}>{badge.text}</Tag>;
      },
    },
    {
      title: 'Dịch vụ',
      key: 'serviceNames',
      width: 260,
      render: (_, record) => renderTagList(record.serviceNames, 'Chưa chọn dịch vụ'),
    },
    {
      title: 'Linh kiện',
      key: 'partNames',
      width: 240,
      render: (_, record) => renderTagList(record.partNames, 'Chưa có linh kiện'),
    },
    {
      title: 'Tổng tiền',
      key: 'totalAmount',
      width: 130,
      render: (_, record) => {
        const amt = record.totalAmount || record.price || 0;
        return (
          <div className="amount-cell">
            <DollarSign size={14} />
            <span>{amt.toLocaleString('vi-VN')} đ</span>
          </div>
        );
      },
    },
    {
      title: 'Thanh toán',
      key: 'payment',
      width: 190,
      render: (_, record) => {
        const method = paymentMethodConfig[record.paymentMethod] || {
          color: 'default',
          text: record.paymentMethod || 'Chưa chọn',
        };
        const status = paymentStatusConfig[record.paymentStatus] || {
          color: 'default',
          text: record.paymentStatus || 'Chưa rõ',
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Tag color={method.color} style={{ width: 'fit-content', marginInlineEnd: 0 }}>
              {method.text}
            </Tag>
            <Tag color={status.color} style={{ width: 'fit-content', marginInlineEnd: 0 }}>
              {status.text}
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 170,
      fixed: 'right',
      render: (_, record) => {
        const s = record.status || 'PENDING';
        return (
          <Space>
            {s === 'PENDING' && (
              <Tooltip title="Xác nhận & Giao thợ">
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined style={{ fontSize: '18px' }} />} 
                  onClick={() => openConfirmModal(record)} 
                />
              </Tooltip>
            )}
            {s === 'CONFIRMED' && (
              <Popconfirm
                title="Hoàn thành lịch"
                description="Đánh dấu lịch này đã sửa xong chưa?"
                onConfirm={() => handleCompleteBooking(record.id)}
              >
                <Tooltip title="Đánh dấu Hoàn thành">
                  <Button 
                    type="primary" 
                    className="btn-success"
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                    icon={<ToolOutlined style={{ fontSize: '18px' }} />} 
                  />
                </Tooltip>
              </Popconfirm>
            )}
            
            {(s === 'PENDING' || s === 'CONFIRMED') && (
              <Popconfirm
                title="Hủy đặt lịch"
                description="Bạn có chắc muốn hủy đặt lịch này không?"
                onConfirm={() => handleDeleteBooking(record.id)}
                okText="Hủy lịch"
                cancelText="Thoát"
              >
                <Tooltip title="Hủy/Xóa đơn">
                  <Button type="primary" danger icon={<CloseCircleOutlined style={{ fontSize: '18px' }} />} />
                </Tooltip>
              </Popconfirm>
            )}

            {(s === 'COMPLETED' || s === 'CANCELLED') && (
               <Popconfirm
               title="Xóa bản ghi"
               description="Bạn có chắc muốn xóa vĩnh viễn không?"
               onConfirm={() => handleDeleteBooking(record.id)}
               okButtonProps={{ danger: true }}
             >
               <Tooltip title="Xóa">
                 <Button type="text" danger icon={<DeleteOutlined style={{ fontSize: '18px' }} />} />
               </Tooltip>
             </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="bookings-page">
      <div className="page-header">
        <h1>Quản lý Đơn Đặt Lịch</h1>
        <p>Quản lý các lịch hẹn sửa chữa do khách hàng yêu cầu</p>
      </div>

      <Card className="bookings-card" bordered={false}>
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
            
            {/* We removed the explicit "Add Booking" button here 
                because Admins no longer manually create them. */}
          </Row>
        </div>

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
                {bookings.filter((b) => (b.status || 'PENDING') === 'PENDING').length}
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
          scroll={{ x: 2600 }}
        />
      </Card>
      
      {/* Modal Confirm Booking */}
      <Modal
        title="Xác nhận lịch hẹn & Phân công thợ"
        open={isConfirmModalVisible}
        onOk={handleConfirmBooking}
        onCancel={() => setIsConfirmModalVisible(false)}
        confirmLoading={confirmLoading}
        okText="Xác nhận"
        cancelText="Bỏ qua"
      >
        <p>Chọn thợ sửa xe cho đơn hàng này:</p>
        <Select 
            placeholder="-- Chọn thợ rảnh --" 
            style={{ width: '100%' }}
            value={selectedMechanicId}
            onChange={setSelectedMechanicId}
            allowClear
            options={mechanics
                .filter(m => m.status === 'ACTIVE') // Khuyên dùng thợ ACTIVE
                .map(m => ({
                    label: `${m.fullName} - ${m.branch?.name || ''}`,
                    value: m.id
                }))
            }
        />
      </Modal>

    </div>
  );
};

export default Bookings;

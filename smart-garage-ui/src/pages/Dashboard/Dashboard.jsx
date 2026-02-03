import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Wrench
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(false);

  // Mock data - thay thế bằng API call thực tế
  const statsData = [
    {
      title: 'Tổng đặt lịch',
      value: 1234,
      prefix: <Calendar size={20} />,
      suffix: <TrendingUp size={16} color="#52c41a" />,
      change: '+12.5%',
      changeType: 'increase',
      color: '#1890ff',
    },
    {
      title: 'Người dùng',
      value: 8432,
      prefix: <Users size={20} />,
      suffix: <TrendingUp size={16} color="#52c41a" />,
      change: '+8.3%',
      changeType: 'increase',
      color: '#52c41a',
    },
    {
      title: 'Doanh thu',
      value: 245680000,
      prefix: <DollarSign size={20} />,
      suffix: <TrendingDown size={16} color="#ff4d4f" />,
      change: '-3.2%',
      changeType: 'decrease',
      color: '#faad14',
    },
    {
      title: 'Hoàn thành',
      value: 892,
      prefix: <CheckCircle size={20} />,
      suffix: <TrendingUp size={16} color="#52c41a" />,
      change: '+15.8%',
      changeType: 'increase',
      color: '#52c41a',
    },
  ];

  const recentBookings = [
    {
      key: '1',
      id: 'BK001',
      customer: 'Nguyễn Văn A',
      service: 'Bảo dưỡng định kỳ',
      date: '2026-02-01',
      time: '09:00',
      status: 'pending',
      amount: 500000,
    },
    {
      key: '2',
      id: 'BK002',
      customer: 'Trần Thị B',
      service: 'Thay nhớt',
      date: '2026-02-01',
      time: '10:30',
      status: 'confirmed',
      amount: 300000,
    },
    {
      key: '3',
      id: 'BK003',
      customer: 'Lê Văn C',
      service: 'Sửa chữa động cơ',
      date: '2026-02-01',
      time: '14:00',
      status: 'in-progress',
      amount: 2500000,
    },
    {
      key: '4',
      id: 'BK004',
      customer: 'Phạm Thị D',
      service: 'Thay lốp xe',
      date: '2026-02-01',
      time: '15:30',
      status: 'completed',
      amount: 800000,
    },
  ];

  const mechanicPerformance = [
    { name: 'Nguyễn Văn Nam', completed: 45, rating: 4.8, efficiency: 92 },
    { name: 'Trần Đức Anh', completed: 38, rating: 4.6, efficiency: 88 },
    { name: 'Lê Hoàng Long', completed: 35, rating: 4.7, efficiency: 85 },
    { name: 'Phạm Quốc Toàn', completed: 32, rating: 4.5, efficiency: 82 },
  ];

  const columns = [
    {
      title: 'Mã đặt lịch',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'service',
      key: 'service',
    },
    {
      title: 'Thời gian',
      key: 'datetime',
      render: (_, record) => `${record.date} ${record.time}`,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => {
        const statusConfig = {
          pending: { color: 'gold', text: 'Chờ xác nhận' },
          confirmed: { color: 'blue', text: 'Đã xác nhận' },
          'in-progress': { color: 'cyan', text: 'Đang thực hiện' },
          completed: { color: 'green', text: 'Hoàn thành' },
        };
        const config = statusConfig[record.status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
      }).format(amount),
    },
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Chào mừng trở lại! Đây là tổng quan hoạt động của hệ thống.</p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="stats-row">
        {statsData.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="stat-card" bordered={false}>
              <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                {stat.prefix}
              </div>
              <div className="stat-content">
                <div className="stat-title">{stat.title}</div>
                <div className="stat-value">
                  {stat.title.includes('Doanh thu') 
                    ? formatCurrency(stat.value)
                    : stat.value.toLocaleString()}
                </div>
                <div className={`stat-change ${stat.changeType}`}>
                  {stat.suffix}
                  <span>{stat.change}</span>
                  <span className="stat-period">so với tháng trước</span>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Recent Bookings and Mechanic Performance */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} xl={16}>
          <Card 
            title="Đặt lịch gần đây" 
            className="dashboard-card"
            extra={<a href="/admin/bookings">Xem tất cả</a>}
          >
            <Table
              columns={columns}
              dataSource={recentBookings}
              loading={loading}
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Hiệu suất thợ sửa xe" className="dashboard-card">
            {mechanicPerformance.map((mechanic, index) => (
              <div key={index} className="mechanic-item">
                <div className="mechanic-info">
                  <div className="mechanic-avatar">
                    <Wrench size={16} />
                  </div>
                  <div className="mechanic-details">
                    <div className="mechanic-name">{mechanic.name}</div>
                    <div className="mechanic-stats">
                      {mechanic.completed} công việc • ⭐ {mechanic.rating}
                    </div>
                  </div>
                </div>
                <div className="mechanic-progress">
                  <Progress 
                    percent={mechanic.efficiency} 
                    size="small" 
                    strokeColor="#52c41a"
                    format={(percent) => `${percent}%`}
                  />
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

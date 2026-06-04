import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Table, Tag, Progress, message, Button, Empty, DatePicker, Space } from 'antd';
import dayjs from 'dayjs';
import { 
  TrendingUp, 
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Wrench,
  Activity,
  AlertCircle,
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import { getApiErrorMessage } from '../../services/reviewService';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [revenueSummary, setRevenueSummary] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [revenueViewMode, setRevenueViewMode] = useState('month');
  const [revenueSelectedMonth, setRevenueSelectedMonth] = useState(() => dayjs());
  const [revenueSelectedYear, setRevenueSelectedYear] = useState(() => dayjs());
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  const revenueTrendQueryParams = useMemo(() => {
    if (revenueViewMode === 'year') {
      const selectedYear = revenueSelectedYear || dayjs();
      return {
        groupBy: 'month',
        from: selectedYear.startOf('year').format('YYYY-MM-DD'),
        to: selectedYear.endOf('year').format('YYYY-MM-DD'),
      };
    }

    const selectedMonth = revenueSelectedMonth || dayjs();
    return {
      groupBy: 'day',
      from: selectedMonth.startOf('month').format('YYYY-MM-DD'),
      to: selectedMonth.endOf('month').format('YYYY-MM-DD'),
    };
  }, [revenueSelectedMonth, revenueSelectedYear, revenueViewMode]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [overviewData, revenueData, statusData, topServicesData, recentBookingsData] = await Promise.all([
          dashboardService.getOverview(),
          dashboardService.getRevenueSummary('month'),
          dashboardService.getBookingStatusDistribution(),
          dashboardService.getTopServices(5),
          dashboardService.getRecentBookings(8),
        ]);

        setOverview(overviewData);
        setRevenueSummary(revenueData);
        setStatusDistribution(Array.isArray(statusData) ? statusData : []);
        setTopServices(Array.isArray(topServicesData) ? topServicesData : []);
        setRecentBookings(Array.isArray(recentBookingsData) ? recentBookingsData : []);
      } catch (error) {
        message.error(getApiErrorMessage(error, 'Không thể tải dashboard.'));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    const loadRevenueTrend = async () => {
      try {
        const data = await dashboardService.getRevenueTrend(revenueTrendQueryParams);
        setRevenueTrend(Array.isArray(data) ? data : []);
      } catch (error) {
        message.error(getApiErrorMessage(error, 'Không thể tải biểu đồ doanh thu.'));
      }
    };

    loadRevenueTrend();
  }, [revenueTrendQueryParams]);

  const statusCountMap = useMemo(
    () =>
      statusDistribution.reduce((accumulator, item) => {
        if (item?.status) {
          accumulator[item.status] = Number(item.count || 0);
        }
        return accumulator;
      }, {}),
    [statusDistribution]
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDateTime = (value) => {
    if (!value) return 'Chưa có';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCompactCurrency = (value) => {
    const amount = Number(value || 0);
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1).replace('.0', '')} tỷ`;
    }
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1).replace('.0', '')} triệu`;
    }
    if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(0)}k`;
    }
    return amount.toLocaleString('vi-VN');
  };

  const formatTrendLabel = (label) => {
    if (!label) return '';

    if (revenueViewMode === 'year') {
      const [year, month] = label.split('-');
      return month && year ? `${month}/${year}` : label;
    }

    const [, month, day] = label.split('-');
    return day && month ? `${day}/${month}` : label;
  };

  const statsData = [
    {
      title: 'Tổng đặt lịch',
      value: Number(overview?.totalBookings || 0),
      prefix: <Calendar size={20} />,
      suffix: <TrendingUp size={16} color="#52c41a" />,
      change: `${Number(overview?.newBookingsToday || 0)} mới hôm nay`,
      changeType: 'increase',
      color: '#1890ff',
    },
    {
      title: 'Doanh thu tháng',
      value: Number(overview?.revenueThisMonth || revenueSummary?.revenue || 0),
      prefix: <DollarSign size={20} />,
      suffix: <TrendingUp size={16} color="#52c41a" />,
      change: `${Number(revenueSummary?.completedBookings || 0)} đơn hoàn tất`,
      changeType: 'increase',
      color: '#faad14',
    },
    {
      title: 'Đơn hoàn thành',
      value: Number(overview?.completedBookings || statusCountMap.COMPLETED || 0),
      prefix: <CheckCircle size={20} />,
      suffix: <TrendingUp size={16} color="#52c41a" />,
      change: `TB ${formatCurrency(Number(revenueSummary?.averageOrderValue || 0))}`,
      changeType: 'increase',
      color: '#52c41a',
    },
    {
      title: 'Chờ xác nhận',
      value: Number(overview?.pendingBookings || statusCountMap.PENDING || 0),
      prefix: <Clock size={20} />,
      suffix: <AlertCircle size={16} color="#fa8c16" />,
      change: `${Number(overview?.confirmedBookings || statusCountMap.CONFIRMED || 0)} đã xác nhận`,
      changeType: 'increase',
      color: '#13c2c2',
    },
  ];

  const operationSummary = [
    { label: 'Lịch hẹn hôm nay', value: Number(overview?.newBookingsToday || 0), icon: Calendar, tone: 'blue' },
    { label: 'Đang xử lý', value: Number(statusCountMap.IN_PROGRESS || 0), icon: Activity, tone: 'teal' },
    { label: 'Chờ xác nhận', value: Number(statusCountMap.PENDING || 0), icon: Clock, tone: 'amber' },
    { label: 'Đã hủy', value: Number(statusCountMap.CANCELLED || 0), icon: AlertCircle, tone: 'red' },
  ];

  const columns = [
    {
      title: 'Mã đặt lịch',
      dataIndex: 'bookingId',
      key: 'bookingId',
      render: (value) => `#${value}`,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Xe',
      key: 'vehicle',
      render: (_, record) => record.vehicleName || record.licensePlate || 'Chưa có',
    },
    {
      title: 'Thời gian',
      dataIndex: 'bookingTime',
      key: 'bookingTime',
      render: (value) => formatDateTime(value),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => {
        const statusConfig = {
          PENDING: { color: 'gold', text: 'Chờ xác nhận' },
          CONFIRMED: { color: 'blue', text: 'Đã xác nhận' },
          ARRIVED: { color: 'cyan', text: 'Đã tiếp nhận' },
          IN_PROGRESS: { color: 'processing', text: 'Đang thực hiện' },
          COMPLETED: { color: 'green', text: 'Hoàn thành' },
          CANCELLED: { color: 'red', text: 'Đã hủy' },
        };
        const config = statusConfig[record.status] || { color: 'default', text: record.status || 'Chưa rõ' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Số tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
      }).format(Number(amount || 0)),
    },
  ];

  const maxTopServiceUsage = Math.max(...topServices.map((item) => Number(item.usageCount || 0)), 1);
  const maxRevenueTrendValue = Math.max(...revenueTrend.map((item) => Number(item.revenue || 0)), 1);

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <div>
          <span className="dashboard-kicker">Smart Garage Admin</span>
          <h1>Tổng quan vận hành</h1>
          <p>Theo dõi lịch hẹn, doanh thu, hiệu suất kỹ thuật viên và các điểm cần xử lý trong ngày.</p>
        </div>
        <div className="hero-metrics">
          {operationSummary.map((item) => {
            const Icon = item.icon;
            return (
              <div className={`hero-metric ${item.tone}`} key={item.label}>
                <Icon size={18} />
                <div>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Row gutter={[16, 16]} className="stats-row">
        {statsData.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="stat-card" bordered={false}>
              <div className="stat-card-top">
                <div className="stat-title">{stat.title}</div>
                <div className={`stat-change-badge ${stat.changeType}`}>
                  {stat.suffix}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div className="stat-card-main">
                <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                  {stat.prefix}
                </div>
                <div className="stat-value">
                  {stat.title.includes('Doanh thu') 
                    ? formatCurrency(stat.value)
                    : stat.value.toLocaleString()}
                </div>
              </div>
              <div className="stat-period">So với tháng trước</div>
              <div className={`stat-accent ${stat.changeType}`} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            title="Biểu đồ doanh thu"
            className="dashboard-card"
            extra={
              <Space className="dashboard-revenue-controls" wrap>
                <div className="dashboard-segmented">
                  <Button
                    type={revenueViewMode === 'month' ? 'primary' : 'default'}
                    onClick={() => setRevenueViewMode('month')}
                  >
                    Theo tháng
                  </Button>
                  <Button
                    type={revenueViewMode === 'year' ? 'primary' : 'default'}
                    onClick={() => setRevenueViewMode('year')}
                  >
                    Theo năm
                  </Button>
                </div>
                {revenueViewMode === 'month' ? (
                  <DatePicker
                    allowClear={false}
                    picker="month"
                    format="MM/YYYY"
                    value={revenueSelectedMonth}
                    onChange={(date) => {
                      if (date) {
                        setRevenueSelectedMonth(date);
                      }
                    }}
                  />
                ) : (
                  <DatePicker
                    allowClear={false}
                    picker="year"
                    format="YYYY"
                    value={revenueSelectedYear}
                    onChange={(date) => {
                      if (date) {
                        setRevenueSelectedYear(date);
                      }
                    }}
                  />
                )}
              </Space>
            }
          >
            {revenueTrend.length === 0 ? (
              <Empty description="Chưa có dữ liệu doanh thu" />
            ) : (
              <div className="revenue-chart">
                <div className="revenue-chart-grid">
                  {[100, 75, 50, 25, 0].map((tick) => (
                    <div key={tick} className="revenue-chart-grid-line" />
                  ))}
                </div>
                <div className="revenue-chart-bars">
                  {revenueTrend.map((point) => {
                    const revenueValue = Number(point.revenue || 0);
                    const percent = Math.max((revenueValue / maxRevenueTrendValue) * 100, revenueValue > 0 ? 6 : 0);

                    return (
                      <div key={point.label} className="revenue-chart-bar-group">
                        <div className="revenue-chart-bar-wrap">
                          <span className="revenue-chart-value">{formatCompactCurrency(revenueValue)}</span>
                          <div
                            className="revenue-chart-bar"
                            style={{ height: `${percent}%` }}
                            title={`${formatTrendLabel(point.label)}: ${formatCurrency(revenueValue)}`}
                          />
                        </div>
                        <div className="revenue-chart-label">{formatTrendLabel(point.label)}</div>
                        <div className="revenue-chart-count">{point.completedBookings || 0} đơn</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={16}>
          <Card 
            title="Đặt lịch gần đây" 
            className="dashboard-card"
            extra={<a href="/admin/bookings">Xem tất cả</a>}
          >
            <Table
              columns={columns}
              dataSource={recentBookings.map((item) => ({ ...item, key: item.bookingId }))}
              loading={loading}
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Dịch vụ được đặt nhiều" className="dashboard-card">
            {topServices.map((service) => (
              <div key={service.serviceName} className="mechanic-item">
                <div className="mechanic-info">
                  <div className="mechanic-avatar">
                    <Wrench size={16} />
                  </div>
                  <div className="mechanic-details">
                    <div className="mechanic-name">{service.serviceName || 'Chưa có tên dịch vụ'}</div>
                    <div className="mechanic-stats">
                      {Number(service.usageCount || 0)} lượt đặt
                    </div>
                  </div>
                </div>
                <div className="mechanic-progress">
                  <Progress 
                    percent={Math.round((Number(service.usageCount || 0) / maxTopServiceUsage) * 100)} 
                    size="small" 
                    strokeColor="#52c41a"
                    format={(percent) => `${percent}%`}
                  />
                </div>
              </div>
            ))}
            {!loading && topServices.length === 0 ? <div>Chưa có dữ liệu dịch vụ.</div> : null}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

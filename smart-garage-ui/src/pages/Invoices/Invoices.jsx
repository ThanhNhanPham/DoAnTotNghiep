import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Select,
  message,
  Tooltip,
  Modal,
  Descriptions,
} from 'antd';
import { EyeOutlined, PrinterOutlined, ReloadOutlined, SnippetsOutlined } from '@ant-design/icons';
import { ReceiptText } from 'lucide-react';
import invoiceService from '../../services/invoiceService';
import { getApiErrorMessage } from '../../services/reviewService';
import './Invoices.css';

const paymentStatusConfig = {
  PENDING: { color: 'gold', text: 'Chờ thanh toán' },
  SUCCESS: { color: 'green', text: 'Đã thanh toán' },
  FAILED: { color: 'red', text: 'Thất bại' },
  CANCELED: { color: 'default', text: 'Đã hủy' },
};

const paymentMethodConfig = {
  CASH: { color: 'blue', text: 'Tiền mặt' },
  BANK_TRANSFER: { color: 'cyan', text: 'Chuyển khoản' },
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

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

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const [printingInvoiceId, setPrintingInvoiceId] = useState(null);
  const [printMode, setPrintMode] = useState('a4');
  const { current, pageSize } = pagination;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getAllInvoices({
        page: current,
        size: pageSize,
        status: statusFilter,
      });

      if (Array.isArray(data)) {
        setInvoices(data);
        setPagination((prev) => ({ ...prev, total: data.length }));
      } else {
        setInvoices(data?.content || []);
        setPagination((prev) => ({
          ...prev,
          current: (data?.number ?? prev.current - 1) + 1,
          pageSize: data?.size || prev.pageSize,
          total: data?.totalElements || 0,
        }));
      }
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Lỗi khi tải danh sách hóa đơn!'));
    } finally {
      setLoading(false);
    }
  }, [current, pageSize, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const openDetailModal = async (invoiceId) => {
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const data = await invoiceService.getInvoiceById(invoiceId);
      setInvoiceDetail(data);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Không thể tải chi tiết hóa đơn!'));
      setDetailVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const resetToFirstPage = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handlePrintInvoice = async (invoice, mode = 'a4') => {
    const invoiceId = invoice?.invoiceId;
    if (!invoiceId) return;

    setPrintingInvoiceId(invoiceId);
    setPrintMode(mode);
    try {
      const data = invoiceDetail?.invoiceId === invoiceId
        ? invoiceDetail
        : await invoiceService.getInvoiceById(invoiceId);

      setPrintingInvoice(data);
      setTimeout(() => {
        window.print();
        setPrintingInvoiceId(null);
      }, 100);
    } catch (error) {
      setPrintingInvoiceId(null);
      message.error(getApiErrorMessage(error, 'Không thể tải hóa đơn để in!'));
    }
  };

  const columns = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 170,
      render: (value) => <strong>{value || 'Chưa có'}</strong>,
    },
    {
      title: 'Booking',
      dataIndex: 'bookingId',
      key: 'bookingId',
      width: 110,
      render: (value) => (value ? `#${value}` : 'Chưa có'),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 220,
      render: (_, record) => (
        <div className="invoice-customer">
          <strong>{record.customerName || 'Chưa có tên'}</strong>
          <span>{record.customerPhone || 'Chưa có SĐT'}</span>
        </div>
      ),
    },
    {
      title: 'Biển số',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 130,
      render: (value) => value || 'Chưa có',
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
          <Space direction="vertical" size={4}>
            <Tag color={method.color}>{method.text}</Tag>
            <Tag color={status.color}>{status.text}</Tag>
          </Space>
        );
      },
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      width: 140,
      render: (value) => <span className="invoice-amount">{formatCurrency(value)}</span>,
    },
    {
      title: 'Ngày xuất',
      dataIndex: 'issuedAt',
      key: 'issuedAt',
      width: 170,
      render: formatDateTime,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Xem chi tiết">
            <Button
              className="invoice-action-btn invoice-action-detail"
              icon={<EyeOutlined style={{ fontSize: 18 }} />}
              onClick={() => openDetailModal(record.invoiceId)}
            />
          </Tooltip>
          <Tooltip title="In hóa đơn">
            <Button
              className="invoice-action-btn invoice-action-print-a4"
              icon={<PrinterOutlined style={{ fontSize: 18 }} />}
              loading={printingInvoiceId === record.invoiceId}
              onClick={() => handlePrintInvoice(record, 'a4')}
            />
          </Tooltip>
          <Tooltip title="In bill 80mm">
            <Button
              className="invoice-action-btn invoice-action-print-bill"
              icon={<SnippetsOutlined style={{ fontSize: 18 }} />}
              loading={printingInvoiceId === record.invoiceId}
              onClick={() => handlePrintInvoice(record, 'receipt')}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="invoices-container">
      <div className="page-header">
        <div className="header-content">
          <ReceiptText size={32} />
          <div>
            <h1>Quản lý hóa đơn</h1>
            <p>Theo dõi hóa đơn, thanh toán và thông tin booking đã hoàn tất</p>
          </div>
        </div>
      </div>

      <Card className="invoices-card" bordered={false}>
        <div className="invoice-toolbar">
          <Select
            allowClear
            placeholder="Lọc trạng thái thanh toán"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              resetToFirstPage();
            }}
            style={{ width: 240 }}
            options={Object.entries(paymentStatusConfig).map(([value, item]) => ({
              value,
              label: item.text,
            }))}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchInvoices}>
            Tải lại
          </Button>
        </div>

        <Table
          rowKey="invoiceId"
          columns={columns}
          dataSource={invoices}
          loading={loading}
          scroll={{ x: 1230 }}
          pagination={pagination}
          onChange={(nextPagination) => {
            setPagination((prev) => ({
              ...prev,
              current: nextPagination.current,
              pageSize: nextPagination.pageSize,
            }));
          }}
        />
      </Card>

      <Modal
        title="Chi tiết hóa đơn"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setInvoiceDetail(null);
        }}
        footer={
          invoiceDetail
            ? [
                <Button key="receipt" icon={<SnippetsOutlined />} onClick={() => handlePrintInvoice(invoiceDetail, 'receipt')}>
                  In bill 80mm
                </Button>,
                <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => handlePrintInvoice(invoiceDetail, 'a4')}>
                  In A4
                </Button>,
              ]
            : null
        }
        width={760}
        destroyOnHidden
      >
        {detailLoading || !invoiceDetail ? (
          <div className="invoice-detail-loading">Đang tải chi tiết...</div>
        ) : (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã hóa đơn">{invoiceDetail.invoiceNumber || 'Chưa có'}</Descriptions.Item>
            <Descriptions.Item label="Booking">#{invoiceDetail.bookingId || 'Chưa có'}</Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{invoiceDetail.customerName || 'Chưa có'}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{invoiceDetail.customerPhone || 'Chưa có'}</Descriptions.Item>
            <Descriptions.Item label="Biển số xe">{invoiceDetail.licensePlate || 'Chưa có'}</Descriptions.Item>
            <Descriptions.Item label="Tiền dịch vụ">{formatCurrency(invoiceDetail.serviceAmount)}</Descriptions.Item>
            <Descriptions.Item label="Tiền phụ tùng">{formatCurrency(invoiceDetail.partAmount)}</Descriptions.Item>
            <Descriptions.Item label="Giảm giá thành viên">
              {formatCurrency(invoiceDetail.membershipDiscountAmount)}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng thanh toán">
              <span className="invoice-amount">{formatCurrency(invoiceDetail.finalAmount)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Điểm cộng">{invoiceDetail.pointsEarned || 0}</Descriptions.Item>
            <Descriptions.Item label="Ngày xuất">{formatDateTime(invoiceDetail.issuedAt)}</Descriptions.Item>
            <Descriptions.Item label="Ghi chú">{invoiceDetail.note || 'Không có'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {printingInvoice && printMode === 'a4' && (
        <div className="print-invoice print-invoice-a4">
          <div className="print-invoice-header">
            <div>
              <h1>Smart Garage</h1>
              <p>HÓA ĐƠN DỊCH VỤ</p>
            </div>
            <div className="print-invoice-number">
              <span>Mã hóa đơn</span>
              <strong>{printingInvoice.invoiceNumber || 'Chưa có'}</strong>
            </div>
          </div>

          <div className="print-invoice-grid">
            <div>
              <span>Khách hàng</span>
              <strong>{printingInvoice.customerName || 'Chưa có'}</strong>
            </div>
            <div>
              <span>Số điện thoại</span>
              <strong>{printingInvoice.customerPhone || 'Chưa có'}</strong>
            </div>
            <div>
              <span>Booking</span>
              <strong>#{printingInvoice.bookingId || 'Chưa có'}</strong>
            </div>
            <div>
              <span>Biển số xe</span>
              <strong>{printingInvoice.licensePlate || 'Chưa có'}</strong>
            </div>
            <div>
              <span>Ngày xuất</span>
              <strong>{formatDateTime(printingInvoice.issuedAt)}</strong>
            </div>
            <div>
              <span>Phương thức</span>
              <strong>
                {(paymentMethodConfig[printingInvoice.paymentMethod] || {}).text ||
                  printingInvoice.paymentMethod ||
                  'Chưa có'}
              </strong>
            </div>
          </div>

          <table className="print-invoice-table">
            <thead>
              <tr>
                <th>Hạng mục</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dịch vụ</td>
                <td>{formatCurrency(printingInvoice.serviceAmount)}</td>
              </tr>
              <tr>
                <td>Phụ tùng</td>
                <td>{formatCurrency(printingInvoice.partAmount)}</td>
              </tr>
              <tr>
                <td>Giảm giá thành viên</td>
                <td>- {formatCurrency(printingInvoice.membershipDiscountAmount)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>Tổng thanh toán</td>
                <td>{formatCurrency(printingInvoice.finalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="print-invoice-note">
            <span>Ghi chú</span>
            <p>{printingInvoice.note || 'Không có'}</p>
          </div>

          <div className="print-invoice-footer">
            <div>
              <strong>Khách hàng</strong>
              <span>Ký và ghi rõ họ tên</span>
            </div>
            <div>
              <strong>Smart Garage</strong>
              <span>Ký và ghi rõ họ tên</span>
            </div>
          </div>
        </div>
      )}

      {printingInvoice && printMode === 'receipt' && (
        <div className="print-invoice print-invoice-receipt">
          <div className="receipt-center">
            <h1>SMART GARAGE</h1>
            <p>HOA DON DICH VU</p>
          </div>

          <div className="receipt-line" />

          <div className="receipt-row">
            <span>Ma HD</span>
            <strong>{printingInvoice.invoiceNumber || 'N/A'}</strong>
          </div>
          <div className="receipt-row">
            <span>Booking</span>
            <strong>#{printingInvoice.bookingId || 'N/A'}</strong>
          </div>
          <div className="receipt-row">
            <span>Ngay</span>
            <strong>{formatDateTime(printingInvoice.issuedAt)}</strong>
          </div>
          <div className="receipt-row">
            <span>Khach</span>
            <strong>{printingInvoice.customerName || 'N/A'}</strong>
          </div>
          <div className="receipt-row">
            <span>SDT</span>
            <strong>{printingInvoice.customerPhone || 'N/A'}</strong>
          </div>
          <div className="receipt-row">
            <span>Bien so</span>
            <strong>{printingInvoice.licensePlate || 'N/A'}</strong>
          </div>
          <div className="receipt-row">
            <span>Thanh toan</span>
            <strong>
              {(paymentMethodConfig[printingInvoice.paymentMethod] || {}).text ||
                printingInvoice.paymentMethod ||
                'N/A'}
            </strong>
          </div>

          <div className="receipt-line" />

          <div className="receipt-row">
            <span>Dich vu</span>
            <strong>{formatCurrency(printingInvoice.serviceAmount)}</strong>
          </div>
          <div className="receipt-row">
            <span>Phu tung</span>
            <strong>{formatCurrency(printingInvoice.partAmount)}</strong>
          </div>
          <div className="receipt-row">
            <span>Giam gia</span>
            <strong>- {formatCurrency(printingInvoice.membershipDiscountAmount)}</strong>
          </div>

          <div className="receipt-line" />

          <div className="receipt-row receipt-total">
            <span>TONG</span>
            <strong>{formatCurrency(printingInvoice.finalAmount)}</strong>
          </div>

          {printingInvoice.note && (
            <>
              <div className="receipt-line" />
              <div className="receipt-note">
                <span>Ghi chu</span>
                <p>{printingInvoice.note}</p>
              </div>
            </>
          )}

          <div className="receipt-line" />
          <div className="receipt-center receipt-thanks">
            <p>Cam on quy khach!</p>
            <p>Hen gap lai</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;

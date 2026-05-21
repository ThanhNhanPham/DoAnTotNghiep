import { useEffect, useState } from 'react';
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
  Descriptions,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  EyeOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Package, DollarSign, Building2 } from 'lucide-react';
import PartsForm from './PartsForm';
import partService from '../../services/partService';
import branchService from '../../services/branchService';
import './Parts.css';

const Parts = () => {
  const [parts, setParts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [branchFilter, setBranchFilter] = useState(undefined);
  const [lowStockMode, setLowStockMode] = useState(false);
  const [partPagination, setPartPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [partDetail, setPartDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stockModal, setStockModal] = useState({ open: false, mode: 'add', part: null });
  const [stockAmount, setStockAmount] = useState(1);
  const [stockLoading, setStockLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchParts();
  }, [partPagination.current, partPagination.pageSize, searchText, statusFilter, branchFilter, lowStockMode]);

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `${amount.toLocaleString('vi-VN')} đ`;
  };

  const fetchParts = async () => {
    setLoading(true);
    try {
      let data;

      if (lowStockMode) {
        data = await partService.getLowStockParts();
      } else if (branchFilter) {
        data = await partService.getPartsByBranch(branchFilter);
      } else {
        data = await partService.getPartsPage({
          page: partPagination.current,
          size: partPagination.pageSize,
          keyword: searchText,
          stockStatus: statusFilter,
        });
      }

      if (Array.isArray(data)) {
        const filtered = filterPartsLocally(data);
        const start = (partPagination.current - 1) * partPagination.pageSize;
        setParts(filtered.slice(start, start + partPagination.pageSize));
        setPartPagination((prev) => ({ ...prev, total: filtered.length }));
      } else {
        setParts(data?.content || []);
        setPartPagination((prev) => ({
          ...prev,
          current: (data?.number ?? prev.current - 1) + 1,
          pageSize: data?.size || prev.pageSize,
          total: data?.totalElements || 0,
        }));
      }
    } catch (error) {
      console.error(error);
      message.error('Không thể tải danh sách phụ tùng!');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await branchService.getActiveBranches();
      setBranches(data || []);
    } catch (error) {
      console.error(error);
      message.error('Không thể tải danh sách chi nhánh!');
    }
  };

  const filterPartsLocally = (items) => {
    const keyword = searchText.trim().toLowerCase();
    return items.filter((part) => {
      const matchesKeyword =
        !keyword ||
        part.name?.toLowerCase().includes(keyword) ||
        part.description?.toLowerCase().includes(keyword);
      const matchesStock =
        !statusFilter ||
        (statusFilter === 'in-stock' && part.quantity > 0) ||
        (statusFilter === 'out-of-stock' && part.quantity === 0);
      return matchesKeyword && matchesStock;
    });
  };

  const resetPartPagination = () => {
    setPartPagination((prev) => ({ ...prev, current: 1 }));
  };

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

  const openDetailModal = async (partId) => {
    setIsDetailModalVisible(true);
    setPartDetail(null);
    setDetailLoading(true);
    try {
      const data = await partService.getPartById(partId);
      setPartDetail(data);
    } catch {
      message.error('Không thể tải chi tiết phụ tùng!');
      setIsDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Xóa phụ tùng
  const handleDeletePart = async (partId) => {
    try {
      await partService.deletePart(partId);
      message.success('Xóa phụ tùng thành công!');
      fetchParts();
    } catch (error) {
      const serverMessage = error?.response?.data?.message || error?.response?.data || 'Không thể xóa phụ tùng!';
      message.error(String(serverMessage));
    }
  };

  // Lưu phụ tùng
  const handleSavePart = async (values) => {
    const { branchId, ...payload } = values;

    setSaving(true);
    try {
      if (editingPart) {
        await partService.updatePart(editingPart.id, payload);
        message.success('Cập nhật phụ tùng thành công!');
      } else {
        await partService.createPart(branchId, payload);
        message.success('Thêm phụ tùng thành công!');
      }
      setIsModalVisible(false);
      fetchParts();
    } catch (error) {
      const serverMessage = error?.response?.data?.message || error?.response?.data || 'Không thể lưu phụ tùng!';
      message.error(String(serverMessage));
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const openStockModal = (part, mode) => {
    setStockModal({ open: true, mode, part });
    setStockAmount(1);
  };

  const handleSubmitStock = async () => {
    if (!stockModal.part || !stockAmount || stockAmount <= 0) {
      message.warning('Vui lòng nhập số lượng lớn hơn 0.');
      return;
    }

    setStockLoading(true);
    try {
      if (stockModal.mode === 'add') {
        await partService.addStock(stockModal.part.id, stockAmount);
        message.success('Nhập kho thành công!');
      } else {
        await partService.removeStock(stockModal.part.id, stockAmount);
        message.success('Xuất kho thành công!');
      }
      setStockModal({ open: false, mode: 'add', part: null });
      fetchParts();
    } catch (error) {
      const serverMessage = error?.response?.data?.message || error?.response?.data || 'Không thể cập nhật tồn kho!';
      message.error(String(serverMessage));
    } finally {
      setStockLoading(false);
    }
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
      render: (_, __, index) => index + 1,
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
      title: 'Thuộc chi nhánh',
      key: 'branch',
      width: 190,
      render: (_, record) => (
        <div className="branch-cell">
          <Building2 size={14} />
          <span>{record.branch?.name || record.branchName || 'N/A'}</span>
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
          <span>{formatCurrency(price)}</span>
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
      width: 190,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetailModal(record.id)}
          />
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditPart(record)}
          />
          <Button
            size="small"
            icon={<PlusCircleOutlined />}
            onClick={() => openStockModal(record, 'add')}
          />
          <Button
            size="small"
            icon={<MinusCircleOutlined />}
            onClick={() => openStockModal(record, 'remove')}
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
          <Row gutter={[8, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Tìm kiếm theo tên, mô tả..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  resetPartPagination();
                }}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Trạng thái kho"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  resetPartPagination();
                }}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: 'Còn hàng', value: 'in-stock' },
                  { label: 'Hết hàng', value: 'out-of-stock' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Chi nhánh"
                value={branchFilter}
                onChange={(value) => {
                  setBranchFilter(value);
                  setLowStockMode(false);
                  resetPartPagination();
                }}
                allowClear
                style={{ width: '100%' }}
                options={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
                showSearch
                optionFilterProp="label"
              />
            </Col>

            <Col xs={24} sm={12} md={6} className="text-right">
              <Button
                icon={<WarningOutlined />}
                onClick={() => {
                  setLowStockMode((prev) => !prev);
                  resetPartPagination();
                }}
              >
                {lowStockMode ? 'Tất cả phụ tùng' : 'Sắp hết kho'}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddPart}
                style={{ marginLeft: 8 }}
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
              <div className="stat-value">{partPagination.total}</div>
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
          dataSource={parts}
          loading={loading}
          rowKey="id"
          pagination={{
            current: partPagination.current,
            pageSize: partPagination.pageSize,
            total: partPagination.total,
            showTotal: (total) => `Tổng ${total} phụ tùng`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          onChange={(pagination) => {
            setPartPagination((prev) => ({
              ...prev,
              current: pagination.current || 1,
              pageSize: pagination.pageSize || prev.pageSize,
            }));
          }}
          scroll={{ x: 1600 }}
        />
      </Card>

      <Modal
        title="Chi tiết phụ tùng"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={720}
        loading={detailLoading}
      >
        {partDetail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã phụ tùng">#{partDetail.id}</Descriptions.Item>
            <Descriptions.Item label="Tên phụ tùng">
              <div className="part-detail-name">
                <Package size={16} className="part-icon" />
                <span>{partDetail.name || 'N/A'}</span>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả">{partDetail.description || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Giá">{formatCurrency(partDetail.price)}</Descriptions.Item>
            <Descriptions.Item label="Số lượng tồn kho">{partDetail.quantity ?? 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Đơn vị tính">{partDetail.unit || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Thuộc chi nhánh">
              {partDetail.branchName || partDetail.branch?.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStockStatus(partDetail).color}>{getStockStatus(partDetail).text}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Part Form Modal */}
      <PartsForm
        visible={isModalVisible}
        editingPart={editingPart}
        branches={branches}
        saving={saving}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSavePart}
      />

      <Modal
        title={stockModal.mode === 'add' ? 'Nhập linh kiện vào kho' : 'Xuất linh kiện khỏi kho'}
        open={stockModal.open}
        onOk={handleSubmitStock}
        onCancel={() => setStockModal({ open: false, mode: 'add', part: null })}
        confirmLoading={stockLoading}
        okText={stockModal.mode === 'add' ? 'Nhập kho' : 'Xuất kho'}
        cancelText="Hủy"
      >
        <p>
          Phụ tùng: <strong>{stockModal.part?.name || 'N/A'}</strong>
        </p>
        <InputNumber
          min={1}
          value={stockAmount}
          onChange={(value) => setStockAmount(value || 1)}
          style={{ width: '100%' }}
          placeholder="Nhập số lượng"
        />
      </Modal>
    </div>
  );
};

export default Parts;

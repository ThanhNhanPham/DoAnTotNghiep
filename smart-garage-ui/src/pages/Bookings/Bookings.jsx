import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Popconfirm,
  Select,
  message,
  Tooltip,
  Modal,
  Form,
  Descriptions,
  Divider,
  InputNumber,
  Rate,
} from 'antd';
import {
  SearchOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  CloseCircleOutlined,
  LoginOutlined,
  PlayCircleOutlined,
  SwapOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { Calendar, User, Car, Bike, Building2, Wrench, DollarSign } from 'lucide-react';
import bookingService from '../../services/bookingService';
import paymentService from '../../services/paymentService';
import branchService from '../../services/branchService';
import mechanicService from '../../services/mechanicService';
import serviceService from '../../services/serviceService';
import partService from '../../services/partService';
import reviewService, { getApiErrorMessage } from '../../services/reviewService';
import './Bookings.css';

const formatDistanceKm = (value) => (value == null ? '' : `${value.toFixed(2)} km`);

const getBranchDistanceLabel = (branch) => {
  if (branch?.travelDistanceKm != null) {
    return `Quãng đường ${formatDistanceKm(branch.travelDistanceKm)}`;
  }

  if (branch?.distanceKm != null) {
    return `Ước tính ${formatDistanceKm(branch.distanceKm)}`;
  }

  return '';
};

const Bookings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [branchFilter, setBranchFilter] = useState(undefined);
  const [bookingPagination, setBookingPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [cancelForm] = Form.useForm();
  const [partForm] = Form.useForm();

  // States for Confirming Booking
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [bookingToConfirm, setBookingToConfirm] = useState(null);
  const [mechanicModalMode, setMechanicModalMode] = useState('confirm');
  const [mechanics, setMechanics] = useState([]);
  const [mechanicsLoading, setMechanicsLoading] = useState(false);
  const [selectedMechanicId, setSelectedMechanicId] = useState(undefined);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [bookingDetail, setBookingDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [partCatalog, setPartCatalog] = useState([]);
  const [serviceToAddId, setServiceToAddId] = useState(undefined);
  const [bookingItemLoading, setBookingItemLoading] = useState(false);
  const [paymentConfirmingId, setPaymentConfirmingId] = useState(null);
  const [bookingReview, setBookingReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewReplyText, setReviewReplyText] = useState('');
  const [reviewReplyLoading, setReviewReplyLoading] = useState(false);
  const [branchLocationLoading, setBranchLocationLoading] = useState(false);
  const [branchLocationHint, setBranchLocationHint] = useState('');
  const [nearestBranchId, setNearestBranchId] = useState(null);
  const bookingIdFromNotification = searchParams.get('bookingId');

  useEffect(() => {
    fetchBranches();
    fetchCatalogs();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [bookingPagination.current, bookingPagination.pageSize, statusFilter, branchFilter, searchText]);

  useEffect(() => {
    if (!bookingIdFromNotification) return;

    const bookingId = Number(bookingIdFromNotification);
    if (!Number.isFinite(bookingId)) {
      setSearchParams({}, { replace: true });
      return;
    }

    openDetailModal(bookingId);
    setSearchParams({}, { replace: true });
  }, [bookingIdFromNotification, setSearchParams]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getAllBookings({
        page: bookingPagination.current,
        size: bookingPagination.pageSize,
        status: statusFilter,
        branchId: branchFilter,
        keyword: searchText,
      });

      if (Array.isArray(data)) {
        setBookings(data);
        setBookingPagination((prev) => ({ ...prev, total: data.length }));
      } else {
        setBookings(data?.content || []);
        setBookingPagination((prev) => ({
          ...prev,
          current: (data?.number ?? prev.current - 1) + 1,
          pageSize: data?.size || prev.pageSize,
          total: data?.totalElements || 0,
        }));
      }
    } catch {
      message.error('Lỗi khi tải danh sách lịch hẹn!');
    } finally {
      setLoading(false);
    }
  };

  const resetBookingPagination = () => {
    setBookingPagination((prev) => ({ ...prev, current: 1 }));
  };

  const fetchBranches = async () => {
    try {
      const data = await branchService.getActiveBranches();
      setBranches(data || []);
      setNearestBranchId(null);
      setBranchLocationHint('');
    } catch {
      message.error('Lỗi khi tải danh sách chi nhánh!');
    }
  };

  const locateNearbyBranches = async () => {
    if (!navigator.geolocation) {
      setBranchLocationHint('Trình duyệt này không hỗ trợ định vị. Hiển thị danh sách chi nhánh mặc định.');
      message.warning('Trình duyệt không hỗ trợ định vị.');
      return;
    }

    setBranchLocationLoading(true);
    setBranchLocationHint('');

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const nearbyBranches = await branchService.getNearbyActiveBranches(
        position.coords.latitude,
        position.coords.longitude
      );

      const activeNearbyBranches = (nearbyBranches || []).filter((branch) => branch.isActive !== false);
      if (activeNearbyBranches.length === 0) {
        setNearestBranchId(null);
        setBranchLocationHint('Không tìm thấy chi nhánh gần bạn. Hiển thị danh sách mặc định.');
        return;
      }

      const nearestBranch = activeNearbyBranches[0];
      const distanceLabel = getBranchDistanceLabel(nearestBranch);
      const sourceLabel = nearestBranch.travelDistanceKm != null ? 'theo lộ trình thực tế' : 'theo khoảng cách ước tính';

      setBranches(activeNearbyBranches);
      setNearestBranchId(nearestBranch.id);
      setBranchLocationHint(
        `Đã sắp xếp chi nhánh gần bạn nhất ${sourceLabel}: ${nearestBranch.name}${
          distanceLabel ? ` (${distanceLabel})` : ''
        }.`
      );
      message.success('Đã cập nhật danh sách chi nhánh theo vị trí hiện tại.');
    } catch (error) {
      console.error('Locate nearby branches failed:', error);
      setNearestBranchId(null);
      setBranchLocationHint('Không thể lấy vị trí hiện tại. Hiển thị danh sách chi nhánh mặc định.');
      message.warning('Không thể lấy vị trí hiện tại.');
    } finally {
      setBranchLocationLoading(false);
    }
  };

  const fetchMechanicsByBookingBranch = async (booking) => {
    const branchId = getBookingBranchId(booking);
    if (!branchId) {
      setMechanics([]);
      message.warning('Không xác định được chi nhánh của lịch hẹn này.');
      return [];
    }

    setMechanicsLoading(true);
    try {
      const data = await mechanicService.getMechanicsByBranch(branchId);
      setMechanics(data || []);
      return data || [];
    } catch (error) {
      console.error(error);
      setMechanics([]);
      message.error('Lỗi khi tải danh sách thợ theo chi nhánh!');
      return [];
    } finally {
      setMechanicsLoading(false);
    }
  };

  const getBookingBranchId = (booking) => {
    if (!booking) return undefined;
    const branchId = booking.branch?.id || booking.branchId;
    if (branchId) return branchId;
    return branches.find((branch) => branch.name === booking.branchName)?.id;
  };

  const isLockedBooking = (booking) => ['COMPLETED', 'CANCELLED'].includes(booking?.status);

  const canConfirmPayment = (booking) =>
    booking?.status === 'COMPLETED' &&
    booking?.paymentMethod === 'BANK_TRANSFER' &&
    booking?.paymentStatus !== 'SUCCESS';

  const getPaymentConfirmText = () => {
    return {
      action: 'Xác nhận chuyển khoản',
      title: 'Xác nhận thanh toán chuyển khoản?',
      description: 'Xác nhận gara đã nhận được tiền chuyển khoản cho booking này?',
      success: 'Xác nhận thanh toán chuyển khoản thành công!',
    };
  };

  const showLockedBookingMessage = (booking) => {
    if (booking?.status === 'COMPLETED') {
      message.warning('Không thể thực hiện thao tác vì đơn hàng đã hoàn thành.');
      return;
    }

    if (booking?.status === 'CANCELLED') {
      message.warning('Không thể thực hiện thao tác vì đơn hàng đã hủy.');
      return;
    }

    message.warning('Không thể thực hiện thao tác với đơn hàng này.');
  };

  const fetchCatalogs = async () => {
    try {
      const [servicesData, partsData] = await Promise.all([
        serviceService.getAllServices(),
        partService.getAllParts(),
      ]);

      setServiceCatalog(servicesData || []);
      setPartCatalog(partsData || []);
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi tải danh mục dịch vụ/linh kiện!');
    }
  };

  const openCancelModal = (booking) => {
    setBookingToCancel(booking);
    cancelForm.resetFields();
    setIsCancelModalVisible(true);
  };

  const handleCancelBooking = async () => {
    try {
      const values = await cancelForm.validateFields();
      setCancelLoading(true);
      await bookingService.cancelBooking(bookingToCancel.id, values.cancelReason);
      message.success('Hủy lịch hẹn thành công!');
      setIsCancelModalVisible(false);
      fetchBookings();
    } catch (error) {
      if (error?.errorFields) return;
      message.error('Lỗi khi hủy lịch hẹn!');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleMarkArrived = async (bookingId) => {
    try {
      await bookingService.markArrived(bookingId);
      message.success('Đã xác nhận khách tới cửa hàng!');
      fetchBookings();
    } catch {
      message.error('Lỗi khi cập nhật trạng thái khách tới!');
    }
  };

  const handleStartBooking = async (bookingId) => {
    try {
      await bookingService.startBooking(bookingId);
      message.success('Đã bắt đầu xử lý xe!');
      fetchBookings();
    } catch {
      message.error('Lỗi khi bắt đầu xử lý xe!');
    }
  };

  const openDetailModal = async (bookingId) => {
    setIsDetailModalVisible(true);
    setDetailLoading(true);
    setReviewLoading(true);
    setBookingReview(null);
    setReviewReplyText('');
    try {
      const [bookingResult, reviewResult] = await Promise.allSettled([
        bookingService.getBookingById(bookingId),
        reviewService.getReviewByBooking(bookingId),
      ]);

      if (bookingResult.status === 'rejected') {
        throw bookingResult.reason;
      }

      const data = bookingResult.value;
      setBookingDetail(data);
      setServiceToAddId(undefined);

      if (reviewResult.status === 'fulfilled') {
        setBookingReview(reviewResult.value);
        setReviewReplyText(reviewResult.value.adminReply || '');
      } else if (reviewResult.reason?.response?.status !== 404) {
        message.warning('Không tải được đánh giá của đơn hàng.');
      }

      partForm.resetFields();
    } catch {
      message.error('Lỗi khi tải chi tiết lịch hẹn!');
      setIsDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
      setReviewLoading(false);
    }
  };

  const refreshBookingDetail = async (bookingId) => {
    const data = await bookingService.getBookingById(bookingId);
    setBookingDetail(data);
    setServiceToAddId(undefined);
    await fetchBookings();
    return data;
  };

  const handleAddService = async () => {
    if (!bookingDetail) return;
    if (isLockedBooking(bookingDetail)) {
      showLockedBookingMessage(bookingDetail);
      return;
    }

    if (!serviceToAddId) {
      message.warning('Vui lòng chọn dịch vụ cần thêm!');
      return;
    }

    setBookingItemLoading(true);
    try {
      await bookingService.addServiceToBooking(bookingDetail.id, serviceToAddId);
      await refreshBookingDetail(bookingDetail.id);
      message.success('Đã thêm dịch vụ vào lịch hẹn!');
    } catch {
      message.error('Lỗi khi thêm dịch vụ!');
    } finally {
      setBookingItemLoading(false);
    }
  };

  const handleRemoveService = async (serviceName) => {
    if (isLockedBooking(bookingDetail)) {
      showLockedBookingMessage(bookingDetail);
      return;
    }

    const service = serviceCatalog.find((item) => item.name === serviceName);

    if (!bookingDetail || !service) {
      message.warning('Không tìm thấy dịch vụ tương ứng để xóa!');
      return;
    }

    setBookingItemLoading(true);
    try {
      await bookingService.removeServiceFromBooking(bookingDetail.id, service.id);
      await refreshBookingDetail(bookingDetail.id);
      message.success('Đã xóa dịch vụ khỏi lịch hẹn!');
    } catch {
      message.error('Lỗi khi xóa dịch vụ!');
    } finally {
      setBookingItemLoading(false);
    }
  };

  const handleAddPart = async () => {
    if (!bookingDetail) return;
    if (isLockedBooking(bookingDetail)) {
      showLockedBookingMessage(bookingDetail);
      return;
    }

    try {
      const values = await partForm.validateFields();
      setBookingItemLoading(true);
      await bookingService.addPartToBooking(bookingDetail.id, values.partId, values.quantity);
      await refreshBookingDetail(bookingDetail.id);
      partForm.resetFields();
      message.success('Đã thêm linh kiện vào lịch hẹn!');
    } catch (error) {
      if (error?.errorFields) return;
      message.error('Lỗi khi thêm linh kiện!');
    } finally {
      setBookingItemLoading(false);
    }
  };

  const handleUpdatePartQuantity = async () => {
    if (!bookingDetail) return;
    if (isLockedBooking(bookingDetail)) {
      showLockedBookingMessage(bookingDetail);
      return;
    }

    try {
      const values = await partForm.validateFields();
      setBookingItemLoading(true);
      await bookingService.updatePartInBooking(bookingDetail.id, values.partId, values.quantity);
      await refreshBookingDetail(bookingDetail.id);
      message.success('Đã cập nhật số lượng linh kiện!');
    } catch (error) {
      if (error?.errorFields) return;
      message.error('Lỗi khi cập nhật số lượng linh kiện!');
    } finally {
      setBookingItemLoading(false);
    }
  };

  const renderManageableServiceTags = () => {
    if (!bookingDetail?.serviceNames || bookingDetail.serviceNames.length === 0) {
      return <span style={{ color: '#8c8c8c' }}>Chưa chọn dịch vụ</span>;
    }

    return (
      <Space size={[4, 4]} wrap>
        {bookingDetail.serviceNames.map((name) => (
          <Tag
            key={name}
            color="processing"
            closable
            onClose={(event) => {
              event.preventDefault();
              handleRemoveService(name);
            }}
            style={{ marginInlineEnd: 0 }}
          >
            {name}
          </Tag>
        ))}
      </Space>
    );
  };

  const renderManageablePartTags = () => {
    if (!bookingDetail?.partNames || bookingDetail.partNames.length === 0) {
      return <span style={{ color: '#8c8c8c' }}>Chưa có linh kiện</span>;
    }

    return (
      <Space size={[4, 4]} wrap>
        {bookingDetail.partNames.map((name) => (
          <Tag
            key={name}
            color="geekblue"
            closable
            onClose={(event) => {
              event.preventDefault();
              handleRemovePart(name);
            }}
            style={{ marginInlineEnd: 0 }}
          >
            {name}
          </Tag>
        ))}
      </Space>
    );
  };

  const handleRemovePart = async (partName) => {
    if (isLockedBooking(bookingDetail)) {
      showLockedBookingMessage(bookingDetail);
      return;
    }

    const part = partCatalog.find((item) => item.name === partName);

    if (!bookingDetail || !part) {
      message.warning('Không tìm thấy linh kiện tương ứng để xóa!');
      return;
    }

    setBookingItemLoading(true);
    try {
      await bookingService.removePartFromBooking(bookingDetail.id, part.id);
      await refreshBookingDetail(bookingDetail.id);
      message.success('Đã xóa linh kiện khỏi lịch hẹn!');
    } catch {
      message.error('Lỗi khi xóa linh kiện!');
    } finally {
      setBookingItemLoading(false);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      await bookingService.completeBooking(bookingId);
      message.success('Đánh dấu hoàn thành lịch sửa xe thành công!');
      fetchBookings();
    } catch {
      message.error('Lỗi khi hoàn thành lịch hẹn!');
    }
  };

  const handleConfirmPayment = async (booking) => {
    const bookingId = booking?.id;
    if (!bookingId) return;

    setPaymentConfirmingId(bookingId);
    try {
      await paymentService.confirmBankTransferPayment(bookingId);
      message.success(getPaymentConfirmText(booking).success);
      await fetchBookings();
      if (bookingDetail?.id === bookingId) {
        await refreshBookingDetail(bookingId);
      }
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Lỗi khi xác nhận thanh toán!'));
    } finally {
      setPaymentConfirmingId(null);
    }
  };

  const handleReplyToReview = async () => {
    if (!bookingReview) return;

    setReviewReplyLoading(true);
    try {
      const updatedReview = await reviewService.replyToReview(bookingReview.id, reviewReplyText);
      setBookingReview(updatedReview);
      setReviewReplyText(updatedReview.adminReply || '');
      message.success('Đã gửi phản hồi đánh giá!');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Lỗi khi gửi phản hồi đánh giá!'));
    } finally {
      setReviewReplyLoading(false);
    }
  };
  
  // Logic to show confirm modal
  const openConfirmModal = async (booking) => {
    setBookingToConfirm(booking);
    setMechanicModalMode('confirm');
    setSelectedMechanicId(undefined);
    setMechanics([]);
    setIsConfirmModalVisible(true);
    await fetchMechanicsByBookingBranch(booking);
  };

  const openReassignModal = async (booking) => {
    setBookingToConfirm(booking);
    setMechanicModalMode('reassign');
    setSelectedMechanicId(undefined);
    setMechanics([]);
    setIsConfirmModalVisible(true);
    const branchMechanics = await fetchMechanicsByBookingBranch(booking);
    const currentMechanic = branchMechanics.find((mechanic) => mechanic.fullName === booking.mechanicName);
    setSelectedMechanicId(booking.mechanic?.id || booking.mechanicId || currentMechanic?.id);
  };
  
  const handleConfirmBooking = async () => {
    if (!selectedMechanicId) {
      message.warning('Vui lòng chọn thợ sửa xe!');
      return;
    }
    setConfirmLoading(true);
    try {
      if (mechanicModalMode === 'reassign') {
        await bookingService.reassignMechanic(bookingToConfirm.id, selectedMechanicId);
        message.success('Đổi thợ phụ trách thành công!');
      } else {
        await bookingService.confirmBooking(bookingToConfirm.id, selectedMechanicId);
        message.success('Xác nhận lịch hẹn thành công!');
      }
      setIsConfirmModalVisible(false);
      fetchBookings();
    } catch (error) {
      message.error(
        mechanicModalMode === 'reassign'
          ? getApiErrorMessage(error, 'Lỗi khi đổi thợ!')
          : getApiErrorMessage(error, 'Lỗi khi xác nhận lịch hẹn!')
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  const statusConfig = {
    PENDING: { color: 'orange', text: 'Chờ xử lý' },
    CONFIRMED: { color: 'blue', text: 'Đã xác nhận' },
    ARRIVED: { color: 'cyan', text: 'Khách đã tới' },
    IN_PROGRESS: { color: 'processing', text: 'Đang sửa' },
    COMPLETED: { color: 'green', text: 'Hoàn thành' },
    CANCELLED: { color: 'red', text: 'Đã hủy' },
  };

  const paymentMethodConfig = {
    CASH: { color: 'default', text: 'Tiền mặt' },
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

  const inferVehicleType = (record) => {
    const explicitType = record.vehicleType || record.vehicle?.type;
    if (explicitType) return explicitType;

    const plate = record.vehicle?.licensePlate || record.licensePlate || '';
    const vehicleName = `${record.vehicleName || ''} ${record.vehicle?.name || ''} ${record.brand || ''}`.toLowerCase();
    const likelyCarBrands = [
      'bmw',
      'toyota',
      'honda city',
      'hyundai',
      'kia',
      'mazda',
      'ford',
      'mercedes',
      'audi',
      'vinfast',
      'mitsubishi',
      'nissan',
      'suzuki ertiga',
      'chevrolet',
    ];

    if (/^[0-9]{2}[A-Z]-[0-9]{4,5}$/i.test(plate) || likelyCarBrands.some((brand) => vehicleName.includes(brand))) {
      return 'CAR';
    }

    if (/^[0-9]{2}[A-Z][0-9A-Z]-[0-9]{4,5}$/i.test(plate)) {
      return 'MOTORBIKE';
    }

    return undefined;
  };

  const renderBookingReview = () => {
    if (reviewLoading) {
      return <div className="review-empty">Đang tải đánh giá...</div>;
    }

    if (!bookingReview) {
      return <div className="review-empty">Khách hàng chưa đánh giá đơn hàng này.</div>;
    }

    return (
      <div className="booking-review-box">
        <div className="review-header">
          <div>
            <div className="review-title">Đánh giá của khách hàng</div>
            <Rate disabled value={bookingReview.rating || 0} />
          </div>
          <span className="review-time">{formatDateTime(bookingReview.createdAt)}</span>
        </div>

        <div className="review-comment">
          {bookingReview.comment || 'Khách hàng đã đánh giá nhưng chưa để lại bình luận.'}
        </div>

        {bookingReview.adminReply && (
          <div className="admin-reply-box">
            <div className="admin-reply-title">Phản hồi hiện tại</div>
            <div>{bookingReview.adminReply}</div>
            {bookingReview.repliedAt && (
              <div className="review-time">Phản hồi lúc {formatDateTime(bookingReview.repliedAt)}</div>
            )}
          </div>
        )}

        <Input.TextArea
          rows={4}
          maxLength={2000}
          showCount
          value={reviewReplyText}
          onChange={(event) => setReviewReplyText(event.target.value)}
          placeholder="Nhập phản hồi cho đánh giá của khách hàng"
        />
        <div className="review-actions">
          <Button type="primary" loading={reviewReplyLoading} onClick={handleReplyToReview}>
            {bookingReview.adminReply ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
          </Button>
        </div>
      </div>
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
        const type = inferVehicleType(record);
        const isCar = type === 'CAR';
        const vehicleTypeLabel = type === 'CAR' ? 'Ô tô' : type === 'MOTORBIKE' ? 'Xe máy' : 'Chưa rõ loại xe';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div className="license-plate" style={{ fontSize: '14px', fontWeight: 600, color: '#262626' }}>
              {plate}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isCar ? <Car size={14} color="#52c41a" /> : <Bike size={14} color="#fa8c16" />}
              <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{vehicleTypeLabel}</span>
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
        const amt = Number(record.totalAmount || record.price || 0);
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
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        const s = record.status || 'PENDING';
        return (
          <Space size={6} wrap>
            <Tooltip title="Xem chi tiết">
              <Button
                icon={<EyeOutlined style={{ fontSize: '18px' }} />}
                onClick={() => openDetailModal(record.id)}
              />
            </Tooltip>

            {s === 'PENDING' && (
              <Tooltip title="Xác nhận & Giao thợ">
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined style={{ fontSize: '18px' }} />} 
                  onClick={() => openConfirmModal(record)} 
                />
              </Tooltip>
            )}

            {['CONFIRMED', 'ARRIVED', 'IN_PROGRESS'].includes(s) && (
              <Tooltip title="Đổi thợ phụ trách">
                <Button
                  icon={<SwapOutlined style={{ fontSize: '18px' }} />}
                  onClick={() => openReassignModal(record)}
                />
              </Tooltip>
            )}

            {s === 'CONFIRMED' && (
              <Popconfirm
                title="Khách đã tới?"
                description="Xác nhận khách hàng đã tới cửa hàng?"
                onConfirm={() => handleMarkArrived(record.id)}
                okText="Xác nhận"
                cancelText="Thoát"
              >
                <Tooltip title="Khách đã tới">
                  <Button 
                    type="primary" 
                    style={{ background: '#13c2c2', borderColor: '#13c2c2' }}
                    icon={<LoginOutlined style={{ fontSize: '18px' }} />} 
                  />
                </Tooltip>
              </Popconfirm>
            )}

            {s === 'ARRIVED' && (
              <Popconfirm
                title="Bắt đầu xử lý xe?"
                description="Chuyển lịch hẹn sang trạng thái đang sửa?"
                onConfirm={() => handleStartBooking(record.id)}
                okText="Bắt đầu"
                cancelText="Thoát"
              >
                <Tooltip title="Bắt đầu sửa">
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined style={{ fontSize: '18px' }} />}
                  />
                </Tooltip>
              </Popconfirm>
            )}

            {s === 'IN_PROGRESS' && (
              <Popconfirm
                title="Hoàn thành lịch"
                description="Đánh dấu lịch này đã sửa xong chưa?"
                onConfirm={() => handleCompleteBooking(record.id)}
                okText="Hoàn thành"
                cancelText="Thoát"
              >
                <Tooltip title="Đánh dấu hoàn thành">
                  <Button
                    type="primary"
                    className="btn-success"
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                    icon={<ToolOutlined style={{ fontSize: '18px' }} />}
                  />
                </Tooltip>
              </Popconfirm>
            )}

            {['COMPLETED', 'CANCELLED'].includes(s) && (
              <>
                {canConfirmPayment(record) && (
                  <Popconfirm
                    title={getPaymentConfirmText(record).title}
                    description={getPaymentConfirmText(record).description}
                    onConfirm={() => handleConfirmPayment(record)}
                    okText="Xác nhận"
                    cancelText="Thoát"
                  >
                    <Tooltip title={getPaymentConfirmText(record).action}>
                      <Button
                        type="primary"
                        loading={paymentConfirmingId === record.id}
                        style={{ background: '#0f766e', borderColor: '#0f766e' }}
                        icon={<DollarCircleOutlined style={{ fontSize: '18px' }} />}
                      />
                    </Tooltip>
                  </Popconfirm>
                )}
                <Tooltip title="Cập nhật">
                  <Button
                    icon={<EditOutlined style={{ fontSize: '18px' }} />}
                    onClick={() => showLockedBookingMessage(record)}
                  />
                </Tooltip>
                <Tooltip title="Xóa">
                  <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined style={{ fontSize: '18px' }} />}
                    onClick={() => showLockedBookingMessage(record)}
                  />
                </Tooltip>
              </>
            )}
            
            {['PENDING', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS'].includes(s) && (
              <Tooltip title="Hủy lịch">
                <Button
                  type="primary"
                  danger
                  icon={<CloseCircleOutlined style={{ fontSize: '18px' }} />}
                  onClick={() => openCancelModal(record)}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  const branchOptions = branches.map((branch) => {
    const distanceLabel = getBranchDistanceLabel(branch);

    return {
      value: branch.id,
      label: (
        <div className="branch-select-option">
          <div className="branch-select-option__top">
            <span className="branch-select-option__name">{branch.name}</span>
            {nearestBranchId === branch.id ? (
              <Tag color="green" style={{ marginInlineEnd: 0 }}>
                Gần nhất
              </Tag>
            ) : null}
          </div>
          <div className="branch-select-option__meta">{branch.address}</div>
          {distanceLabel ? (
            <div className="branch-select-option__distance">{distanceLabel}</div>
          ) : null}
        </div>
      ),
      searchLabel: `${branch.name} ${branch.address || ''}`.toLowerCase(),
    };
  });

  return (
    <div className="bookings-page">
      <div className="page-header">
        <h1>Quản lý Đơn Đặt Lịch</h1>
        <p>Quản lý các lịch hẹn sửa chữa do khách hàng yêu cầu</p>
      </div>

      <Card className="bookings-card" bordered={false}>
        <div className="bookings-toolbar">
          <div className="booking-toolbar-header">
            <div>
              <h2>Bộ lọc đặt lịch</h2>
              <p>Tìm nhanh theo khách hàng, biển số, chi nhánh hoặc trạng thái xử lý.</p>
            </div>
          </div>

          <div className="booking-filter-grid">
            <div className="booking-filter-item booking-filter-search">
              <span className="booking-filter-label">Tìm kiếm</span>
              <Input
                placeholder="Tìm kiếm theo khách hàng, biển số, thợ, dịch vụ..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  resetBookingPagination();
                }}
                allowClear
              />
            </div>

            <div className="booking-filter-item">
              <span className="booking-filter-label">Trạng thái</span>
              <Select
                placeholder="Trạng thái"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  resetBookingPagination();
                }}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: 'Chờ xử lý', value: 'PENDING' },
                  { label: 'Đã xác nhận', value: 'CONFIRMED' },
                  { label: 'Khách đã tới', value: 'ARRIVED' },
                  { label: 'Đang sửa', value: 'IN_PROGRESS' },
                  { label: 'Hoàn thành', value: 'COMPLETED' },
                  { label: 'Đã hủy', value: 'CANCELLED' },
                ]}
              />
            </div>

            <div className="booking-filter-item booking-filter-branch">
              <span className="booking-filter-label">Chi nhánh</span>
              <div className="booking-branch-controls">
                <Select
                  placeholder="Chi nhánh"
                  value={branchFilter}
                  onChange={(value) => {
                    setBranchFilter(value);
                    resetBookingPagination();
                  }}
                  allowClear
                  showSearch
                  optionLabelProp="label"
                  filterOption={(input, option) => (option?.searchLabel ?? '').includes(input.toLowerCase())}
                  style={{ width: '100%' }}
                  options={branchOptions}
                />
                <Button
                  icon={<AimOutlined />}
                  loading={branchLocationLoading}
                  onClick={locateNearbyBranches}
                  style={{ width: '100%' }}
                >
                  Sắp xếp theo vị trí hiện tại
                </Button>
              </div>
            </div>
            
            {/* We removed the explicit "Add Booking" button here 
                because Admins no longer manually create them. */}
          </div>

          {branchLocationHint ? (
            <div className={`branch-location-hint ${nearestBranchId ? '' : 'branch-location-hint--warning'}`}>
              <EnvironmentOutlined />
              <span>{branchLocationHint}</span>
            </div>
          ) : null}
        </div>

        <div className="booking-stats-grid">
          <div>
            <div className="stat-item">
              <div className="stat-value">{bookingPagination.total}</div>
              <div className="stat-label">Tổng đơn</div>
            </div>
          </div>
          <div>
            <div className="stat-item stat-pending">
              <div className="stat-value">
                {bookings.filter((b) => (b.status || 'PENDING') === 'PENDING').length}
              </div>
              <div className="stat-label">Chờ xử lý</div>
            </div>
          </div>
          <div>
            <div className="stat-item stat-confirmed">
              <div className="stat-value">
                {bookings.filter((b) => b.status === 'CONFIRMED').length}
              </div>
              <div className="stat-label">Đã xác nhận</div>
            </div>
          </div>
          <div>
            <div className="stat-item">
              <div className="stat-value">
                {bookings.filter((b) => b.status === 'ARRIVED').length}
              </div>
              <div className="stat-label">Đã tới</div>
            </div>
          </div>
          <div>
            <div className="stat-item">
              <div className="stat-value">
                {bookings.filter((b) => b.status === 'IN_PROGRESS').length}
              </div>
              <div className="stat-label">Đang sửa</div>
            </div>
          </div>
          <div>
            <div className="stat-item stat-completed">
              <div className="stat-value">
                {bookings.filter((b) => b.status === 'COMPLETED').length}
              </div>
              <div className="stat-label">Hoàn thành</div>
            </div>
          </div>
          <div>
            <div className="stat-item stat-cancelled">
              <div className="stat-value">
                {bookings.filter((b) => b.status === 'CANCELLED').length}
              </div>
              <div className="stat-label">Đã hủy</div>
            </div>
          </div>
        </div>

        <div className="booking-table-panel">
          <div className="booking-table-heading">
            <div>
              <h2>Danh sách đặt lịch</h2>
              <p>{bookingPagination.total} lịch hẹn trong hệ thống</p>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={bookings}
            loading={loading}
            rowKey="id"
            pagination={{
              current: bookingPagination.current,
              pageSize: bookingPagination.pageSize,
              total: bookingPagination.total,
              showTotal: (total) => `Tổng ${total} đặt lịch`,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            onChange={(pagination) => {
              setBookingPagination((prev) => ({
                ...prev,
                current: pagination.current || 1,
                pageSize: pagination.pageSize || prev.pageSize,
              }));
            }}
            scroll={{ x: 2600 }}
          />
        </div>
      </Card>
      
      {/* Modal Confirm Booking */}
      <Modal
        title={mechanicModalMode === 'reassign' ? 'Đổi thợ phụ trách' : 'Xác nhận lịch hẹn & Phân công thợ'}
        open={isConfirmModalVisible}
        onOk={handleConfirmBooking}
        onCancel={() => setIsConfirmModalVisible(false)}
        confirmLoading={confirmLoading}
        okText={mechanicModalMode === 'reassign' ? 'Đổi thợ' : 'Xác nhận'}
        cancelText="Bỏ qua"
      >
        <p>{mechanicModalMode === 'reassign' ? 'Chọn thợ mới cho đơn hàng này:' : 'Chọn thợ sửa xe cho đơn hàng này:'}</p>
        {bookingToConfirm ? (
          <p style={{ marginTop: -4, color: '#64748b' }}>
            Chi nhánh: {bookingToConfirm.branchName || bookingToConfirm.branch?.name || 'N/A'}
          </p>
        ) : null}
        <Select 
            placeholder="-- Chọn thợ rảnh --" 
            style={{ width: '100%' }}
            value={selectedMechanicId}
            onChange={setSelectedMechanicId}
            allowClear
            loading={mechanicsLoading}
            disabled={mechanicsLoading}
            notFoundContent={mechanicsLoading ? 'Đang tải thợ...' : 'Không có thợ rảnh tại chi nhánh này'}
            options={mechanics
                .filter(m => m.status === 'ACTIVE') // Khuyên dùng thợ ACTIVE
                .map(m => ({
                    label: `${m.fullName}${m.specialization ? ` - ${m.specialization}` : ''}`,
                    value: m.id
                }))
            }
        />
      </Modal>

      <Modal
        title="Hủy lịch hẹn"
        open={isCancelModalVisible}
        onOk={handleCancelBooking}
        onCancel={() => setIsCancelModalVisible(false)}
        confirmLoading={cancelLoading}
        okText="Hủy lịch"
        okButtonProps={{ danger: true }}
        cancelText="Thoát"
      >
        <Form form={cancelForm} layout="vertical">
          <Form.Item
            label="Lý do hủy"
            name="cancelReason"
            rules={[
              { required: true, whitespace: true, message: 'Vui lòng nhập lý do hủy' },
              { max: 500, message: 'Lý do hủy không vượt quá 500 ký tự' },
            ]}
          >
            <Input.TextArea rows={4} maxLength={500} showCount placeholder="Nhập lý do hủy lịch hẹn" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chi tiết lịch hẹn"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={820}
        loading={detailLoading}
      >
        {bookingDetail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã lịch hẹn">#{bookingDetail.id}</Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              {bookingDetail.vehicleOwnerName || bookingDetail.customerName || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {bookingDetail.customerPhone || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Phương tiện">
              {bookingDetail.vehicleName || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Biển số">
              {bookingDetail.licensePlate || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Chi nhánh">
              {bookingDetail.branchName || 'Chưa phân bổ'}
            </Descriptions.Item>
            <Descriptions.Item label="Thợ sửa">
              {bookingDetail.mechanicName || 'Chưa phân công'}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={(statusConfig[bookingDetail.status] || statusConfig.PENDING).color}>
                {(statusConfig[bookingDetail.status] || statusConfig.PENDING).text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian đặt">
              {formatDateTime(bookingDetail.bookingTime)}
            </Descriptions.Item>
            <Descriptions.Item label="Khung giờ hẹn">
              {formatDateTime(bookingDetail.arrivalSlotStart)} - {formatDateTime(bookingDetail.arrivalSlotEnd)}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ nhận xe">
              {formatDateTime(bookingDetail.arrivalTime)}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ">
              <Space direction="vertical" style={{ width: '100%' }} size={10}>
                {renderManageableServiceTags()}
                <Space.Compact style={{ width: '100%' }}>
                  <Select
                    showSearch
                    placeholder="Chọn dịch vụ cần thêm"
                    optionFilterProp="label"
                    value={serviceToAddId}
                    onChange={setServiceToAddId}
                    disabled={bookingItemLoading}
                    style={{ width: '100%' }}
                    options={serviceCatalog
                      .filter((service) => !bookingDetail.serviceNames?.includes(service.name))
                      .map((service) => ({
                        label: `${service.name} - ${Number(service.price || 0).toLocaleString('vi-VN')} đ`,
                        value: service.id,
                      }))}
                  />
                  <Button
                    type="primary"
                    loading={bookingItemLoading}
                    onClick={handleAddService}
                  >
                    Thêm dịch vụ
                  </Button>
                </Space.Compact>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Linh kiện">
              <Space direction="vertical" style={{ width: '100%' }} size={10}>
                {renderManageablePartTags()}
                <Form form={partForm} layout="inline">
                  <Form.Item
                    name="partId"
                    rules={[{ required: true, message: 'Chọn linh kiện' }]}
                    style={{ flex: 1, minWidth: 260, marginBottom: 8 }}
                  >
                    <Select
                      showSearch
                      placeholder="Chọn linh kiện"
                      optionFilterProp="label"
                      disabled={bookingItemLoading}
                      options={partCatalog.map((part) => ({
                        label: `${part.name} - tồn ${part.quantity} ${part.unit || ''}`,
                        value: part.id,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name="quantity"
                    rules={[{ required: true, message: 'Nhập số lượng' }]}
                    style={{ width: 130, marginBottom: 8 }}
                  >
                    <InputNumber min={1} placeholder="SL" style={{ width: '100%' }} disabled={bookingItemLoading} />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 8 }}>
                    <Space>
                      <Button type="primary" loading={bookingItemLoading} onClick={handleAddPart}>
                        Thêm
                      </Button>
                      <Button loading={bookingItemLoading} onClick={handleUpdatePartQuantity}>
                        Cập nhật SL
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              {Number(bookingDetail.totalAmount || 0).toLocaleString('vi-VN')} đ
            </Descriptions.Item>
            <Descriptions.Item label="Thanh toán">
              <Space size={[4, 4]} wrap>
                <span style={{ color: '#8c8c8c' }}>Khách chọn:</span>
                <Tag color={(paymentMethodConfig[bookingDetail.paymentMethod] || {}).color || 'default'}>
                  {(paymentMethodConfig[bookingDetail.paymentMethod] || {}).text || bookingDetail.paymentMethod || 'Chưa chọn'}
                </Tag>
                <Tag color={(paymentStatusConfig[bookingDetail.paymentStatus] || {}).color || 'default'}>
                  {(paymentStatusConfig[bookingDetail.paymentStatus] || {}).text || bookingDetail.paymentStatus || 'Chưa rõ'}
                </Tag>
                {canConfirmPayment(bookingDetail) && (
                  <Popconfirm
                    title={getPaymentConfirmText(bookingDetail).title}
                    description={getPaymentConfirmText(bookingDetail).description}
                    onConfirm={() => handleConfirmPayment(bookingDetail)}
                    okText="Xác nhận"
                    cancelText="Thoát"
                  >
                    <Button
                      type="primary"
                      size="small"
                      loading={paymentConfirmingId === bookingDetail.id}
                      icon={<DollarCircleOutlined />}
                    >
                      {getPaymentConfirmText(bookingDetail).action}
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Descriptions.Item>
            {bookingDetail.cancelReason && (
              <Descriptions.Item label="Lý do hủy">
                {bookingDetail.cancelReason}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
        {bookingDetail && (
          <>
            <Divider />
            {renderBookingReview()}
            <Divider />
            <p style={{ color: '#8c8c8c', marginBottom: 0 }}>
              Bấm dấu x trên tag để xóa dịch vụ hoặc linh kiện khỏi lịch hẹn.
            </p>
          </>
        )}
      </Modal>

    </div>
  );
};

export default Bookings;

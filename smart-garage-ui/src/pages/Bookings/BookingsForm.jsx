import { Modal, Form, Input, Select, DatePicker, InputNumber } from 'antd';
import { useEffect } from 'react';
import dayjs from 'dayjs';

const BookingsForm = ({ visible, editingBooking, onClose, onSave, branches }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingBooking) {
      form.setFieldsValue({
        ...editingBooking,
        userId: editingBooking.user?.id,
        vehicleId: editingBooking.vehicle?.id,
        branchId: editingBooking.branch?.id,
        mechanicId: editingBooking.mechanic?.id,
        bookingTime: dayjs(editingBooking.bookingTime),
      });
    } else {
      form.resetFields();
    }
  }, [editingBooking, visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Format bookingTime to ISO string
      const formattedValues = {
        ...values,
        bookingTime: values.bookingTime.toISOString(),
        user: { id: values.userId, fullName: 'Mock User', phone: '0901234567' },
        vehicle: { id: values.vehicleId, licensePlate: '59A-12345', brand: 'Honda' },
        branch: branches.find((b) => b.id === values.branchId),
        mechanic: values.mechanicId ? { id: values.mechanicId, fullName: 'Mock Mechanic' } : null,
      };
      
      onSave(formattedValues);
      form.resetFields();
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Mock data - trong thực tế sẽ fetch từ API
  const users = [
    { id: 1, fullName: 'Nguyễn Văn A' },
    { id: 2, fullName: 'Trần Thị B' },
    { id: 3, fullName: 'Lê Văn C' },
  ];

  const vehicles = [
    { id: 1, licensePlate: '59A-12345' },
    { id: 2, licensePlate: '59B-67890' },
    { id: 3, licensePlate: '59C-11111' },
  ];

  const mechanics = [
    { id: 1, fullName: 'Trần Văn B' },
    { id: 2, fullName: 'Phạm Thị D' },
  ];

  return (
    <Modal
      title={editingBooking ? 'Sửa đặt lịch' : 'Thêm đặt lịch mới'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={750}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: 'PENDING',
          totalAmount: 0,
        }}
      >
        <Form.Item
          label="Khách hàng"
          name="userId"
          rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
        >
          <Select
            placeholder="Chọn khách hàng"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={users.map((u) => ({
              label: u.fullName,
              value: u.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Phương tiện"
          name="vehicleId"
          rules={[{ required: true, message: 'Vui lòng chọn phương tiện' }]}
        >
          <Select
            placeholder="Chọn phương tiện"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={vehicles.map((v) => ({
              label: v.licensePlate,
              value: v.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Chi nhánh"
          name="branchId"
          rules={[{ required: true, message: 'Vui lòng chọn chi nhánh' }]}
        >
          <Select
            placeholder="Chọn chi nhánh"
            options={branches.map((b) => ({
              label: b.name,
              value: b.id,
            }))}
          />
        </Form.Item>

        <Form.Item label="Thợ sửa" name="mechanicId">
          <Select
            placeholder="Chọn thợ sửa (có thể để trống)"
            allowClear
            options={mechanics.map((m) => ({
              label: m.fullName,
              value: m.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Thời gian đặt lịch"
          name="bookingTime"
          rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
        >
          <DatePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            placeholder="Chọn ngày giờ"
            style={{ width: '100%' }}
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
        >
          <Select
            options={[
              { label: 'Chờ xử lý', value: 'PENDING' },
              { label: 'Đã xác nhận', value: 'CONFIRMED' },
              { label: 'Hoàn thành', value: 'COMPLETED' },
              { label: 'Đã hủy', value: 'CANCELLED' },
            ]}
          />
        </Form.Item>

        <Form.Item label="Tổng tiền (đồng)" name="totalAmount">
          <InputNumber
            min={0}
            step={10000}
            placeholder="Nhập tổng tiền"
            style={{ width: '100%' }}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          label="Ghi chú"
          name="note"
          rules={[{ max: 1000, message: 'Ghi chú không được quá 1000 ký tự' }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Nhập ghi chú (nếu có)"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BookingsForm;

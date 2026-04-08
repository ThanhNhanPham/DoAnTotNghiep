import { Modal, Form, Input, Select, Button } from 'antd';
import { useEffect } from 'react';

const MotorbikesForm = ({ visible, editingMotorbike, onClose, onSave, motorbikes }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingMotorbike) {
      form.setFieldsValue({
        licensePlate: editingMotorbike.licensePlate,
        brand: editingMotorbike.brand,
        model: editingMotorbike.model,
        color: editingMotorbike.color,
        userId: editingMotorbike.user?.id,
      });
    } else {
      form.resetFields();
    }
  }, [editingMotorbike, visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
      form.resetFields();
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Lấy danh sách người dùng duy nhất từ motorbikes (lọc những xe có user)
  const users = [...new Map(
    motorbikes
      .filter((b) => b.user && b.user.id) // Chỉ lấy xe có thông tin user
      .map((b) => [b.user.id, b.user])
  ).values()];

  return (
    <Modal
      title={editingMotorbike ? 'Sửa thông tin xe máy' : 'Thêm xe máy mới'}
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          label="Biển số xe"
          name="licensePlate"
          rules={[
            { required: true, message: 'Vui lòng nhập biển số xe' },
            {
              pattern: /^[0-9]{2}[A-Z0-9]{1,2}-[0-9]{4,5}$/,
              message: 'Biển số không đúng định dạng (VD: 51G-12345)',
            },
          ]}
        >
          <Input placeholder="VD: 51G-12345" />
        </Form.Item>

        <Form.Item
          label="Hãng xe"
          name="brand"
          rules={[
            { required: true, message: 'Vui lòng nhập hãng xe' },
            {
              min: 2,
              max: 50,
              message: 'Hãng xe phải từ 2 đến 50 ký tự',
            },
          ]}
        >
          <Select
            placeholder="Chọn hãng xe"
            options={[
              { label: 'Honda', value: 'Honda' },
              { label: 'Yamaha', value: 'Yamaha' },
              { label: 'Suzuki', value: 'Suzuki' },
              { label: 'Kymco', value: 'Kymco' },
              { label: 'SYM', value: 'SYM' },
              { label: 'Piaggio', value: 'Piaggio' },
            ]}
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="Model"
          name="model"
          rules={[
            { required: true, message: 'Vui lòng nhập model xe' },
            {
              max: 50,
              message: 'Tên dòng xe không quá 50 ký tự',
            },
          ]}
        >
          <Input placeholder="VD: Click 125cc" />
        </Form.Item>

        <Form.Item
          label="Màu sắc"
          name="color"
          rules={[
            {
              max: 30,
              message: 'Mô tả màu sắc quá dài',
            },
          ]}
        >
          <Input placeholder="VD: Đỏ, Xanh, Đen..." />
        </Form.Item>

        <Form.Item
          label="Chủ sở hữu"
          name="userId"
          rules={[{ required: true, message: 'Vui lòng chọn chủ sở hữu' }]}
        >
          <Select
            placeholder="Chọn chủ sở hữu"
            options={users.map((user) => ({
              label: `${user.name} (${user.email})`,
              value: user.id,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MotorbikesForm;

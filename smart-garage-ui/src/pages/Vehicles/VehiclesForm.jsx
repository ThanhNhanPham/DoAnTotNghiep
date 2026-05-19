import { Modal, Form, Input, Select, Button, Switch, Row, Col } from 'antd';
import { useEffect } from 'react';

const VehiclesForm = ({ visible, editingVehicle, onClose, onSave }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingVehicle) {
      form.setFieldsValue({
        type: editingVehicle.type,
        licensePlate: editingVehicle.licensePlate,
        brand: editingVehicle.brand,
        model: editingVehicle.model,
        color: editingVehicle.color,
        userId: editingVehicle.userId || editingVehicle.user?.id,
        isActive: editingVehicle.isActive !== false,
      });
    } else {
      form.resetFields();
    }
  }, [editingVehicle, visible, form]);

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

  // Mock tạm thời vì API của Vehicle không còn trả về object User do @JsonIgnore
  const users = [
    { id: 1, name: 'Người dùng mặc định 1', email: 'user1@example.com' },
    { id: 2, name: 'Người dùng mặc định 2', email: 'user2@example.com' },
  ];

  return (
    <Modal
      title={editingVehicle ? 'Sửa thông tin phương tiện' : 'Thêm phương tiện mới'}
      open={visible}
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
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Loại xe"
              name="type"
              rules={[{ required: true, message: 'Vui lòng chọn loại xe' }]}
              initialValue="MOTORBIKE"
            >
              <Select
                placeholder="Chọn loại xe"
                options={[
                  { label: 'Xe máy', value: 'MOTORBIKE' },
                  { label: 'Ô tô', value: 'CAR' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
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
          </Col>
        </Row>

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
              { label: 'Toyota', value: 'Toyota' },
              { label: 'Hyundai', value: 'Hyundai' },
              { label: 'Kia', value: 'Kia' },
              { label: 'Mazda', value: 'Mazda' },
              { label: 'Ford', value: 'Ford' },
              { label: 'Mercedes-Benz', value: 'Mercedes-Benz' },
              { label: 'BMW', value: 'BMW' },
            ]}
            allowClear
            showSearch
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
          <Input placeholder="VD: Click 125cc hoặc Camry" />
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
            showSearch
            options={users.map((user) => ({
              label: `${user.name} (${user.email})`,
              value: user.id,
            }))}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label="Trạng thái hoạt động"
          name="isActive"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default VehiclesForm;

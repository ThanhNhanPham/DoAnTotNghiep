import { Modal, Form, Input, Select, Button, Space } from 'antd';
import { useEffect } from 'react';

const UserForm = ({ visible, editingUser, onClose, onSave }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingUser) {
      form.setFieldsValue(editingUser);
    } else {
      form.resetFields();
    }
  }, [editingUser, visible, form]);

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

  return (
    <Modal
      title={editingUser ? 'Sửa người dùng' : 'Thêm người dùng mới'}
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
        initialValues={{
          role: 'customer',
          status: 'active',
        }}
      >
        <Form.Item
          label="Tên người dùng"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên người dùng' }]}
        >
          <Input placeholder="Nhập tên người dùng" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input placeholder="Nhập email" type="email" />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại' },
            {
              pattern: /^[0-9]{10,11}$/,
              message: 'Số điện thoại phải có 10-11 chữ số',
            },
          ]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item
          label="Địa chỉ"
          name="address"
          rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
        >
          <Input.TextArea rows={3} placeholder="Nhập địa chỉ" />
        </Form.Item>

        <Form.Item
          label="Vai trò"
          name="role"
          rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
        >
          <Select
            options={[
              { label: 'Khách hàng', value: 'customer' },
              { label: 'Thợ sửa xe', value: 'mechanic' },
              { label: 'Nhân viên', value: 'staff' },
              { label: 'Admin', value: 'admin' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
        >
          <Select
            options={[
              { label: 'Hoạt động', value: 'active' },
              { label: 'Không hoạt động', value: 'inactive' },
              { label: 'Bị khóa', value: 'banned' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserForm;

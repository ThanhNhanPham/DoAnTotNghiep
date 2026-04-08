    import { Modal, Form, Input, Select } from 'antd';
import { useEffect } from 'react';

const BranchesForm = ({ visible, editingBranch, onClose, onSave }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingBranch) {
      form.setFieldsValue(editingBranch);
    } else {
      form.resetFields();
    }
  }, [editingBranch, visible, form]);

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
      title={editingBranch ? 'Sửa chi nhánh' : 'Thêm chi nhánh mới'}
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={700}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          isActive: true,
        }}
      >
        <Form.Item
          label="Tên chi nhánh"
          name="name"
          rules={[
            { required: true, message: 'Vui lòng nhập tên chi nhánh' },
            { min: 3, max: 100, message: 'Tên chi nhánh phải từ 3-100 ký tự' },
          ]}
        >
          <Input placeholder="VD: Chi nhánh Quận 1" />
        </Form.Item>

        <Form.Item
          label="Địa chỉ"
          name="address"
          rules={[
            { required: true, message: 'Vui lòng nhập địa chỉ' },
            { max: 500, message: 'Địa chỉ không được vượt quá 500 ký tự' },
          ]}
        >
          <Input.TextArea
            rows={2}
            placeholder="Nhập địa chỉ đầy đủ của chi nhánh"
          />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại' },
            {
              pattern: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
              message: 'Số điện thoại không hợp lệ',
            },
          ]}
        >
          <Input placeholder="VD: 0283456789" />
        </Form.Item>

        <Form.Item
          label="Ảnh chi nhánh"
          name="imageUrl"
          rules={[
            {
              max: 255,
              message: 'Đường dẫn ảnh không được quá 255 ký tự',
            },
            {
              pattern: /^https?:\/\/.+\..+/,
              message: 'Vui lòng nhập URL hình ảnh hợp lệ',
            },
          ]}
        >
          <Input placeholder="https://example.com/image.jpg" />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="isActive"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          valuePropName="checked"
        >
          <Select
            options={[
              { label: 'Hoạt động', value: true },
              { label: 'Không hoạt động', value: false },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BranchesForm;

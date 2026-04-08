import { Modal, Form, Input, Select, Button } from 'antd';
import { useEffect } from 'react';

const MechanicsForm = ({ visible, editingMechanic, onClose, onSave, branches }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingMechanic) {
      form.setFieldsValue({
        fullName: editingMechanic.fullName,
        phone: editingMechanic.phone,
        address: editingMechanic.address,
        status: editingMechanic.status,
        branchId: editingMechanic.branch.id,
      });
    } else {
      form.resetFields();
    }
  }, [editingMechanic, visible, form]);

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
      title={editingMechanic ? 'Sửa thông tin thợ sửa xe' : 'Thêm thợ sửa xe mới'}
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
          status: 'ACTIVE',
        }}
      >
        <Form.Item
          label="Họ và tên"
          name="fullName"
          rules={[
            { required: true, message: 'Vui lòng nhập họ và tên' },
            {
              min: 2,
              max: 100,
              message: 'Họ và tên từ 2 đến 100 ký tự',
            },
          ]}
        >
          <Input placeholder="Nhập họ và tên thợ sửa xe" />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại' },
            {
              pattern: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
              message: 'Số điện thoại không hợp lệ (VD: 0901234567)',
            },
          ]}
        >
          <Input placeholder="VD: 0901234567" maxLength={15} />
        </Form.Item>

        <Form.Item
          label="Địa chỉ"
          name="address"
          rules={[
            {
              max: 500,
              message: 'Địa chỉ không quá 500 ký tự',
            },
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Nhập địa chỉ (tối đa 500 ký tự)"
          />
        </Form.Item>

        <Form.Item
          label="Chi nhánh"
          name="branchId"
          rules={[{ required: true, message: 'Vui lòng chọn chi nhánh' }]}
        >
          <Select
            placeholder="Chọn chi nhánh"
            options={branches.map((branch) => ({
              label: branch.name,
              value: branch.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
        >
          <Select
            options={[
              { label: 'Hoạt động', value: 'ACTIVE' },
              { label: 'Không hoạt động', value: 'INACTIVE' },
              { label: 'Đang bận', value: 'BUSY' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MechanicsForm;

import { Modal, Form, Input, Select, InputNumber } from 'antd';
import { useEffect } from 'react';

const PartsForm = ({ visible, editingPart, branches = [], saving = false, onClose, onSave }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingPart) {
      form.setFieldsValue({
        ...editingPart,
        branchId: editingPart.branch?.id || editingPart.branchId,
      });
    } else {
      form.resetFields();
    }
  }, [editingPart, visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values);
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
      title={editingPart ? 'Sửa phụ tùng' : 'Thêm phụ tùng mới'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={saving}
      width={750}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          quantity: 0,
          price: 0,
          unit: 'Cái',
        }}
      >
        {!editingPart && (
          <Form.Item
            label="Thuộc chi nhánh"
            name="branchId"
            rules={[{ required: true, message: 'Vui lòng chọn chi nhánh' }]}
          >
            <Select
              placeholder="Chọn chi nhánh nhập phụ tùng"
              options={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        )}

        {editingPart && (
          <Form.Item label="Thuộc chi nhánh" name="branchId">
            <Select
              disabled
              options={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
            />
          </Form.Item>
        )}

        <Form.Item
          label="Tên phụ tùng"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên phụ tùng' }]}
        >
          <Input placeholder="VD: Nhớt Castrol 10W40" />
        </Form.Item>

        <Form.Item
          label="Mô tả"
          name="description"
          rules={[{ max: 500, message: 'Mô tả không được quá 500 ký tự' }]}
        >
          <Input.TextArea rows={2} placeholder="Nhập mô tả chi tiết về phụ tùng" />
        </Form.Item>

        <Form.Item
          label="Đơn vị tính"
          name="unit"
          rules={[{ required: true, message: 'Vui lòng chọn đơn vị tính' }]}
        >
          <Select
            placeholder="Chọn đơn vị tính"
            options={[
              { label: 'Cái', value: 'Cái' },
              { label: 'Bộ', value: 'Bộ' },
              { label: 'Lít', value: 'Lít' },
              { label: 'Chai', value: 'Chai' },
              { label: 'Sợi', value: 'Sợi' },
              { label: 'Hộp', value: 'Hộp' },
              { label: 'Chiếc', value: 'Chiếc' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Số lượng tồn kho"
          name="quantity"
          rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
        >
          <InputNumber
            min={0}
            placeholder="Nhập số lượng"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="Giá (đồng)"
          name="price"
          rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
        >
          <InputNumber
            min={1}
            step={10000}
            placeholder="Nhập giá"
            style={{ width: '100%' }}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PartsForm;

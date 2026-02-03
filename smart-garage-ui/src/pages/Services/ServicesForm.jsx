import { Modal, Form, Input, Select, Button, InputNumber, Upload, Checkbox } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEffect } from 'react';

const ServicesForm = ({ visible, editingService, onClose, onSave, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingService) {
      console.log('Editing service:', editingService);
      // Set đầy đủ dữ liệu khi edit
      form.setFieldsValue({
        name: editingService.name,
        description: editingService.description,
        price: editingService.price,
        durationMinutes: editingService.durationMinutes,
        imageUrl: editingService.imageUrl,
        suggestedParts: editingService.suggestedParts || 0,
        isActive: editingService.isActive === true || editingService.isActive === 1,
      });
    } else {
      form.resetFields();
    }
  }, [editingService, visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form values:', values);
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

  const categories = [
    'Bảo dưỡng',
    'Sửa chữa',
    'Vệ sinh',
    'Khác',
  ];

  return (
    <Modal
      title={editingService ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={650}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          isActive: true,
          durationMinutes: 30,
          price: 100000,
          suggestedParts: 0,
        }}
      >
        <Form.Item
          label="Tên dịch vụ"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ' }]}
        >
          <Input placeholder="VD: Bảo dưỡng định kỳ" />
        </Form.Item>

        <Form.Item
          label="Mô tả"
          name="description"
          rules={[{ max: 1000, message: 'Mô tả không được vượt quá 1000 ký tự' }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Nhập mô tả chi tiết về dịch vụ"
          />
        </Form.Item>

        <Form.Item
          label="Giá dịch vụ (đồng)"
          name="price"
          rules={[
            { required: true, message: 'Vui lòng nhập giá dịch vụ' },
            {
              pattern: /^[0-9]+(\.[0-9]{1,2})?$/,
              message: 'Giá phải là số dương',
            },
          ]}
        >
          <InputNumber
            min={0}
            step={10000}
            placeholder="Nhập giá dịch vụ"
            style={{ width: '100%' }}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          label="Thời gian thực hiện (phút)"
          name="durationMinutes"
          rules={[
            { required: true, message: 'Vui lòng nhập thời gian' },
            {
              type: 'number',
              min: 1,
              max: 10080,
              message: 'Thời gian phải từ 1 đến 10080 phút',
            },
          ]}
        >
          <InputNumber
            min={1}
            max={10080}
            step={5}
            placeholder="Nhập thời gian (phút)"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="Ảnh dịch vụ"
          name="imageUrl"
          rules={[
            {
              pattern: /^https?:\/\/.+\..+/,
              message: 'Vui lòng nhập URL hình ảnh hợp lệ',
            },
          ]}
        >
          <Input placeholder="https://example.com/image.jpg" />
        </Form.Item>

        <Form.Item
          label="Số lượng phụ tùng gợi ý"
          name="suggestedParts"
        >
          <InputNumber
            min={0}
            placeholder="Nhập số lượng phụ tùng"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item name="isActive" valuePropName="checked">
          <Checkbox>Kích hoạt dịch vụ</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ServicesForm;

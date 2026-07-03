import { Modal, Form, Input, Button, message } from 'antd';
import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import authService from '../../services/authService';

const ChangePasswordModal = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Kiểm tra xác nhận mật khẩu mới
      if (values.newPassword !== values.confirmPassword) {
        message.error('Mật khẩu mới và xác nhận không trùng khớp!');
        return;
      }

      setLoading(true);
      
      // Gọi API đổi mật khẩu
      const request = {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmPassword,
      };

      await authService.changePassword(request);
      
      message.success('Đổi mật khẩu thành công!');
      form.resetFields();
      onClose();
    } catch (error) {
      console.log('Error:', error);
      message.error(error?.message || 'Đổi mật khẩu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Đổi Mật Khẩu"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={450}
      okText="Đổi mật khẩu"
      cancelText="Hủy"
      confirmLoading={loading}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        {/* Mật khẩu cũ */}
        <Form.Item
          label="Mật khẩu hiện tại"
          name="oldPassword"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu hiện tại' },
          ]}
        >
          <div style={{ position: 'relative' }}>
            <Input
              type={showOldPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu hiện tại"
              prefix={<Lock size={16} />}
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#999',
              }}
            >
              {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Form.Item>

        {/* Mật khẩu mới */}
        <Form.Item
          label="Mật khẩu mới"
          name="newPassword"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
            { min: 8, message: 'Mật khẩu mới phải có ít nhất 8 ký tự' },
          ]}
        >
          <div style={{ position: 'relative' }}>
            <Input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu mới"
              prefix={<Lock size={16} />}
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#999',
              }}
            >
              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Form.Item>

        {/* Xác nhận mật khẩu mới */}
        <Form.Item
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
          ]}
        >
          <div style={{ position: 'relative' }}>
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Xác nhận mật khẩu mới"
              prefix={<Lock size={16} />}
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#999',
              }}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;

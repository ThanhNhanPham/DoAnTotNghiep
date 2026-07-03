import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { ArrowLeft, KeyRound, Mail, Settings, Wrench } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import carBg from '../../assets/3d-car-bg.png';
import '../Login/Login.css';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [requestForm] = Form.useForm();
  const [resetForm] = Form.useForm();
  const [requesting, setRequesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [requestedEmail, setRequestedEmail] = useState('');
  const navigate = useNavigate();

  const handleRequestToken = async ({ email }) => {
    const normalizedEmail = email.trim();
    setRequesting(true);

    try {
      const response = await authService.forgotPassword(normalizedEmail);
      setRequestedEmail(normalizedEmail);
      setEmailSent(true);
      resetForm.setFieldsValue({ token: '', newPassword: '', confirmNewPassword: '' });
      message.success(response?.message || 'Mã xác nhận đã được gửi về email.');
    } catch (error) {
      message.error(error?.message || 'Không thể gửi mã xác nhận. Vui lòng thử lại.');
    } finally {
      setRequesting(false);
    }
  };

  const handleResetPassword = async (values) => {
    if (values.newPassword !== values.confirmNewPassword) {
      message.error('Mật khẩu mới và xác nhận không trùng khớp.');
      return;
    }

    setResetting(true);

    try {
      const response = await authService.resetPassword({
        token: values.token.trim(),
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });
      message.success(response?.message || 'Đặt lại mật khẩu thành công.');
      navigate('/login');
    } catch (error) {
      message.error(error?.message || 'Không thể đặt lại mật khẩu. Vui lòng kiểm tra mã xác nhận.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-visual-section">
        <div
          className="visual-background"
          style={{ backgroundImage: `url(${carBg})` }}
        ></div>
        <div className="visual-overlay"></div>
        <div className="visual-content">
          <h1>Smart Garage System</h1>
          <p>Khôi phục quyền truy cập tài khoản quản trị an toàn và nhanh chóng</p>
        </div>
      </div>

      <div className="login-form-section">
        <div className="login-card forgot-card">
          <Link to="/login" className="back-login-link">
            <ArrowLeft size={18} />
            <span>Quay lại đăng nhập</span>
          </Link>

          <div className="login-header forgot-header">
            <div className="logo-wrapper">
              <Wrench size={36} className="logo-icon" />
              <Settings size={20} className="logo-icon-cog spinning" />
            </div>
            <h2>Quên mật khẩu</h2>
            <p>Nhập email quản trị để nhận mã xác nhận đặt lại mật khẩu</p>
          </div>

          <Form
            form={requestForm}
            name="forgot-password"
            onFinish={handleRequestToken}
            autoComplete="off"
            layout="vertical"
            className="login-form"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
            >
              <Input
                prefix={<Mail size={18} />}
                placeholder="Email quản trị"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={requesting}
                className="login-button"
                block
              >
                Gửi mã xác nhận
              </Button>
            </Form.Item>
          </Form>

          {emailSent && (
            <div className="reset-password-panel">
              <div className="reset-panel-title">
                <KeyRound size={20} />
                <div>
                  <h3>Đặt lại mật khẩu</h3>
                  <p>Mã xác nhận đã gửi tới {requestedEmail}</p>
                </div>
              </div>

              <Form
                form={resetForm}
                name="reset-password"
                onFinish={handleResetPassword}
                autoComplete="off"
                layout="vertical"
                className="login-form"
              >
                <Form.Item
                  name="token"
                  rules={[{ required: true, message: 'Vui lòng nhập mã xác nhận!' }]}
                >
                  <Input
                    prefix={<KeyRound size={18} />}
                    placeholder="Mã xác nhận"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="newPassword"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                    { min: 8, message: 'Mật khẩu mới phải có ít nhất 8 ký tự!' },
                  ]}
                >
                  <Input.Password placeholder="Mật khẩu mới" size="large" />
                </Form.Item>

                <Form.Item
                  name="confirmNewPassword"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu mới và xác nhận không trùng khớp!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Xác nhận mật khẩu mới" size="large" />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={resetting}
                    className="login-button"
                    block
                  >
                    Đặt lại mật khẩu
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

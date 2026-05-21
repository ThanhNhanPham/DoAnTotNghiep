import { useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Wrench, Settings } from 'lucide-react';
import authService from '../../services/authService';
import carBg from '../../assets/3d-car-bg.png';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await authService.login(values.email, values.password);
      console.log('Login response:', response);
      message.success('Đăng nhập thành công!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = typeof error === 'string' ? error : error.message || 'Đăng nhập thất bại!';
      message.error(errorMsg);
    } finally {
      setLoading(false);
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
          <p>Hệ thống quản lý Garage chuyên nghiệp và hiện đại nhất</p>
        </div>
      </div>

      <div className="login-form-section">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-wrapper">
              <Wrench size={36} className="logo-icon" />
              <Settings size={20} className="logo-icon-cog spinning" />
            </div>
            <h2>Chào mừng trở lại</h2>
            <p>Vui lòng đăng nhập để tiếp tục</p>
          </div>

          <Form
            name="login"
            onFinish={handleLogin}
            autoComplete="off"
            layout="vertical"
            className="login-form"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email của bạn"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mật khẩu"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <div className="form-options">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Ghi nhớ tài khoản</Checkbox>
                </Form.Item>
                <a className="forgot-password" href="#forgot">
                  Quên mật khẩu?
                </a>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                className="login-button"
                block
              >
                Đăng nhập hệ thống
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer">
            <p>
              Chưa có tài khoản? <a href="#register">Đăng ký ngay</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

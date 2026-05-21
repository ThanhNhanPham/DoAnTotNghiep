import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  message,
  Space,
  Row,
  Col,
  ColorPicker,
  Radio,
  Slider,
} from 'antd';
import {
  SaveOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { Settings as SettingsIcon, Palette, Bell, Globe, Sun, Moon } from 'lucide-react';
import './Settings.css';

const { Option } = Select;

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [themeColor, setThemeColor] = useState('#1890ff');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load settings từ localStorage hoặc API
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        form.setFieldsValue(settings);
        setThemeColor(settings.themeColor || '#1890ff');
        setDarkMode(settings.darkMode || false);
      } else {
        // Default values
        form.setFieldsValue({
          themeColor: '#1890ff',
          darkMode: false,
          fontSize: 14,
          language: 'vi',
          dateFormat: 'DD/MM/YYYY',
          timezone: 'Asia/Ho_Chi_Minh',
          emailNotifications: true,
          pushNotifications: true,
          soundEnabled: false,
          companyName: 'Smart Garage',
          companyPhone: '0901234567',
          companyEmail: 'contact@smartgarage.com',
          companyAddress: '123 Đường ABC, TPHCM',
        });
      }
      setLoading(false);
    } catch (error) {
      message.error('Không thể tải cài đặt!');
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Lưu settings vào localStorage hoặc gọi API
      const settings = {
        ...values,
        themeColor,
        darkMode,
      };
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      
      // Apply theme changes
      document.documentElement.style.setProperty('--primary-color', themeColor);
      if (darkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }

      message.success('Lưu cài đặt thành công!');
      setLoading(false);
    } catch (error) {
      message.error('Lưu cài đặt thất bại!');
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setThemeColor('#1890ff');
    setDarkMode(false);
    localStorage.removeItem('systemSettings');
    document.documentElement.style.setProperty('--primary-color', '#1890ff');
    document.body.classList.remove('dark-mode');
    message.success('Đã khôi phục cài đặt mặc định!');
  };

  const colorPresets = [
    { label: 'Xanh dương', color: '#1890ff' },
    { label: 'Xanh lá', color: '#52c41a' },
    { label: 'Đỏ', color: '#f5222d' },
    { label: 'Cam', color: '#fa8c16' },
    { label: 'Tím', color: '#722ed1' },
    { label: 'Hồng', color: '#eb2f96' },
  ];

  return (
    <div className="settings-container">
      <div className="page-header">
        <div className="header-content">
          <SettingsIcon size={32} />
          <div>
            <h1>Cài đặt hệ thống</h1>
            <p>Tùy chỉnh giao diện và cấu hình cơ bản</p>
          </div>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="settings-form"
      >
        <Row gutter={24}>
          {/* Cột trái */}
          <Col xs={24} lg={12}>
            {/* Giao diện */}
            <Card className="settings-card" title={
              <div className="card-title">
                <Palette size={20} />
                <span>Giao diện</span>
              </div>
            }>
              <Form.Item label="Chế độ hiển thị" name="darkMode">
                <Radio.Group 
                  onChange={(e) => setDarkMode(e.target.value)}
                  value={darkMode}
                  buttonStyle="solid"
                  size="large"
                >
                  <Radio.Button value={false}>
                    <Sun size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Sáng
                  </Radio.Button>
                  <Radio.Button value={true}>
                    <Moon size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Tối
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="Màu chủ đạo" name="themeColor">
                <div>
                  <ColorPicker
                    value={themeColor}
                    onChange={(color) => setThemeColor(color.toHexString())}
                    showText
                    size="large"
                    style={{ width: '100%', marginBottom: 12 }}
                  />
                  <div className="color-presets">
                    {colorPresets.map((preset) => (
                      <div
                        key={preset.color}
                        className={`color-preset ${themeColor === preset.color ? 'active' : ''}`}
                        style={{ backgroundColor: preset.color }}
                        onClick={() => setThemeColor(preset.color)}
                        title={preset.label}
                      />
                    ))}
                  </div>
                </div>
              </Form.Item>

              <Form.Item 
                label="Kích thước chữ" 
                name="fontSize"
                tooltip="Điều chỉnh kích thước chữ mặc định"
              >
                <Slider
                  min={12}
                  max={18}
                  marks={{
                    12: '12px',
                    14: '14px',
                    16: '16px',
                    18: '18px',
                  }}
                />
              </Form.Item>
            </Card>

            {/* Ngôn ngữ & Định dạng */}
            <Card className="settings-card" title={
              <div className="card-title">
                <Globe size={20} />
                <span>Ngôn ngữ & Định dạng</span>
              </div>
            }>
              <Form.Item label="Ngôn ngữ" name="language">
                <Select size="large">
                  <Option value="vi">🇻🇳 Tiếng Việt</Option>
                  <Option value="en">🇺🇸 English</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Định dạng ngày tháng" name="dateFormat">
                <Select size="large">
                  <Option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</Option>
                  <Option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</Option>
                  <Option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Múi giờ" name="timezone">
                <Select size="large" showSearch>
                  <Option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</Option>
                  <Option value="Asia/Bangkok">Thái Lan (GMT+7)</Option>
                  <Option value="Asia/Singapore">Singapore (GMT+8)</Option>
                  <Option value="Asia/Tokyo">Nhật Bản (GMT+9)</Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>

          {/* Cột phải */}
          <Col xs={24} lg={12}>
            {/* Thông báo */}
            <Card className="settings-card" title={
              <div className="card-title">
                <Bell size={20} />
                <span>Thông báo</span>
              </div>
            }>
              <div className="switch-list">
                <Form.Item name="emailNotifications" valuePropName="checked">
                  <div className="switch-item">
                    <div>
                      <strong>Thông báo Email</strong>
                      <p>Nhận thông báo qua email</p>
                    </div>
                    <Switch />
                  </div>
                </Form.Item>

                <Form.Item name="pushNotifications" valuePropName="checked">
                  <div className="switch-item">
                    <div>
                      <strong>Thông báo đẩy</strong>
                      <p>Hiển thị thông báo trên trình duyệt</p>
                    </div>
                    <Switch />
                  </div>
                </Form.Item>

                <Form.Item name="soundEnabled" valuePropName="checked">
                  <div className="switch-item">
                    <div>
                      <strong>Âm thanh thông báo</strong>
                      <p>Phát âm thanh khi có thông báo mới</p>
                    </div>
                    <Switch />
                  </div>
                </Form.Item>
              </div>
            </Card>

            {/* Thông tin cơ bản */}
            <Card className="settings-card" title={
              <div className="card-title">
                <GlobalOutlined />
                <span>Thông tin cơ bản</span>
              </div>
            }>
              <Form.Item label="Tên doanh nghiệp" name="companyName">
                <Input size="large" placeholder="Smart Garage" />
              </Form.Item>

              <Form.Item label="Số điện thoại" name="companyPhone">
                <Input size="large" placeholder="0901234567" />
              </Form.Item>

              <Form.Item label="Email" name="companyEmail">
                <Input size="large" type="email" placeholder="contact@smartgarage.com" />
              </Form.Item>

              <Form.Item label="Địa chỉ" name="companyAddress">
                <Input.TextArea 
                  size="large" 
                  rows={2} 
                  placeholder="123 Đường ABC, Quận 1, TPHCM" 
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        {/* Nút hành động */}
        <div className="settings-actions">
          <Space size="middle">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
            >
              Lưu thay đổi
            </Button>
            <Button
              onClick={handleReset}
              size="large"
            >
              Khôi phục mặc định
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default Settings;

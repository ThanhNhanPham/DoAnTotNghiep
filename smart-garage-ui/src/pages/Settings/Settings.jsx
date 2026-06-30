import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  message,
  Space,
  Row,
  Col,
  ColorPicker,
  Radio,
  Slider,
  Tag,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Settings as SettingsIcon,
  Palette,
  Globe,
  Sun,
  Moon,
  Building2,
  BadgeCheck,
  MonitorSmartphone,
  Clock3,
  GitBranch,
} from 'lucide-react';
import settingsService from '../../services/settingsService';
import { getApiErrorMessage } from '../../services/reviewService';
import './Settings.css';

const { Option } = Select;

const DEFAULT_SETTINGS = {
  version: 0,
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
};

const colorPresets = [
  { label: 'Xanh dương', color: '#1890ff' },
  { label: 'Xanh lá', color: '#16a34a' },
  { label: 'Teal', color: '#0f766e' },
  { label: 'Cam', color: '#ea580c' },
  { label: 'Đỏ', color: '#dc2626' },
  { label: 'Tím', color: '#7c3aed' },
];

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [themeColor, setThemeColor] = useState(DEFAULT_SETTINGS.themeColor);
  const [darkMode, setDarkMode] = useState(DEFAULT_SETTINGS.darkMode);
  const [fontSize, setFontSize] = useState(DEFAULT_SETTINGS.fontSize);

  const applyTheme = useCallback((nextThemeColor, nextDarkMode, nextFontSize = DEFAULT_SETTINGS.fontSize) => {
    const normalizedTheme = {
      themeColor: nextThemeColor || DEFAULT_SETTINGS.themeColor,
      darkMode: Boolean(nextDarkMode),
      fontSize: Number(nextFontSize) || DEFAULT_SETTINGS.fontSize,
    };

    localStorage.setItem('adminThemeSettings', JSON.stringify(normalizedTheme));
    document.documentElement.style.setProperty('--primary-color', normalizedTheme.themeColor);
    document.documentElement.style.setProperty('--app-font-size', `${normalizedTheme.fontSize}px`);
    document.documentElement.style.setProperty('--app-font-scale', String(normalizedTheme.fontSize / DEFAULT_SETTINGS.fontSize));
    document.body.classList.toggle('dark-mode', normalizedTheme.darkMode);
    window.dispatchEvent(new CustomEvent('admin-theme-change'));
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await settingsService.getSystemSettings();
      form.setFieldsValue(settings);
      setThemeColor(settings.themeColor || DEFAULT_SETTINGS.themeColor);
      setDarkMode(Boolean(settings.darkMode));
      setFontSize(Number(settings.fontSize) || DEFAULT_SETTINGS.fontSize);
      applyTheme(
        settings.themeColor || DEFAULT_SETTINGS.themeColor,
        Boolean(settings.darkMode),
        settings.fontSize || DEFAULT_SETTINGS.fontSize
      );
    } catch (error) {
      form.setFieldsValue(DEFAULT_SETTINGS);
      setThemeColor(DEFAULT_SETTINGS.themeColor);
      setDarkMode(DEFAULT_SETTINGS.darkMode);
      setFontSize(DEFAULT_SETTINGS.fontSize);
      applyTheme(DEFAULT_SETTINGS.themeColor, DEFAULT_SETTINGS.darkMode, DEFAULT_SETTINGS.fontSize);
      message.error(getApiErrorMessage(error, 'Không thể tải cài đặt!'));
    } finally {
      setLoading(false);
    }
  }, [applyTheme, form]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        version: values.version ?? settingsSnapshot.version ?? DEFAULT_SETTINGS.version,
        themeColor,
        darkMode,
        fontSize,
        emailNotifications: settingsSnapshot.emailNotifications ?? DEFAULT_SETTINGS.emailNotifications,
        pushNotifications: settingsSnapshot.pushNotifications ?? DEFAULT_SETTINGS.pushNotifications,
        soundEnabled: settingsSnapshot.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled,
      };
      const savedSettings = await settingsService.updateSystemSettings(payload);
      form.setFieldsValue(savedSettings);
      setThemeColor(savedSettings.themeColor || DEFAULT_SETTINGS.themeColor);
      setDarkMode(Boolean(savedSettings.darkMode));
      setFontSize(Number(savedSettings.fontSize) || DEFAULT_SETTINGS.fontSize);
      applyTheme(
        savedSettings.themeColor || DEFAULT_SETTINGS.themeColor,
        Boolean(savedSettings.darkMode),
        savedSettings.fontSize || DEFAULT_SETTINGS.fontSize
      );
      message.success('Lưu cài đặt thành công!');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Lưu cài đặt thất bại!'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const savedSettings = await settingsService.resetSystemSettings();
      form.setFieldsValue(savedSettings);
      setThemeColor(savedSettings.themeColor || DEFAULT_SETTINGS.themeColor);
      setDarkMode(Boolean(savedSettings.darkMode));
      setFontSize(Number(savedSettings.fontSize) || DEFAULT_SETTINGS.fontSize);
      applyTheme(
        savedSettings.themeColor || DEFAULT_SETTINGS.themeColor,
        Boolean(savedSettings.darkMode),
        savedSettings.fontSize || DEFAULT_SETTINGS.fontSize
      );
      message.success('Đã khôi phục cài đặt mặc định!');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Không thể khôi phục cài đặt mặc định!'));
    } finally {
      setLoading(false);
    }
  };

  const watchedSettings = Form.useWatch([], form);
  const settingsSnapshot = useMemo(() => watchedSettings || {}, [watchedSettings]);

  const summaryItems = useMemo(
    () => [
      {
        icon: MonitorSmartphone,
        label: 'Giao diện',
        value: darkMode ? 'Chế độ tối' : 'Chế độ sáng',
      },
      {
        icon: Globe,
        label: 'Ngôn ngữ',
        value: (settingsSnapshot.language || DEFAULT_SETTINGS.language) === 'vi' ? 'Tiếng Việt' : 'English',
      },
      {
        icon: Clock3,
        label: 'Múi giờ',
        value: settingsSnapshot.timezone || DEFAULT_SETTINGS.timezone,
      },
      {
        icon: GitBranch,
        label: 'Phiên bản',
        value: `Version ${settingsSnapshot.version ?? DEFAULT_SETTINGS.version}`,
      },
    ],
    [darkMode, settingsSnapshot]
  );

  return (
    <div className="settings-shell">
      <div className="settings-hero">
        <div className="settings-hero-main">
          <div className="settings-hero-icon">
            <SettingsIcon size={24} />
          </div>
          <div>
            <span className="settings-kicker">Admin Preferences</span>
            <h1>Cài đặt hệ thống</h1>
            <p>Quản lý giao diện, định dạng và thông tin hiển thị mặc định cho khu vực quản trị Smart Garage.</p>
          </div>
        </div>
        <div className="settings-hero-meta">
          <Tag color="blue">Đồng bộ API</Tag>
          <Tag color={darkMode ? 'purple' : 'gold'}>{darkMode ? 'Dark Mode' : 'Light Mode'}</Tag>
        </div>
      </div>

      <Row gutter={[20, 20]} align="top">
        <Col xs={24} xl={16}>
          <Form form={form} layout="vertical" onFinish={handleSubmit} className="settings-form">
            <Form.Item name="version" hidden>
              <Input type="hidden" />
            </Form.Item>

            <Card
              className="settings-panel"
              title={
                <div className="settings-panel-title">
                  <Palette size={18} />
                  <div>
                    <strong>Giao diện</strong>
                    <span>Tùy chỉnh màu sắc và cách hiển thị khu vực quản trị.</span>
                  </div>
                </div>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Form.Item label="Chế độ hiển thị" name="darkMode">
                    <Radio.Group
                      className="settings-mode-group"
                      onChange={(event) => setDarkMode(event.target.value)}
                      value={darkMode}
                      buttonStyle="solid"
                      size="large"
                    >
                      <Radio.Button value={false}>
                        <Sun size={16} />
                        <span>Sáng</span>
                      </Radio.Button>
                      <Radio.Button value={true}>
                        <Moon size={16} />
                        <span>Tối</span>
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item label="Kích thước chữ" name="fontSize" tooltip="Áp dụng cho các nội dung hiển thị chính">
                    <Slider
                      min={12}
                      max={18}
                      value={fontSize}
                      onChange={(value) => {
                        setFontSize(value);
                        form.setFieldValue('fontSize', value);
                        applyTheme(themeColor, darkMode, value);
                      }}
                      marks={{
                        12: '12',
                        14: '14',
                        16: '16',
                        18: '18',
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Màu chủ đạo" name="themeColor">
                <div className="theme-color-block">
                  <ColorPicker
                    value={themeColor}
                    onChange={(color) => setThemeColor(color.toHexString())}
                    showText
                    size="large"
                  />
                  <div className="color-presets">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        className={`color-preset ${themeColor === preset.color ? 'active' : ''}`}
                        style={{ backgroundColor: preset.color }}
                        onClick={() => setThemeColor(preset.color)}
                        aria-label={preset.label}
                        title={preset.label}
                      />
                    ))}
                  </div>
                </div>
              </Form.Item>
            </Card>

            <Card
              className="settings-panel"
              title={
                <div className="settings-panel-title">
                  <Globe size={18} />
                  <div>
                    <strong>Ngôn ngữ và định dạng</strong>
                    <span>Thiết lập mặc định cho ngày tháng, múi giờ và cách hiển thị nội dung.</span>
                  </div>
                </div>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item label="Ngôn ngữ" name="language">
                    <Select size="large">
                      <Option value="vi">Tiếng Việt</Option>
                      <Option value="en">English</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Định dạng ngày tháng" name="dateFormat">
                    <Select size="large">
                      <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                      <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                      <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Múi giờ" name="timezone">
                    <Select size="large" showSearch optionFilterProp="children">
                      <Option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</Option>
                      <Option value="Asia/Bangkok">Thái Lan (GMT+7)</Option>
                      <Option value="Asia/Singapore">Singapore (GMT+8)</Option>
                      <Option value="Asia/Tokyo">Nhật Bản (GMT+9)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              className="settings-panel"
              title={
                <div className="settings-panel-title">
                  <Building2 size={18} />
                  <div>
                    <strong>Thông tin doanh nghiệp</strong>
                    <span>Dữ liệu hiển thị trong email, hóa đơn và các tài liệu nội bộ.</span>
                  </div>
                </div>
              }
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item label="Tên doanh nghiệp" name="companyName">
                    <Input size="large" placeholder="Smart Garage" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Số điện thoại" name="companyPhone">
                    <Input size="large" placeholder="0901234567" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item label="Email liên hệ" name="companyEmail">
                    <Input size="large" type="email" placeholder="contact@smartgarage.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Địa chỉ" name="companyAddress">
                    <Input.TextArea rows={3} placeholder="123 Đường ABC, Quận 1, TP.HCM" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <div className="settings-actions">
              <Space size="middle">
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} size="large">
                  Lưu thay đổi
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />} size="large">
                  Khôi phục mặc định
                </Button>
              </Space>
            </div>
          </Form>
        </Col>

        <Col xs={24} xl={8}>
          <div className="settings-sidebar">
            <Card className="settings-preview-card" bordered={false}>
              <div className="settings-preview-top">
                <div className="preview-swatch" style={{ background: themeColor }} />
                <div>
                  <h3>{settingsSnapshot.companyName || DEFAULT_SETTINGS.companyName}</h3>
                  <p>{settingsSnapshot.companyEmail || DEFAULT_SETTINGS.companyEmail}</p>
                </div>
              </div>

              <div className={`settings-preview-surface ${darkMode ? 'dark' : 'light'}`}>
                <div className="preview-toolbar">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="preview-stat">
                  <div className="preview-stat-value">128</div>
                  <div className="preview-stat-label">Lịch hẹn đang theo dõi</div>
                </div>
                <div className="preview-accent" style={{ background: themeColor }} />
              </div>

              <div className="settings-summary-list">
                {summaryItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="settings-summary-item">
                      <div className="settings-summary-icon">
                        <Icon size={16} />
                      </div>
                      <div>
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card
              className="settings-info-card"
              title={
                <div className="settings-info-title">
                  <BadgeCheck size={18} />
                  <span>Khuyến nghị vận hành</span>
                </div>
              }
              bordered={false}
            >
              <ul className="settings-info-list">
                <li>Dùng cùng một múi giờ cho toàn bộ quản trị viên để tránh lệch lịch hẹn.</li>
                <li>Thông tin doanh nghiệp nên khớp với hóa đơn và mẫu email tự động.</li>
              </ul>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;

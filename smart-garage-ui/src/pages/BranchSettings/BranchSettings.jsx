import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, Row, Spin, Tag, message } from 'antd';
import { EnvironmentOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { Building2, MapPin, Phone, Image as ImageIcon } from 'lucide-react';
import authService from '../../services/authService';
import branchService from '../../services/branchService';
import { getApiErrorMessage } from '../../services/reviewService';
import './BranchSettings.css';

const BranchSettings = () => {
  const [form] = Form.useForm();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const userInfo = useMemo(() => authService.getUserInfo(), []);
  const branchId = userInfo.branchId ? Number(userInfo.branchId) : null;

  const loadBranch = useCallback(async () => {
    if (!branchId) return;

    setLoading(true);
    try {
      const data = await branchService.getBranchById(branchId);
      setBranch(data);
      form.setFieldsValue(data);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Không thể tải thông tin chi nhánh!'));
    } finally {
      setLoading(false);
    }
  }, [branchId, form]);

  useEffect(() => {
    loadBranch();
  }, [loadBranch]);

  const handleSubmit = async (values) => {
    if (!branchId || !branch) return;

    setSaving(true);
    try {
      const payload = {
        ...branch,
        ...values,
        isActive: branch.isActive !== false,
      };
      const savedBranch = await branchService.updateBranch(branchId, payload);
      setBranch(savedBranch);
      form.setFieldsValue(savedBranch);
      message.success('Đã lưu cài đặt chi nhánh!');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Lưu cài đặt chi nhánh thất bại!'));
    } finally {
      setSaving(false);
    }
  };

  if (!branchId) {
    return (
      <Card className="branch-settings-empty">
        <Building2 size={34} />
        <h2>Chưa được gán chi nhánh</h2>
        <p>Tài khoản admin này chưa có chi nhánh phụ trách. Vui lòng liên hệ superadmin để phân công chi nhánh.</p>
      </Card>
    );
  }

  return (
    <div className="branch-settings-page">
      <div className="branch-settings-hero">
        <div className="branch-settings-hero-main">
          <div className="branch-settings-icon">
            <Building2 size={24} />
          </div>
          <div>
            <span className="branch-settings-kicker">Branch Preferences</span>
            <h1>Cài đặt chi nhánh</h1>
            <p>Cập nhật thông tin liên hệ, địa chỉ và tọa độ cho chi nhánh bạn đang phụ trách.</p>
          </div>
        </div>
        <Tag color={branch?.isActive === false ? 'red' : 'green'}>
          {branch?.isActive === false ? 'Không hoạt động' : 'Đang hoạt động'}
        </Tag>
      </div>

      <Spin spinning={loading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={[20, 20]}>
            <Col xs={24} xl={15}>
              <Card
                className="branch-settings-card"
                title={
                  <div className="branch-settings-card-title">
                    <Building2 size={18} />
                    <div>
                      <strong>Thông tin chi nhánh</strong>
                      <span>Những thông tin này hiển thị cho khách hàng khi chọn gara.</span>
                    </div>
                  </div>
                }
              >
                <Form.Item
                  label="Tên chi nhánh"
                  name="name"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên chi nhánh' },
                    { min: 3, max: 100, message: 'Tên chi nhánh phải từ 3-100 ký tự' },
                  ]}
                >
                  <Input prefix={<Building2 size={16} />} placeholder="VD: Gara Smart - Thủ Đức" />
                </Form.Item>

                <Form.Item
                  label="Địa chỉ"
                  name="address"
                  rules={[
                    { required: true, message: 'Vui lòng nhập địa chỉ' },
                    { max: 500, message: 'Địa chỉ không được vượt quá 500 ký tự' },
                  ]}
                >
                  <Input.TextArea rows={3} placeholder="Nhập địa chỉ đầy đủ của chi nhánh" />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} lg={12}>
                    <Form.Item
                      label="Số điện thoại"
                      name="phone"
                      rules={[
                        { required: true, message: 'Vui lòng nhập số điện thoại' },
                        { pattern: /^(0|\+84)[0-9]{9,10}$/, message: 'Số điện thoại không hợp lệ' },
                      ]}
                    >
                      <Input prefix={<Phone size={16} />} placeholder="VD: 0901234567" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Form.Item
                      label="Ảnh chi nhánh"
                      name="imageUrl"
                      rules={[
                        { max: 255, message: 'Đường dẫn ảnh không được quá 255 ký tự' },
                        {
                          pattern: /^$|^https?:\/\/.+\..+/,
                          message: 'Vui lòng nhập URL hình ảnh hợp lệ',
                        },
                      ]}
                    >
                      <Input prefix={<ImageIcon size={16} />} placeholder="https://example.com/image.jpg" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} xl={9}>
              <Card
                className="branch-settings-card"
                title={
                  <div className="branch-settings-card-title">
                    <MapPin size={18} />
                    <div>
                      <strong>Tọa độ bản đồ</strong>
                      <span>Dùng để sắp xếp chi nhánh theo vị trí khách hàng.</span>
                    </div>
                  </div>
                }
              >
                <Form.Item
                  label="Vĩ độ"
                  name="latitude"
                  rules={[{ type: 'number', min: -90, max: 90, message: 'Vĩ độ phải từ -90 đến 90' }]}
                >
                  <InputNumber className="branch-settings-number" placeholder="10.762622" />
                </Form.Item>

                <Form.Item
                  label="Kinh độ"
                  name="longitude"
                  rules={[{ type: 'number', min: -180, max: 180, message: 'Kinh độ phải từ -180 đến 180' }]}
                >
                  <InputNumber className="branch-settings-number" placeholder="106.660172" />
                </Form.Item>

                <div className="branch-settings-note">
                  <EnvironmentOutlined />
                  <span>Tọa độ chính xác giúp khách hàng nhìn thấy chi nhánh phù hợp hơn khi đặt lịch.</span>
                </div>
              </Card>
            </Col>
          </Row>

          <div className="branch-settings-actions">
            <Button icon={<ReloadOutlined />} onClick={loadBranch} disabled={saving}>
              Tải lại
            </Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              Lưu cài đặt chi nhánh
            </Button>
          </div>
        </Form>
      </Spin>
    </div>
  );
};

export default BranchSettings;

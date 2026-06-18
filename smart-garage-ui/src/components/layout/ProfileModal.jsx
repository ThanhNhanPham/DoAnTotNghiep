import { Modal, Form, Input, Button, message, Spin } from 'antd';
import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, User } from 'lucide-react';
import authService from '../../services/authService';

const ProfileModal = ({ visible, onClose, userEmail }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    houseNumber: '',
    ward: '',
    province: '',
  });

  useEffect(() => {
    if (visible) {
      fetchProfileData();
    }
  }, [visible]);

  const fetchProfileData = async () => {
    try {
      setFetchLoading(true);
      // Lấy dữ liệu từ backend
      const userData = await authService.getCurrentUser();
      const data = {
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        houseNumber: userData.houseNumber || '',
        ward: userData.ward || '',
        province: userData.province || '',
      };
      setProfileData(data);
      form.setFieldsValue(data);
    } catch (error) {
      console.log('Error fetching profile:', error);
      message.error('Lấy thông tin hồ sơ thất bại!');
      // Fallback dữ liệu từ localStorage
      const userInfo = authService.getUserInfo();
      const initialData = {
        fullName: userEmail?.split('@')[0] || '',
        email: userEmail || userInfo.email || '',
        phone: localStorage.getItem('userPhone') || '',
        houseNumber: localStorage.getItem('userHouseNumber') || '',
        ward: localStorage.getItem('userWard') || '',
        province: localStorage.getItem('userProvince') || '',
      };
      setProfileData(initialData);
      form.setFieldsValue(initialData);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.setFieldsValue(profileData);
    onClose();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Gọi API cập nhật profile
      await authService.updateProfile(values);

      // Lưu thông tin vào localStorage
      localStorage.setItem('userPhone', values.phone);
      localStorage.setItem('userHouseNumber', values.houseNumber);
      localStorage.setItem('userWard', values.ward);
      localStorage.setItem('userProvince', values.province);

      setProfileData(values);
      setIsEditing(false);
      message.success('Cập nhật thông tin thành công!');
    } catch (error) {
      console.log('Error:', error);
      message.error(error?.message || 'Cập nhật thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Thông tin Cá Nhân"
      open={visible}
      onCancel={handleCancel}
      width={500}
      centered
      footer={
        !isEditing ? (
          [
            <Button key="close" onClick={onClose}>
              Đóng
            </Button>,
            <Button key="edit" type="primary" onClick={handleEdit}>
              Chỉnh Sửa
            </Button>,
          ]
        ) : (
          [
            <Button key="cancel" onClick={handleCancel}>
              Hủy
            </Button>,
            <Button key="save" type="primary" loading={loading} onClick={handleSave}>
              Lưu Thay Đổi
            </Button>,
          ]
        )
      }
    >
      <Spin spinning={fetchLoading}>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
        {/* Tên người dùng */}
        <Form.Item
          label="Tên người dùng"
          name="fullName"
          rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
        >
          <Input
            prefix={<User size={16} />}
            placeholder="Nhập tên"
            disabled={!isEditing}
          />
        </Form.Item>

        {/* Email */}
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input
            prefix={<Mail size={16} />}
            placeholder="Nhập email"
            disabled
            style={{ cursor: 'not-allowed', opacity: 0.6 }}
          />
        </Form.Item>

        {/* Số điện thoại */}
        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại' },
            {
              pattern: /^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/,
              message: 'Số điện thoại không đúng định dạng Việt Nam',
            },
          ]}
        >
          <Input
            prefix={<Phone size={16} />}
            placeholder="Nhập số điện thoại"
            disabled={!isEditing}
          />
        </Form.Item>

        {/* Số nhà, tên đường */}
        <Form.Item
          label="Số nhà, tên đường"
          name="houseNumber"
          rules={[
            { required: true, message: 'Vui lòng nhập số nhà, tên đường' },
            { max: 100, message: 'Số nhà không được quá 100 ký tự' },
          ]}
        >
          <Input
            prefix={<MapPin size={16} />}
            placeholder="Nhập số nhà, tên đường"
            disabled={!isEditing}
          />
        </Form.Item>

        {/* Phường/Xã */}
        <Form.Item
          label="Phường/Xã"
          name="ward"
          rules={[
            { required: true, message: 'Vui lòng nhập phường/xã' },
            { max: 100, message: 'Tên phường/xã không được quá 100 ký tự' },
          ]}
        >
          <Input
            placeholder="Nhập phường/xã"
            disabled={!isEditing}
          />
        </Form.Item>

        {/* Tỉnh/Thành phố */}
        <Form.Item
          label="Tỉnh/Thành phố"
          name="province"
          rules={[
            { required: true, message: 'Vui lòng nhập tỉnh/thành phố' },
            { max: 100, message: 'Tên tỉnh không được quá 100 ký tự' },
          ]}
        >
          <Input
            placeholder="Nhập tỉnh/thành phố"
            disabled={!isEditing}
          />
        </Form.Item>
      </Form>
      </Spin>
    </Modal>
  );
};

export default ProfileModal;

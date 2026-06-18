import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getFirstAllowedAdminPath } from '../../config/permissions';
import authService from '../../services/authService';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="Không có quyền truy cập"
      subTitle="Tài khoản của bạn không được cấp quyền sử dụng chức năng này."
      extra={
        <Button type="primary" onClick={() => navigate(getFirstAllowedAdminPath(authService.getUserRole()))}>
          Về trang được phép
        </Button>
      }
    />
  );
};

export default Unauthorized;

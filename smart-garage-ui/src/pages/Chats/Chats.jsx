import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Empty, Input, List, Space, Spin, Tag, Typography, message } from 'antd';
import { Building2, CarFront, MessageSquare, Send, UserRound } from 'lucide-react';
import chatService from '../../services/chatService';
import './Chats.css';

const POLL_INTERVAL_MS = 5000;

const STATUS_LABELS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  ARRIVED: 'Đã tiếp nhận',
  IN_PROGRESS: 'Đang sửa',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const formatDateTime = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Chats = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  );

  const loadRooms = useCallback(async (preserveSelection = true) => {
    try {
      setRoomsLoading(true);
      const data = await chatService.getRooms();
      const nextRooms = Array.isArray(data) ? data : [];
      setRooms(nextRooms);
      setSelectedRoomId((currentSelectedRoomId) => {
        if (!preserveSelection) {
          return nextRooms[0]?.id ?? null;
        }

        return nextRooms.some((room) => room.id === currentSelectedRoomId)
          ? currentSelectedRoomId
          : (nextRooms[0]?.id ?? null);
      });
    } catch (error) {
      console.error('Load chat rooms failed:', error);
      message.error('Không thể tải danh sách chat.');
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (roomId) => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    try {
      setMessagesLoading(true);
      const data = await chatService.getMessages(roomId);
      setMessages(Array.isArray(data) ? data : []);
      await chatService.markRoomAsRead(roomId);
      setRooms((prev) => prev.map((room) => (room.id === roomId ? { ...room, unreadCount: 0 } : room)));
    } catch (error) {
      console.error('Load chat messages failed:', error);
      message.error('Không thể tải tin nhắn.');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms(false);
  }, [loadRooms]);

  useEffect(() => {
    if (selectedRoomId) {
      loadMessages(selectedRoomId);
    }
  }, [selectedRoomId, loadMessages]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadRooms(true);
      if (selectedRoomId) {
        loadMessages(selectedRoomId);
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [loadMessages, loadRooms, selectedRoomId]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!selectedRoomId || !trimmed) return;

    try {
      setSending(true);
      const sentMessage = await chatService.sendMessage(selectedRoomId, trimmed);
      setMessages((prev) => [...prev, sentMessage]);
      setDraft('');
      await loadRooms(true);
    } catch (error) {
      console.error('Send message failed:', error);
      message.error('Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-admin-page">
      <div className="chat-admin-header">
        <div>
          <Typography.Title level={3}>Chat khách hàng</Typography.Title>
          <Typography.Text type="secondary">
            Theo dõi và phản hồi các cuộc trò chuyện theo booking.
          </Typography.Text>
        </div>
      </div>

      <div className="chat-admin-layout">
        <Card className="chat-room-panel" bordered={false}>
          <div className="chat-panel-title">
            <MessageSquare size={18} />
            <span>Cuộc trò chuyện</span>
          </div>

          {roomsLoading && rooms.length === 0 ? (
            <div className="chat-panel-state">
              <Spin />
            </div>
          ) : rooms.length === 0 ? (
            <div className="chat-panel-state">
              <Empty description="Chưa có cuộc trò chuyện nào" />
            </div>
          ) : (
            <List
              className="chat-room-list"
              dataSource={rooms}
              renderItem={(room) => (
                <List.Item
                  className={`chat-room-item ${room.id === selectedRoomId ? 'active' : ''}`}
                  onClick={() => setSelectedRoomId(room.id)}>
                  <div className="chat-room-main">
                    <div className="chat-room-top">
                      <Typography.Text strong>{room.customerName || 'Khách hàng'}</Typography.Text>
                      <Space size={8}>
                        {room.unreadCount > 0 ? <Badge count={room.unreadCount} /> : null}
                        {room.bookingStatus ? <Tag>{STATUS_LABELS[room.bookingStatus] || room.bookingStatus}</Tag> : null}
                      </Space>
                    </div>
                    <div className="chat-room-meta">
                      <span><Building2 size={14} /> {room.branchName || 'Chưa có chi nhánh'}</span>
                      <span><CarFront size={14} /> {room.licensePlate || `Booking #${room.bookingId}`}</span>
                    </div>
                    <Typography.Paragraph ellipsis={{ rows: 2 }} className="chat-room-preview">
                      {room.lastMessagePreview || 'Chưa có tin nhắn nào'}
                    </Typography.Paragraph>
                    <Typography.Text type="secondary" className="chat-room-time">
                      {formatDateTime(room.lastMessageAt || room.createdAt)}
                    </Typography.Text>
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>

        <Card className="chat-message-panel" bordered={false}>
          {selectedRoom ? (
            <>
              <div className="chat-message-header">
                <div>
                  <Typography.Title level={4}>{selectedRoom.customerName || 'Khách hàng'}</Typography.Title>
                  <Space wrap size={[12, 6]}>
                    <Typography.Text type="secondary">
                      <UserRound size={14} /> {selectedRoom.customerPhone || 'Chưa có số điện thoại'}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      <CarFront size={14} /> {selectedRoom.vehicleName || selectedRoom.licensePlate || `Booking #${selectedRoom.bookingId}`}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      <Building2 size={14} /> {selectedRoom.branchName || 'Chưa có chi nhánh'}
                    </Typography.Text>
                  </Space>
                </div>
                <Tag color="blue">Booking #{selectedRoom.bookingId}</Tag>
              </div>

              <div className="chat-message-thread">
                {messagesLoading && messages.length === 0 ? (
                  <div className="chat-panel-state">
                    <Spin />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-panel-state">
                    <Empty description="Chưa có tin nhắn" />
                  </div>
                ) : (
                  messages.map((item) => {
                    const isAdminMessage = item.senderRole === 'ADMIN' || item.senderRole === 'SUPERADMIN';

                    return (
                      <div key={item.id} className={`chat-bubble-row ${isAdminMessage ? 'mine' : 'theirs'}`}>
                        <div className={`chat-bubble ${isAdminMessage ? 'mine' : 'theirs'}`}>
                          <div className="chat-bubble-author">
                            {item.senderName || (isAdminMessage ? 'Gara' : 'Khách hàng')}
                          </div>
                          <div className="chat-bubble-content">{item.content}</div>
                          <div className="chat-bubble-time">{formatDateTime(item.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="chat-composer">
                <Input.TextArea
                  rows={3}
                  value={draft}
                  placeholder="Nhập phản hồi cho khách hàng..."
                  onChange={(event) => setDraft(event.target.value)}
                  onPressEnter={(event) => {
                    if (!event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  type="primary"
                  icon={<Send size={16} />}
                  onClick={handleSend}
                  loading={sending}
                  disabled={!draft.trim()}>
                  Gửi
                </Button>
              </div>
            </>
          ) : (
            <div className="chat-panel-state chat-empty-state">
              <MessageSquare size={36} />
              <Typography.Title level={4}>Chọn một cuộc trò chuyện</Typography.Title>
              <Typography.Text type="secondary">
                Danh sách chat chỉ hiển thị các booking mà tài khoản hiện tại được phép truy cập.
              </Typography.Text>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Chats;

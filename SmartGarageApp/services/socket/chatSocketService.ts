import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from '@/constants/Api';
import { ChatMessage } from '@/services/chatService';

type SocketEventType = 'MESSAGE_CREATED' | 'TYPING' | 'ROOM_READ';

export interface ChatSocketEvent {
  type: SocketEventType;
  roomId: number;
  message?: ChatMessage;
  actorRole?: string | null;
  actorName?: string | null;
  readAt?: string | null;
}

type EventHandler = (event: ChatSocketEvent) => void;

type Subscription = {
  id: string;
  destination: string;
  handler: EventHandler;
};

const CONNECT_COMMAND = ['CONNECT', 'accept-version:1.2', 'heart-beat:0,0', '', ''].join('\n');
const RECONNECT_DELAY_MS = 2000;

class ChatSocketService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectPromise: Promise<void> | null = null;
  private frameBuffer = '';
  private manuallyClosed = false;
  private subscriptionCounter = 0;
  private subscriptions = new Map<string, Subscription>();

  async connect() {
    if (this.isConnected) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.manuallyClosed = false;
    this.connectPromise = this.openSocket();
    return this.connectPromise;
  }

  disconnect() {
    this.manuallyClosed = true;
    this.clearReconnectTimer();
    this.isConnected = false;
    this.isConnecting = false;
    this.connectPromise = null;

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  async subscribeToRoom(roomId: number, handler: EventHandler) {
    const destination = `/topic/chat.rooms.${roomId}`;
    return this.subscribe(destination, handler);
  }

  async subscribeToUserQueue(handler: EventHandler) {
    return this.subscribe('/user/queue/chat.acks', handler);
  }

  unsubscribe(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }

    this.subscriptions.delete(subscriptionId);

    if (this.isConnected) {
      this.sendFrame(['UNSUBSCRIBE', `id:${subscription.id}`, '', ''].join('\n'));
    }

    if (this.subscriptions.size === 0) {
      this.disconnect();
    }
  }

  async sendMessage(roomId: number, content: string) {
    await this.send('/app/chat.send', { roomId, content });
  }

  async sendTyping(roomId: number) {
    await this.send('/app/chat.typing', { roomId });
  }

  async markRoomAsRead(roomId: number) {
    await this.send('/app/chat.read', { roomId });
  }

  private async subscribe(destination: string, handler: EventHandler) {
    await this.connect();

    const id = `sub-${++this.subscriptionCounter}`;
    const subscription: Subscription = { id, destination, handler };
    this.subscriptions.set(id, subscription);

    if (this.isConnected) {
      this.sendSubscribeFrame(subscription);
    }

    return id;
  }

  private async send(destination: string, payload: unknown) {
    await this.connect();

    const body = JSON.stringify(payload);
    const frame = [
      'SEND',
      `destination:${destination}`,
      'content-type:application/json',
      '',
      body,
    ].join('\n');

    this.sendFrame(frame);
  }

  private async openSocket() {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      this.isConnecting = false;
      throw new Error('Missing auth token for chat socket');
    }

    const wsUrl = this.buildWebSocketUrl(token);

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(wsUrl);
      let settled = false;

      socket.onopen = () => {
        this.socket = socket;
        this.sendFrame(CONNECT_COMMAND);
      };

      socket.onmessage = (event) => {
        const raw = typeof event.data === 'string' ? event.data : '';
        this.handleIncoming(raw, () => {
          if (!settled) {
            settled = true;
            resolve();
          }
        });
      };

      socket.onerror = () => {
        if (!settled) {
          settled = true;
          reject(new Error('Chat socket connection failed'));
        }
      };

      socket.onclose = () => {
        this.socket = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.connectPromise = null;

        if (!settled) {
          settled = true;
          reject(new Error('Chat socket closed before CONNECTED frame'));
        }

        if (!this.manuallyClosed && this.subscriptions.size > 0) {
          this.scheduleReconnect();
        }
      };
    }).finally(() => {
      this.isConnecting = false;
    });
  }

  private buildWebSocketUrl(token: string) {
    const base = BASE_URL.replace(/\/api\/v1\/?$/, '');
    const wsBase = base.replace(/^http/i, 'ws');
    return `${wsBase}/ws-chat?token=${encodeURIComponent(token)}`;
  }

  private handleIncoming(rawChunk: string, onConnected: () => void) {
    this.frameBuffer += rawChunk;

    let frameEnd = this.frameBuffer.indexOf('\0');
    while (frameEnd >= 0) {
      const frame = this.frameBuffer.slice(0, frameEnd);
      this.frameBuffer = this.frameBuffer.slice(frameEnd + 1);
      this.processFrame(frame, onConnected);
      frameEnd = this.frameBuffer.indexOf('\0');
    }
  }

  private processFrame(frame: string, onConnected: () => void) {
    const normalizedFrame = frame.replace(/\r/g, '');
    if (!normalizedFrame.trim()) {
      return;
    }

    const [headerPart, body = ''] = normalizedFrame.split('\n\n');
    const headerLines = headerPart.split('\n');
    const command = headerLines[0];
    const headers = new Map<string, string>();

    for (const line of headerLines.slice(1)) {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex <= 0) {
        continue;
      }
      const key = line.slice(0, separatorIndex);
      const value = line.slice(separatorIndex + 1);
      headers.set(key, value);
    }

    if (command === 'CONNECTED') {
      this.isConnected = true;
      this.resubscribeAll();
      onConnected();
      return;
    }

    if (command === 'MESSAGE') {
      const subscriptionId = headers.get('subscription');
      if (!subscriptionId) {
        return;
      }

      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        return;
      }

      try {
        const parsed = JSON.parse(body) as ChatSocketEvent;
        subscription.handler(parsed);
      } catch (error) {
        console.warn('Parse chat socket message failed:', error);
      }
      return;
    }

    if (command === 'ERROR') {
      console.warn('Chat socket error frame:', body);
    }
  }

  private resubscribeAll() {
    for (const subscription of this.subscriptions.values()) {
      this.sendSubscribeFrame(subscription);
    }
  }

  private sendSubscribeFrame(subscription: Subscription) {
    this.sendFrame(['SUBSCRIBE', `id:${subscription.id}`, `destination:${subscription.destination}`, '', ''].join('\n'));
  }

  private sendFrame(frame: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Chat socket is not open');
    }

    this.socket.send(`${frame}\0`);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error) => {
        console.warn('Reconnect chat socket failed:', error);
      });
    }, RECONNECT_DELAY_MS);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

const chatSocketService = new ChatSocketService();

export default chatSocketService;

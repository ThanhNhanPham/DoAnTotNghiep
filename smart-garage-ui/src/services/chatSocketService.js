import { getAuthToken } from '../config/api';

const CONNECT_COMMAND = ['CONNECT', 'accept-version:1.2', 'heart-beat:0,0', '', ''].join('\n');
const RECONNECT_DELAY_MS = 2000;

class ChatSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectTimer = null;
    this.connectPromise = null;
    this.frameBuffer = '';
    this.manuallyClosed = false;
    this.subscriptionCounter = 0;
    this.subscriptions = new Map();
  }

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

  async subscribeToRoom(roomId, handler) {
    const destination = `/topic/chat.rooms.${roomId}`;
    return this.subscribe(destination, handler);
  }

  async subscribeToUserRoomQueue(handler) {
    return this.subscribe('/user/queue/chat.rooms', handler);
  }

  unsubscribe(subscriptionId) {
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

  async sendMessage(roomId, content) {
    await this.send('/app/chat.send', { roomId, content });
  }

  async sendTyping(roomId) {
    await this.send('/app/chat.typing', { roomId });
  }

  async markRoomAsRead(roomId) {
    await this.send('/app/chat.read', { roomId });
  }

  async subscribe(destination, handler) {
    await this.connect();

    const id = `sub-${++this.subscriptionCounter}`;
    const subscription = { id, destination, handler };
    this.subscriptions.set(id, subscription);

    if (this.isConnected) {
      this.sendSubscribeFrame(subscription);
    }

    return id;
  }

  async send(destination, payload) {
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

  async openSocket() {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const token = getAuthToken();

    if (!token) {
      this.isConnecting = false;
      throw new Error('Missing auth token for chat socket');
    }

    const wsUrl = this.buildWebSocketUrl(token);

    await new Promise((resolve, reject) => {
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

  buildWebSocketUrl(token) {
    const wsBase = window.location.origin.replace(/^http/i, 'ws');
    return `${wsBase}/ws-chat?token=${encodeURIComponent(token)}`;
  }

  handleIncoming(rawChunk, onConnected) {
    this.frameBuffer += rawChunk;

    let frameEnd = this.frameBuffer.indexOf('\0');
    while (frameEnd >= 0) {
      const frame = this.frameBuffer.slice(0, frameEnd);
      this.frameBuffer = this.frameBuffer.slice(frameEnd + 1);
      this.processFrame(frame, onConnected);
      frameEnd = this.frameBuffer.indexOf('\0');
    }
  }

  processFrame(frame, onConnected) {
    const normalizedFrame = frame.replace(/\r/g, '');
    if (!normalizedFrame.trim()) {
      return;
    }

    const [headerPart, body = ''] = normalizedFrame.split('\n\n');
    const headerLines = headerPart.split('\n');
    const command = headerLines[0];
    const headers = new Map();

    for (const line of headerLines.slice(1)) {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex <= 0) {
        continue;
      }
      headers.set(line.slice(0, separatorIndex), line.slice(separatorIndex + 1));
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
        subscription.handler(JSON.parse(body));
      } catch (error) {
        console.warn('Parse chat socket message failed:', error);
      }
      return;
    }

    if (command === 'ERROR') {
      console.warn('Chat socket error frame:', body);
    }
  }

  resubscribeAll() {
    for (const subscription of this.subscriptions.values()) {
      this.sendSubscribeFrame(subscription);
    }
  }

  sendSubscribeFrame(subscription) {
    this.sendFrame(['SUBSCRIBE', `id:${subscription.id}`, `destination:${subscription.destination}`, '', ''].join('\n'));
  }

  sendFrame(frame) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Chat socket is not open');
    }

    this.socket.send(`${frame}\0`);
  }

  scheduleReconnect() {
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

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

const chatSocketService = new ChatSocketService();

export default chatSocketService;

/**
 * WebSocket Service for Real-time Communication
 * Provides robust WebSocket connection with auto-reconnect and event handling
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface ConnectionStats {
  connected: boolean;
  lastConnected: Date | null;
  reconnectAttempts: number;
  totalMessages: number;
  latency: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

// Browser-compatible EventEmitter
class SimpleEventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error('Event callback error:', error);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

class WebSocketService extends SimpleEventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private stats: ConnectionStats;
  private messageQueue: WebSocketMessage[] = [];
  private isReconnecting = false;
  private userToken: string | null = null;
  private userId: string | null = null;
  private sessionId: string;

  constructor(config: Partial<WebSocketConfig> = {}) {
    super();
    
    // Default configuration
    this.config = {
      url: config.url || this.getWebSocketUrl(),
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      connectionTimeout: config.connectionTimeout || 10000
    };

    // Initialize stats
    this.stats = {
      connected: false,
      lastConnected: null,
      reconnectAttempts: 0,
      totalMessages: 0,
      latency: 0
    };

    // Generate session ID
    this.sessionId = this.generateSessionId();

    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_HOST || window.location.host;
    const port = import.meta.env.VITE_WS_PORT || '3001';
    
    // For development, use localhost with WebSocket port
    if (import.meta.env.DEV) {
      return `${protocol}//localhost:${port}/ws`;
    }
    
    // For production, use same host with /ws path
    return `${protocol}//${host}/ws`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(userToken?: string, userId?: string): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.userToken = userToken || null;
    this.userId = userId || null;

    try {
      console.log('Connecting to WebSocket:', this.config.url);
      
      // Create WebSocket connection
      this.ws = new WebSocket(this.config.url);
      
      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.error('WebSocket connection timeout');
          this.ws.close();
          this.handleConnectionFailure();
        }
      }, this.config.connectionTimeout);

      // Bind event handlers
      this.ws.onopen = this.handleOpen;
      this.ws.onmessage = this.handleMessage;
      this.ws.onerror = this.handleError;
      this.ws.onclose = this.handleClose;

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleConnectionFailure();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    console.log('Disconnecting WebSocket');
    
    // Clear timers
    this.clearTimers();
    
    // Close connection
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }

    // Update stats
    this.stats.connected = false;
    this.isReconnecting = false;

    // Emit disconnect event
    this.emit('disconnect');
  }

  /**
   * Send message through WebSocket
   */
  public send(type: string, data: any): boolean {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    // If connected, send immediately
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.stats.totalMessages++;
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        this.queueMessage(message);
        return false;
      }
    } else {
      // Queue message for later
      this.queueMessage(message);
      return false;
    }
  }

  /**
   * Subscribe to specific event type
   */
  public subscribe(eventType: string, callback: (data: any) => void): () => void {
    this.on(eventType, callback);
    
    // Return unsubscribe function
    return () => {
      this.off(eventType, callback);
    };
  }

  /**
   * Get connection statistics
   */
  public getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.stats.connected;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connected successfully');
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Update stats
    this.stats.connected = true;
    this.stats.lastConnected = new Date();
    this.stats.reconnectAttempts = 0;
    this.isReconnecting = false;

    // Send authentication if available
    if (this.userToken) {
      this.send('auth', {
        token: this.userToken,
        userId: this.userId,
        sessionId: this.sessionId
      });
    }

    // Send queued messages
    this.processMessageQueue();

    // Start heartbeat
    this.startHeartbeat();

    // Emit connect event
    this.emit('connect');
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle special message types
      switch (message.type) {
        case 'pong':
          this.handlePong(message.timestamp);
          break;
        case 'error':
          console.error('WebSocket server error:', message.data);
          this.emit('error', message.data);
          break;
        default:
          // Emit the message type as event
          this.emit(message.type, message.data);
          this.emit('message', message);
          break;
      }

      this.stats.totalMessages++;
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.emit('error', error);
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);
    
    // Clear timers
    this.clearTimers();
    
    // Update stats
    this.stats.connected = false;

    // Emit disconnect event
    this.emit('disconnect', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });

    // Attempt reconnection if not intentional disconnect
    if (event.code !== 1000 && !this.isReconnecting) {
      this.attemptReconnection();
    }
  }

  /**
   * Handle connection failure
   */
  private handleConnectionFailure(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.stats.connected = false;
    this.emit('error', new Error('Connection failed'));
    
    if (!this.isReconnecting) {
      this.attemptReconnection();
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnection(): void {
    if (this.stats.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.isReconnecting = true;
    this.stats.reconnectAttempts++;

    console.log(`Attempting to reconnect (${this.stats.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.userToken, this.userId);
    }, this.config.reconnectInterval);

    this.emit('reconnecting', {
      attempt: this.stats.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        const pingTime = Date.now();
        this.send('ping', { timestamp: pingTime });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Handle pong response
   */
  private handlePong(serverTimestamp: number): void {
    const currentTime = Date.now();
    this.stats.latency = currentTime - serverTimestamp;
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(message: WebSocketMessage): void {
    // Limit queue size to prevent memory issues
    if (this.messageQueue.length >= 100) {
      this.messageQueue.shift();
    }
    this.messageQueue.push(message);
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          this.ws!.send(JSON.stringify(message));
          this.stats.totalMessages++;
        } catch (error) {
          console.error('Failed to send queued message:', error);
          // Put message back at the front of queue
          this.messageQueue.unshift(message);
          break;
        }
      }
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();

// Export class for custom instances
export { WebSocketService }; 
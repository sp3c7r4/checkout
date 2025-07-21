import { createClient, RedisClientType } from 'redis';

interface UserSession {
  step: 'idle' | 'entering_quantity' | 'editing_quantity' | 'confirming_order';
  currentProduct?: {
    id: string;
    name: string;
    price: number;
  };
  quantity?: string;
  quantityMessageId?: number;
  shouldSendMessage: boolean;
  lastActivity: number;
  operationLock: boolean;
  business_id?: string;
}

export class RedisSessionManager {
  private client: RedisClientType;
  private readonly SESSION_TTL = 3600; // 1 hour
  private readonly LOCK_TTL = 30; // 30 seconds

  constructor(redisUrl: string = 'redis://localhost:6379') {
    this.client = createClient({ url: redisUrl });
    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    this.client.on('connect', () => console.log('Redis Client Connected'));
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  // Session Management
  private getSessionKey(userId: string): string {
    return `user_session:${userId}`;
  }

  private getLockKey(userId: string): string {
    return `user_lock:${userId}`;
  }

  async getSession(userId: string): Promise<UserSession> {
    try {
      const sessionData = await this.client.get(this.getSessionKey(userId));
      
      if (!sessionData) {
        return this.createDefaultSession();
      }

      const session = JSON.parse(sessionData) as UserSession;
      
      // Check if session is expired (older than 1 hour of inactivity)
      const now = Date.now();
      if (now - session.lastActivity > this.SESSION_TTL * 1000) {
        await this.clearSession(userId);
        return this.createDefaultSession();
      }

      return session;
    } catch (error) {
      console.error(`Error getting session for user ${userId}:`, error);
      return this.createDefaultSession();
    }
  }

  async setSession(userId: string, session: Partial<UserSession>): Promise<void> {
    try {
      const currentSession = await this.getSession(userId);
      const updatedSession: UserSession = {
        ...currentSession,
        ...session,
        lastActivity: Date.now()
      };

      await this.client.setEx(
        this.getSessionKey(userId),
        this.SESSION_TTL,
        JSON.stringify(updatedSession)
      );
    } catch (error) {
      console.error(`Error setting session for user ${userId}:`, error);
    }
  }

  async clearSession(userId: string): Promise<void> {
    try {
      await this.client.del(this.getSessionKey(userId));
      await this.releaseLock(userId); // Also release any locks
    } catch (error) {
      console.error(`Error clearing session for user ${userId}:`, error);
    }
  }

  private createDefaultSession(): UserSession {
    return {
      step: 'idle',
      quantity: '',
      shouldSendMessage: true,
      lastActivity: Date.now(),
      operationLock: false
    };
  }

  // Lock Management
  async acquireLock(userId: string): Promise<boolean> {
    try {
      const lockKey = this.getLockKey(userId);
      const result = await this.client.setNX(lockKey, Date.now().toString());
      
      if (result) {
        await this.client.expire(lockKey, this.LOCK_TTL);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error acquiring lock for user ${userId}:`, error);
      return false;
    }
  }

  async releaseLock(userId: string): Promise<void> {
    try {
      await this.client.del(this.getLockKey(userId));
    } catch (error) {
      console.error(`Error releasing lock for user ${userId}:`, error);
    }
  }

  async isLocked(userId: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(this.getLockKey(userId));
      return exists === 1;
    } catch (error) {
      console.error(`Error checking lock for user ${userId}:`, error);
      return false;
    }
  }

  // Message State Management
  async setSendMessageState(userId: string, shouldSend: boolean): Promise<void> {
    await this.setSession(userId, { shouldSendMessage: shouldSend });
  }

  async getSendMessageState(userId: string): Promise<boolean> {
    const session = await this.getSession(userId);
    return session.shouldSendMessage;
  }

  // Utility Methods
  async updateLastActivity(userId: string): Promise<void> {
    await this.setSession(userId, { lastActivity: Date.now() });
  }

  async resetUserSession(userId: string): Promise<void> {
    await this.setSession(userId, {
      step: 'idle',
      currentProduct: undefined,
      quantity: '',
      quantityMessageId: undefined,
      shouldSendMessage: true,
      operationLock: false
    });
  }

  // Cleanup expired sessions (run periodically)
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const pattern = 'user_session:*';
      const keys = await this.client.keys(pattern);
      
      const now = Date.now();
      for (const key of keys) {
        const sessionData = await this.client.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData) as UserSession;
          if (now - session.lastActivity > this.SESSION_TTL * 1000) {
            await this.client.del(key);
            console.log(`Cleaned up expired session: ${key}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
}
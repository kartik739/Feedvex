import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { AnalyticsService } from './analytics';
import { DocumentStore } from './document-store';
import { Indexer } from './indexer';
import { logger } from '../utils/logger';

/**
 * Configuration for WebSocket stats service
 */
export interface WebSocketStatsConfig {
  updateInterval?: number; // Interval in ms to push updates (default: 5000)
  enableHeartbeat?: boolean; // Enable heartbeat to detect dead connections (default: true)
  heartbeatInterval?: number; // Heartbeat interval in ms (default: 30000)
}

/**
 * Stats data structure sent to clients
 */
export interface StatsUpdate {
  timestamp: string;
  totalDocuments: number;
  totalQueries: number;
  totalClicks: number;
  overallCTR: number;
  uniqueQueries: number;
  responseTimeStats: {
    min: number;
    max: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
  };
  popularQueries: Array<{ query: string; count: number }>;
  documentsByType: {
    posts: number;
    comments: number;
  };
  subreddits: string[];
}

/**
 * WebSocket service for pushing real-time stats updates to connected clients
 * Implements requirement 18.1: WebSocket support for real-time stats
 */
export class WebSocketStatsService {
  private wss: WebSocketServer | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private clients: Set<WebSocket> = new Set();
  private config: Required<WebSocketStatsConfig>;

  constructor(
    private analyticsService: AnalyticsService,
    private documentStore: DocumentStore,
    private indexer: Indexer,
    config: WebSocketStatsConfig = {}
  ) {
    this.config = {
      updateInterval: config.updateInterval || 5000,
      enableHeartbeat: config.enableHeartbeat !== false,
      heartbeatInterval: config.heartbeatInterval || 30000,
    };
  }

  /**
   * Initialize WebSocket server and attach to HTTP server
   */
  initialize(server: Server, path: string = '/ws/stats'): void {
    this.wss = new WebSocketServer({ 
      server, 
      path,
      // Handle reconnection
      clientTracking: true,
    });

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    // Start periodic stats updates
    this.startStatsUpdates();

    // Start heartbeat if enabled
    if (this.config.enableHeartbeat) {
      this.startHeartbeat();
    }

    logger.info('WebSocket stats service initialized', {
      path,
      updateInterval: this.config.updateInterval,
      heartbeatEnabled: this.config.enableHeartbeat,
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);
    logger.info('WebSocket client connected', { totalClients: this.clients.size });

    // Mark connection as alive
    (ws as any).isAlive = true;

    // Send initial stats immediately
    this.sendStatsToClient(ws);

    // Handle pong responses for heartbeat
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.clients.delete(ws);
      logger.info('WebSocket client disconnected', { totalClients: this.clients.size });
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error', { error: error.message });
      this.clients.delete(ws);
    });
  }

  /**
   * Start periodic stats updates to all connected clients
   */
  private startStatsUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.broadcastStats();
    }, this.config.updateInterval);
  }

  /**
   * Start heartbeat to detect dead connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((ws) => {
        if ((ws as any).isAlive === false) {
          // Connection is dead, terminate it
          logger.debug('Terminating dead WebSocket connection');
          this.clients.delete(ws);
          return ws.terminate();
        }

        // Mark as not alive and send ping
        (ws as any).isAlive = false;
        ws.ping();
      });
    }, this.config.heartbeatInterval);
  }

  /**
   * Gather current stats from all services
   */
  private gatherStats(): StatsUpdate {
    const docStats = this.documentStore.getStats();
    const analyticsMetrics = this.analyticsService.getOverallMetrics();

    return {
      timestamp: new Date().toISOString(),
      totalDocuments: docStats.totalDocuments,
      totalQueries: analyticsMetrics.totalQueries,
      totalClicks: analyticsMetrics.totalClicks,
      overallCTR: analyticsMetrics.overallCTR,
      uniqueQueries: analyticsMetrics.uniqueQueries,
      responseTimeStats: analyticsMetrics.responseTimeStats,
      popularQueries: analyticsMetrics.popularQueries,
      documentsByType: {
        posts: docStats.postCount,
        comments: docStats.commentCount,
      },
      subreddits: docStats.subreddits,
    };
  }

  /**
   * Send stats to a specific client
   */
  private sendStatsToClient(ws: WebSocket): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const stats = this.gatherStats();
        ws.send(JSON.stringify(stats));
      } catch (error) {
        logger.error('Failed to send stats to client', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Broadcast stats to all connected clients
   */
  private broadcastStats(): void {
    if (this.clients.size === 0) {
      return; // No clients connected, skip
    }

    try {
      const stats = this.gatherStats();
      const message = JSON.stringify(stats);

      this.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });

      logger.debug('Stats broadcast to clients', { clientCount: this.clients.size });
    } catch (error) {
      logger.error('Failed to broadcast stats', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Manually trigger a stats update (useful for testing or on-demand updates)
   */
  triggerUpdate(): void {
    this.broadcastStats();
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Shutdown the WebSocket service
   */
  shutdown(): void {
    logger.info('Shutting down WebSocket stats service');

    // Clear intervals
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all client connections
    this.clients.forEach((ws) => {
      ws.close(1000, 'Server shutting down');
    });
    this.clients.clear();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close(() => {
        logger.info('WebSocket server closed');
      });
      this.wss = null;
    }
  }
}

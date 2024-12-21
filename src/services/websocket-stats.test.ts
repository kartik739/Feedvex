import { WebSocketStatsService } from './websocket-stats';
import { AnalyticsService } from './analytics';
import { DocumentStore } from './document-store';
import { Indexer } from './indexer';
import { Server } from 'http';
import WebSocket from 'ws';

describe('WebSocketStatsService', () => {
  let analyticsService: AnalyticsService;
  let documentStore: DocumentStore;
  let indexer: Indexer;
  let wsService: WebSocketStatsService;
  let httpServer: Server;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    documentStore = new DocumentStore({ maxDocuments: 1000 });
    indexer = new Indexer({ indexPath: ':memory:', autoPersist: false });
    wsService = new WebSocketStatsService(analyticsService, documentStore, indexer, {
      updateInterval: 100, // Fast updates for testing
      enableHeartbeat: false, // Disable heartbeat for simpler tests
    });

    // Create a simple HTTP server for testing
    httpServer = new Server();
    httpServer.listen(0); // Random port
  });

  afterEach((done) => {
    wsService.shutdown();
    httpServer.close(done);
  });

  it('should initialize WebSocket server', () => {
    wsService.initialize(httpServer, '/ws/stats');
    expect(wsService.getClientCount()).toBe(0);
  });

  it('should accept client connections', (done) => {
    wsService.initialize(httpServer, '/ws/stats');
    const address = httpServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Invalid server address');
    }

    const ws = new WebSocket(`ws://localhost:${address.port}/ws/stats`);

    ws.on('open', () => {
      expect(wsService.getClientCount()).toBe(1);
      ws.close();
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  });

  it('should send initial stats on connection', (done) => {
    wsService.initialize(httpServer, '/ws/stats');
    const address = httpServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Invalid server address');
    }

    const ws = new WebSocket(`ws://localhost:${address.port}/ws/stats`);

    ws.on('message', (data) => {
      const stats = JSON.parse(data.toString());
      expect(stats).toHaveProperty('timestamp');
      expect(stats).toHaveProperty('totalDocuments');
      expect(stats).toHaveProperty('totalQueries');
      expect(stats).toHaveProperty('totalClicks');
      expect(stats).toHaveProperty('overallCTR');
      ws.close();
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  });

  it('should broadcast stats to multiple clients', (done) => {
    wsService.initialize(httpServer, '/ws/stats');
    const address = httpServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Invalid server address');
    }

    const ws1 = new WebSocket(`ws://localhost:${address.port}/ws/stats`);
    const ws2 = new WebSocket(`ws://localhost:${address.port}/ws/stats`);

    let receivedCount = 0;

    const handleMessage = () => {
      receivedCount++;
      if (receivedCount === 2) {
        // Both clients received initial stats
        expect(wsService.getClientCount()).toBe(2);
        ws1.close();
        ws2.close();
        done();
      }
    };

    ws1.on('message', handleMessage);
    ws2.on('message', handleMessage);

    ws1.on('error', done);
    ws2.on('error', done);
  });

  it('should handle client disconnection', (done) => {
    wsService.initialize(httpServer, '/ws/stats');
    const address = httpServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Invalid server address');
    }

    const ws = new WebSocket(`ws://localhost:${address.port}/ws/stats`);

    ws.on('open', () => {
      expect(wsService.getClientCount()).toBe(1);
      ws.close();
    });

    ws.on('close', () => {
      // Give it a moment to process the disconnect
      setTimeout(() => {
        expect(wsService.getClientCount()).toBe(0);
        done();
      }, 50);
    });

    ws.on('error', done);
  });

  it('should trigger manual stats update', (done) => {
    wsService.initialize(httpServer, '/ws/stats');
    const address = httpServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Invalid server address');
    }

    const ws = new WebSocket(`ws://localhost:${address.port}/ws/stats`);
    let messageCount = 0;

    ws.on('message', () => {
      messageCount++;
      if (messageCount === 2) {
        // Received initial + triggered update
        ws.close();
        done();
      }
    });

    ws.on('open', () => {
      // Trigger manual update after connection
      setTimeout(() => {
        wsService.triggerUpdate();
      }, 50);
    });

    ws.on('error', done);
  });
});

import {
  Document,
  Token,
  ProcessedDocument,
  validateDocument,
  validateToken,
  validateProcessedDocument,
  createDocument,
  createProcessedDocument,
  DocumentValidationError,
} from './document';

describe('Document Model', () => {
  describe('validateDocument', () => {
    const validDocument: Document = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'post',
      title: 'Test Post',
      content: 'This is test content',
      url: 'https://reddit.com/r/test/comments/abc123',
      author: 'testuser',
      subreddit: 'test',
      redditScore: 42,
      commentCount: 10,
      createdUtc: new Date('2024-01-01T00:00:00Z'),
      collectedAt: new Date('2024-01-02T00:00:00Z'),
      processed: false,
    };

    it('should validate a valid document', () => {
      expect(() => validateDocument(validDocument)).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const requiredFields: (keyof Document)[] = [
        'id',
        'type',
        'title',
        'content',
        'url',
        'author',
        'subreddit',
        'redditScore',
        'commentCount',
        'createdUtc',
        'collectedAt',
        'processed',
      ];

      for (const field of requiredFields) {
        const invalidDoc = { ...validDocument };
        delete (invalidDoc as Partial<Document>)[field];
        expect(() => validateDocument(invalidDoc)).toThrow(
          new DocumentValidationError(`Missing required field: ${field}`)
        );
      }
    });

    it('should throw error for invalid type', () => {
      const invalidDoc = { ...validDocument, type: 'invalid' as 'post' };
      expect(() => validateDocument(invalidDoc)).toThrow(
        new DocumentValidationError("Invalid type: invalid. Must be 'post' or 'comment'")
      );
    });

    it('should throw error for empty string fields', () => {
      const stringFields: (keyof Document)[] = [
        'id',
        'title',
        'content',
        'url',
        'author',
        'subreddit',
      ];

      for (const field of stringFields) {
        const invalidDoc = { ...validDocument, [field]: '' };
        expect(() => validateDocument(invalidDoc)).toThrow(
          new DocumentValidationError(`Field ${field} must be a non-empty string`)
        );
      }
    });

    it('should throw error for whitespace-only string fields', () => {
      const invalidDoc = { ...validDocument, title: '   ' };
      expect(() => validateDocument(invalidDoc)).toThrow(
        new DocumentValidationError('Field title must be a non-empty string')
      );
    });

    it('should throw error for non-string fields', () => {
      const invalidDoc = { ...validDocument, title: 123 as unknown as string };
      expect(() => validateDocument(invalidDoc)).toThrow(
        new DocumentValidationError('Field title must be a non-empty string')
      );
    });

    it('should throw error for non-numeric redditScore', () => {
      const invalidDoc = { ...validDocument, redditScore: '42' as unknown as number };
      expect(() => validateDocument(invalidDoc)).toThrow(
        new DocumentValidationError('redditScore must be a number')
      );
    });

    it('should throw error for negative commentCount', () => {
      const invalidDoc = { ...validDocument, commentCount: -1 };
      expect(() => validateDocument(invalidDoc)).toThrow(
        new DocumentValidationError('commentCount must be a non-negative number')
      );
    });

    it('should throw error for invalid createdUtc date', () => {
      const invalidDoc = { ...validDocument, createdUtc: new Date('invalid') };
      expect(() => validateDocument(invalidDoc)).toThrow(
        new DocumentValidationError('createdUtc must be a valid Date')
      );
    });

    it('should throw error for invalid collectedAt date', () => {
      const invalidDoc = { ...validDocument, collectedAt: 'not-a-date' as unknown as Date };
      expect(() => validateDocument(invalidDoc)).toThrow(
        new DocumentValidationError('collectedAt must be a valid Date')
      );
    });

    it('should throw error for non-boolean processed', () => {
      const invalidDoc = { ...validDocument, processed: 'false' as unknown as boolean };
      expect(() => validateDocument(invalidDoc)).toThrow(
        new DocumentValidationError('processed must be a boolean')
      );
    });

    it('should accept comment type', () => {
      const commentDoc = { ...validDocument, type: 'comment' as const };
      expect(() => validateDocument(commentDoc)).not.toThrow();
    });

    it('should accept zero commentCount', () => {
      const docWithZeroComments = { ...validDocument, commentCount: 0 };
      expect(() => validateDocument(docWithZeroComments)).not.toThrow();
    });

    it('should accept negative redditScore', () => {
      const docWithNegativeScore = { ...validDocument, redditScore: -10 };
      expect(() => validateDocument(docWithNegativeScore)).not.toThrow();
    });
  });

  describe('validateToken', () => {
    const validToken: Token = {
      text: 'example',
      position: 0,
      stem: 'exampl',
    };

    it('should validate a valid token', () => {
      expect(() => validateToken(validToken)).not.toThrow();
    });

    it('should throw error for empty text', () => {
      const invalidToken = { ...validToken, text: '' };
      expect(() => validateToken(invalidToken)).toThrow(
        new DocumentValidationError('Token text must be a non-empty string')
      );
    });

    it('should throw error for whitespace-only text', () => {
      const invalidToken = { ...validToken, text: '   ' };
      expect(() => validateToken(invalidToken)).toThrow(
        new DocumentValidationError('Token text must be a non-empty string')
      );
    });

    it('should throw error for negative position', () => {
      const invalidToken = { ...validToken, position: -1 };
      expect(() => validateToken(invalidToken)).toThrow(
        new DocumentValidationError('Token position must be a non-negative number')
      );
    });

    it('should throw error for non-numeric position', () => {
      const invalidToken = { ...validToken, position: '0' as unknown as number };
      expect(() => validateToken(invalidToken)).toThrow(
        new DocumentValidationError('Token position must be a non-negative number')
      );
    });

    it('should throw error for empty stem', () => {
      const invalidToken = { ...validToken, stem: '' };
      expect(() => validateToken(invalidToken)).toThrow(
        new DocumentValidationError('Token stem must be a non-empty string')
      );
    });
  });

  describe('validateProcessedDocument', () => {
    const validTokens: Token[] = [
      { text: 'hello', position: 0, stem: 'hello' },
      { text: 'world', position: 1, stem: 'world' },
    ];

    const validProcessedDoc: ProcessedDocument = {
      docId: 'doc-123',
      tokens: validTokens,
      tokenCount: 2,
      uniqueTerms: new Set(['hello', 'world']),
    };

    it('should validate a valid processed document', () => {
      expect(() => validateProcessedDocument(validProcessedDoc)).not.toThrow();
    });

    it('should throw error for empty docId', () => {
      const invalidDoc = { ...validProcessedDoc, docId: '' };
      expect(() => validateProcessedDocument(invalidDoc)).toThrow(
        new DocumentValidationError('docId must be a non-empty string')
      );
    });

    it('should throw error for non-array tokens', () => {
      const invalidDoc = { ...validProcessedDoc, tokens: 'not-an-array' as unknown as Token[] };
      expect(() => validateProcessedDocument(invalidDoc)).toThrow(
        new DocumentValidationError('tokens must be an array')
      );
    });

    it('should throw error for negative tokenCount', () => {
      const invalidDoc = { ...validProcessedDoc, tokenCount: -1 };
      expect(() => validateProcessedDocument(invalidDoc)).toThrow(
        new DocumentValidationError('tokenCount must be a non-negative number')
      );
    });

    it('should throw error for non-Set uniqueTerms', () => {
      const invalidDoc = { ...validProcessedDoc, uniqueTerms: ['hello'] as unknown as Set<string> };
      expect(() => validateProcessedDocument(invalidDoc)).toThrow(
        new DocumentValidationError('uniqueTerms must be a Set')
      );
    });

    it('should throw error for invalid token in array', () => {
      const invalidTokens = [
        { text: 'hello', position: 0, stem: 'hello' },
        { text: '', position: 1, stem: 'invalid' },
      ];
      const invalidDoc = { ...validProcessedDoc, tokens: invalidTokens };
      expect(() => validateProcessedDocument(invalidDoc)).toThrow(
        new DocumentValidationError('Token text must be a non-empty string')
      );
    });

    it('should throw error when tokenCount does not match tokens length', () => {
      const invalidDoc = { ...validProcessedDoc, tokenCount: 5 };
      expect(() => validateProcessedDocument(invalidDoc)).toThrow(
        new DocumentValidationError('tokenCount (5) does not match tokens array length (2)')
      );
    });
  });

  describe('createDocument', () => {
    it('should create a document with default values', () => {
      const now = new Date();
      const data = {
        id: 'test-id',
        type: 'post' as const,
        title: 'Test',
        content: 'Content',
        url: 'https://example.com',
        author: 'user',
        subreddit: 'test',
        redditScore: 10,
        commentCount: 5,
        createdUtc: new Date('2024-01-01'),
      };

      const doc = createDocument(data);

      expect(doc.id).toBe(data.id);
      expect(doc.type).toBe(data.type);
      expect(doc.title).toBe(data.title);
      expect(doc.processed).toBe(false);
      expect(doc.collectedAt).toBeInstanceOf(Date);
      expect(doc.collectedAt.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });
  });

  describe('createProcessedDocument', () => {
    it('should create a processed document from tokens', () => {
      const tokens: Token[] = [
        { text: 'hello', position: 0, stem: 'hello' },
        { text: 'world', position: 1, stem: 'world' },
        { text: 'hello', position: 2, stem: 'hello' },
      ];

      const processedDoc = createProcessedDocument('doc-123', tokens);

      expect(processedDoc.docId).toBe('doc-123');
      expect(processedDoc.tokens).toEqual(tokens);
      expect(processedDoc.tokenCount).toBe(3);
      expect(processedDoc.uniqueTerms).toEqual(new Set(['hello', 'world']));
      expect(processedDoc.uniqueTerms.size).toBe(2);
    });

    it('should handle empty tokens array', () => {
      const processedDoc = createProcessedDocument('doc-456', []);

      expect(processedDoc.docId).toBe('doc-456');
      expect(processedDoc.tokens).toEqual([]);
      expect(processedDoc.tokenCount).toBe(0);
      expect(processedDoc.uniqueTerms.size).toBe(0);
    });
  });
});

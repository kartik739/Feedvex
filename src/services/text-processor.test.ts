import { TextProcessor } from './text-processor';
import { Document } from '../models/document';

describe('TextProcessor', () => {
  let processor: TextProcessor;

  beforeEach(() => {
    processor = new TextProcessor();
  });

  describe('cleanHtml', () => {
    it('should strip HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = processor.cleanHtml(input);
      expect(result).toBe('Hello world!');
    });

    it('should decode HTML entities', () => {
      const input = 'Hello &amp; goodbye &lt;test&gt;';
      const result = processor.cleanHtml(input);
      expect(result).toBe('Hello & goodbye <test>');
    });

    it('should handle nested HTML tags', () => {
      const input = '<div><p>Nested <em>content</em> here</p></div>';
      const result = processor.cleanHtml(input);
      expect(result).toBe('Nested content here');
    });

    it('should clean up extra whitespace', () => {
      const input = '<p>Multiple   spaces</p>   <p>Another paragraph</p>';
      const result = processor.cleanHtml(input);
      expect(result).toBe('Multiple spaces Another paragraph');
    });

    it('should handle empty or null input', () => {
      expect(processor.cleanHtml('')).toBe('');
      expect(processor.cleanHtml(null as any)).toBe('');
      expect(processor.cleanHtml(undefined as any)).toBe('');
    });

    it('should handle text without HTML', () => {
      const input = 'Plain text without HTML';
      const result = processor.cleanHtml(input);
      expect(result).toBe('Plain text without HTML');
    });
  });

  describe('normalizeCase', () => {
    it('should convert uppercase to lowercase', () => {
      const input = 'HELLO WORLD';
      const result = processor.normalizeCase(input);
      expect(result).toBe('hello world');
    });

    it('should convert mixed case to lowercase', () => {
      const input = 'Hello World';
      const result = processor.normalizeCase(input);
      expect(result).toBe('hello world');
    });

    it('should handle already lowercase text', () => {
      const input = 'hello world';
      const result = processor.normalizeCase(input);
      expect(result).toBe('hello world');
    });

    it('should handle empty or null input', () => {
      expect(processor.normalizeCase('')).toBe('');
      expect(processor.normalizeCase(null as any)).toBe('');
      expect(processor.normalizeCase(undefined as any)).toBe('');
    });

    it('should handle special characters and numbers', () => {
      const input = 'Hello123 @World!';
      const result = processor.normalizeCase(input);
      expect(result).toBe('hello123 @world!');
    });
  });

  describe('tokenize', () => {
    it('should split text on whitespace boundaries', () => {
      const input = 'hello world test';
      const result = processor.tokenize(input);

      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('hello');
      expect(result[1].text).toBe('world');
      expect(result[2].text).toBe('test');
    });

    it('should split text on punctuation boundaries', () => {
      const input = 'hello, world! test?';
      const result = processor.tokenize(input);

      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('hello');
      expect(result[1].text).toBe('world');
      expect(result[2].text).toBe('test');
    });

    it('should track token positions correctly', () => {
      const input = 'hello world test';
      const result = processor.tokenize(input);

      expect(result[0].position).toBe(0); // 'hello' starts at position 0
      expect(result[1].position).toBe(6); // 'world' starts at position 6
      expect(result[2].position).toBe(12); // 'test' starts at position 12
    });

    it('should handle mixed whitespace and punctuation', () => {
      const input = 'hello,   world!  test.';
      const result = processor.tokenize(input);

      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('hello');
      expect(result[1].text).toBe('world');
      expect(result[2].text).toBe('test');
    });

    it('should handle empty or null input', () => {
      expect(processor.tokenize('')).toEqual([]);
      expect(processor.tokenize(null as any)).toEqual([]);
      expect(processor.tokenize(undefined as any)).toEqual([]);
    });

    it('should handle text with numbers and alphanumeric tokens', () => {
      const input = 'test123 hello world456';
      const result = processor.tokenize(input);

      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('test123');
      expect(result[1].text).toBe('hello');
      expect(result[2].text).toBe('world456');
    });

    it('should preserve original token text and set stem placeholder', () => {
      const input = 'Hello World';
      const result = processor.tokenize(input);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Hello');
      expect(result[0].stem).toBe('Hello'); // Stemming not implemented yet
      expect(result[1].text).toBe('World');
      expect(result[1].stem).toBe('World'); // Stemming not implemented yet
    });
  });

  describe('removeStopwords', () => {
    it('should remove common English stopwords', () => {
      const tokens = [
        { text: 'the', position: 0, stem: 'the' },
        { text: 'quick', position: 4, stem: 'quick' },
        { text: 'brown', position: 10, stem: 'brown' },
        { text: 'fox', position: 16, stem: 'fox' },
        { text: 'is', position: 20, stem: 'is' },
        { text: 'running', position: 23, stem: 'running' },
      ];

      const result = processor.removeStopwords(tokens);

      // Should remove 'the' and 'is' but keep content words
      expect(result).toHaveLength(4);
      expect(result.map((t) => t.text)).toEqual(['quick', 'brown', 'fox', 'running']);
    });

    it('should handle case-insensitive stopword removal', () => {
      const tokens = [
        { text: 'The', position: 0, stem: 'The' },
        { text: 'QUICK', position: 4, stem: 'QUICK' },
        { text: 'IS', position: 10, stem: 'IS' },
        { text: 'running', position: 13, stem: 'running' },
      ];

      const result = processor.removeStopwords(tokens);

      // Should remove 'The' and 'IS' (case-insensitive)
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.text)).toEqual(['QUICK', 'running']);
    });

    it('should handle empty or null input', () => {
      expect(processor.removeStopwords([])).toEqual([]);
      expect(processor.removeStopwords(null as any)).toEqual([]);
      expect(processor.removeStopwords(undefined as any)).toEqual([]);
    });

    it('should preserve token positions after filtering', () => {
      const tokens = [
        { text: 'the', position: 0, stem: 'the' },
        { text: 'cat', position: 4, stem: 'cat' },
        { text: 'is', position: 8, stem: 'is' },
        { text: 'sleeping', position: 11, stem: 'sleeping' },
      ];

      const result = processor.removeStopwords(tokens);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('cat');
      expect(result[0].position).toBe(4);
      expect(result[1].text).toBe('sleeping');
      expect(result[1].position).toBe(11);
    });
  });

  describe('stem', () => {
    it('should apply Porter Stemmer to reduce words to root form', () => {
      const tokens = [
        { text: 'running', position: 0, stem: 'running' },
        { text: 'flies', position: 8, stem: 'flies' },
        { text: 'dogs', position: 14, stem: 'dogs' },
        { text: 'fairly', position: 19, stem: 'fairly' },
      ];

      const result = processor.stem(tokens);

      expect(result).toHaveLength(4);
      expect(result[0].text).toBe('running');
      expect(result[0].stem).toBe('run');
      expect(result[1].text).toBe('flies');
      expect(result[1].stem).toBe('fli');
      expect(result[2].text).toBe('dogs');
      expect(result[2].stem).toBe('dog');
      expect(result[3].text).toBe('fairly');
      expect(result[3].stem).toBe('fairli');
    });

    it('should preserve original text and positions', () => {
      const tokens = [
        { text: 'Running', position: 5, stem: 'Running' },
        { text: 'quickly', position: 13, stem: 'quickly' },
      ];

      const result = processor.stem(tokens);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Running'); // Original text preserved
      expect(result[0].position).toBe(5); // Position preserved
      expect(result[0].stem).toBe('run'); // Stemmed (lowercase)
      expect(result[1].text).toBe('quickly');
      expect(result[1].position).toBe(13);
      expect(result[1].stem).toBe('quickli');
    });

    it('should handle empty or null input', () => {
      expect(processor.stem([])).toEqual([]);
      expect(processor.stem(null as any)).toEqual([]);
      expect(processor.stem(undefined as any)).toEqual([]);
    });

    it('should handle words that do not change when stemmed', () => {
      const tokens = [
        { text: 'cat', position: 0, stem: 'cat' },
        { text: 'dog', position: 4, stem: 'dog' },
      ];

      const result = processor.stem(tokens);

      expect(result).toHaveLength(2);
      expect(result[0].stem).toBe('cat');
      expect(result[1].stem).toBe('dog');
    });
  });

  describe('processDocument', () => {
    const createTestDocument = (title: string, content: string): Document => ({
      id: 'test-id',
      type: 'post',
      title,
      content,
      url: 'https://reddit.com/test',
      author: 'testuser',
      subreddit: 'test',
      redditScore: 10,
      commentCount: 5,
      createdUtc: new Date(),
      collectedAt: new Date(),
      processed: false,
    });

    it('should clean HTML and normalize case in document processing', () => {
      const doc = createTestDocument(
        '<h1>Test Title</h1>',
        '<p>Test <strong>content</strong> with HTML</p>'
      );

      const result = processor.processDocument(doc);

      expect(result.docId).toBe('test-id');
      expect(result.tokens.length).toBeGreaterThan(0);

      // Check that the combined text was processed correctly
      const combinedText = result.tokens.map((t) => t.text).join(' ');
      expect(combinedText).toContain('test title');
      expect(combinedText).toContain('test content');
      expect(combinedText).not.toContain('<');
      expect(combinedText).not.toContain('>');
    });

    it('should handle empty title and content', () => {
      const doc = createTestDocument('', '');
      const result = processor.processDocument(doc);

      expect(result.docId).toBe('test-id');
      expect(result.tokens).toHaveLength(0);
      expect(result.tokenCount).toBe(0);
    });
  });

  describe('processBatch', () => {
    it('should process multiple documents', () => {
      const docs = [
        {
          id: 'doc1',
          type: 'post' as const,
          title: 'Title 1',
          content: 'Content 1',
          url: 'https://reddit.com/1',
          author: 'user1',
          subreddit: 'test',
          redditScore: 10,
          commentCount: 5,
          createdUtc: new Date(),
          collectedAt: new Date(),
          processed: false,
        },
        {
          id: 'doc2',
          type: 'comment' as const,
          title: 'Title 2',
          content: 'Content 2',
          url: 'https://reddit.com/2',
          author: 'user2',
          subreddit: 'test',
          redditScore: 20,
          commentCount: 10,
          createdUtc: new Date(),
          collectedAt: new Date(),
          processed: false,
        },
      ];

      const results = processor.processBatch(docs);

      expect(results).toHaveLength(2);
      expect(results[0].docId).toBe('doc1');
      expect(results[1].docId).toBe('doc2');
    });
  });
});

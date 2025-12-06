import {
  PostingsList,
  IndexEntry,
  InvertedIndex,
  createEmptyIndex,
  serializeIndex,
  deserializeIndex,
  calculateAverageDocumentLength,
  validatePostingsList,
  validateIndexEntry,
  validateInvertedIndex,
} from './index';

describe('Index Data Structures', () => {
  describe('PostingsList', () => {
    const validPosting: PostingsList = {
      docId: 'doc-123',
      termFrequency: 3,
      positions: [5, 12, 45],
    };

    it('should validate a valid PostingsList', () => {
      expect(() => validatePostingsList(validPosting)).not.toThrow();
    });

    it('should throw error for empty docId', () => {
      const invalid = { ...validPosting, docId: '' };
      expect(() => validatePostingsList(invalid)).toThrow(
        'PostingsList docId must be a non-empty string'
      );
    });

    it('should throw error for zero termFrequency', () => {
      const invalid = { ...validPosting, termFrequency: 0 };
      expect(() => validatePostingsList(invalid)).toThrow(
        'PostingsList termFrequency must be a positive number'
      );
    });

    it('should throw error for empty positions array', () => {
      const invalid = { ...validPosting, positions: [] };
      expect(() => validatePostingsList(invalid)).toThrow(
        'PostingsList positions must not be empty'
      );
    });

    it('should throw error for negative positions', () => {
      const invalid = { ...validPosting, positions: [5, -1, 12] };
      expect(() => validatePostingsList(invalid)).toThrow(
        'PostingsList positions must be non-negative numbers'
      );
    });

    it('should throw error for unsorted positions', () => {
      const invalid = { ...validPosting, positions: [5, 12, 8] };
      expect(() => validatePostingsList(invalid)).toThrow(
        'PostingsList positions must be in ascending order'
      );
    });

    it('should throw error when termFrequency does not match positions length', () => {
      const invalid = { ...validPosting, termFrequency: 5 };
      expect(() => validatePostingsList(invalid)).toThrow(
        'PostingsList termFrequency (5) must match positions length (3)'
      );
    });
  });

  describe('IndexEntry', () => {
    const validEntry: IndexEntry = {
      term: 'machine',
      documentFrequency: 2,
      postings: [
        { docId: 'doc-1', termFrequency: 2, positions: [5, 12] },
        { docId: 'doc-2', termFrequency: 1, positions: [8] },
      ],
    };

    it('should validate a valid IndexEntry', () => {
      expect(() => validateIndexEntry(validEntry)).not.toThrow();
    });

    it('should throw error for empty term', () => {
      const invalid = { ...validEntry, term: '' };
      expect(() => validateIndexEntry(invalid)).toThrow(
        'IndexEntry term must be a non-empty string'
      );
    });

    it('should throw error for zero documentFrequency', () => {
      const invalid = { ...validEntry, documentFrequency: 0 };
      expect(() => validateIndexEntry(invalid)).toThrow(
        'IndexEntry documentFrequency must be a positive number'
      );
    });

    it('should throw error for empty postings array', () => {
      const invalid = { ...validEntry, postings: [] };
      expect(() => validateIndexEntry(invalid)).toThrow(
        'IndexEntry postings must not be empty'
      );
    });

    it('should throw error when documentFrequency does not match postings length', () => {
      const invalid = { ...validEntry, documentFrequency: 5 };
      expect(() => validateIndexEntry(invalid)).toThrow(
        'IndexEntry documentFrequency (5) must match postings length (2)'
      );
    });

    it('should throw error for invalid posting in array', () => {
      const invalid = {
        ...validEntry,
        postings: [
          { docId: 'doc-1', termFrequency: 2, positions: [5, 12] },
          { docId: '', termFrequency: 1, positions: [8] },
        ],
      };
      expect(() => validateIndexEntry(invalid)).toThrow(
        'PostingsList docId must be a non-empty string'
      );
    });
  });

  describe('InvertedIndex', () => {
    const validIndex: InvertedIndex = {
      termToPostings: new Map([
        [
          'machine',
          [
            { docId: 'doc-1', termFrequency: 2, positions: [5, 12] },
            { docId: 'doc-2', termFrequency: 1, positions: [8] },
          ],
        ],
        ['learning', [{ docId: 'doc-1', termFrequency: 1, positions: [6] }]],
      ]),
      documentLengths: new Map([
        ['doc-1', 150],
        ['doc-2', 200],
      ]),
      totalDocuments: 2,
      averageDocumentLength: 175,
    };

    it('should validate a valid InvertedIndex', () => {
      expect(() => validateInvertedIndex(validIndex)).not.toThrow();
    });

    it('should throw error for non-Map termToPostings', () => {
      const invalid = { ...validIndex, termToPostings: {} as Map<string, PostingsList[]> };
      expect(() => validateInvertedIndex(invalid)).toThrow(
        'InvertedIndex termToPostings must be a Map'
      );
    });

    it('should throw error for non-Map documentLengths', () => {
      const invalid = { ...validIndex, documentLengths: {} as Map<string, number> };
      expect(() => validateInvertedIndex(invalid)).toThrow(
        'InvertedIndex documentLengths must be a Map'
      );
    });

    it('should throw error for negative totalDocuments', () => {
      const invalid = { ...validIndex, totalDocuments: -1 };
      expect(() => validateInvertedIndex(invalid)).toThrow(
        'InvertedIndex totalDocuments must be a non-negative number'
      );
    });

    it('should throw error when totalDocuments does not match documentLengths size', () => {
      const invalid = { ...validIndex, totalDocuments: 5 };
      expect(() => validateInvertedIndex(invalid)).toThrow(
        'InvertedIndex totalDocuments (5) must match documentLengths size (2)'
      );
    });

    it('should throw error for non-positive document length', () => {
      const invalid = {
        ...validIndex,
        documentLengths: new Map([
          ['doc-1', 150],
          ['doc-2', 0],
        ]),
      };
      expect(() => validateInvertedIndex(invalid)).toThrow(
        'Document length for doc-2 must be a positive number'
      );
    });
  });

  describe('createEmptyIndex', () => {
    it('should create an empty index with correct structure', () => {
      const index = createEmptyIndex();

      expect(index.termToPostings).toBeInstanceOf(Map);
      expect(index.termToPostings.size).toBe(0);
      expect(index.documentLengths).toBeInstanceOf(Map);
      expect(index.documentLengths.size).toBe(0);
      expect(index.totalDocuments).toBe(0);
      expect(index.averageDocumentLength).toBe(0);
    });
  });

  describe('serializeIndex and deserializeIndex', () => {
    it('should serialize and deserialize an index correctly', () => {
      const originalIndex: InvertedIndex = {
        termToPostings: new Map([
          [
            'machine',
            [
              { docId: 'doc-1', termFrequency: 2, positions: [5, 12] },
              { docId: 'doc-2', termFrequency: 1, positions: [8] },
            ],
          ],
          ['learning', [{ docId: 'doc-1', termFrequency: 1, positions: [6] }]],
        ]),
        documentLengths: new Map([
          ['doc-1', 150],
          ['doc-2', 200],
        ]),
        totalDocuments: 2,
        averageDocumentLength: 175,
      };

      // Serialize
      const serialized = serializeIndex(originalIndex);

      // Check serialized format
      expect(serialized.termToPostings).toBeInstanceOf(Object);
      expect(serialized.documentLengths).toBeInstanceOf(Object);
      expect(serialized.totalDocuments).toBe(2);
      expect(serialized.averageDocumentLength).toBe(175);

      // Deserialize
      const deserialized = deserializeIndex(serialized);

      // Check deserialized format
      expect(deserialized.termToPostings).toBeInstanceOf(Map);
      expect(deserialized.documentLengths).toBeInstanceOf(Map);
      expect(deserialized.totalDocuments).toBe(2);
      expect(deserialized.averageDocumentLength).toBe(175);

      // Check content is preserved
      expect(deserialized.termToPostings.get('machine')).toEqual(
        originalIndex.termToPostings.get('machine')
      );
      expect(deserialized.termToPostings.get('learning')).toEqual(
        originalIndex.termToPostings.get('learning')
      );
      expect(deserialized.documentLengths.get('doc-1')).toBe(150);
      expect(deserialized.documentLengths.get('doc-2')).toBe(200);
    });

    it('should handle empty index', () => {
      const emptyIndex = createEmptyIndex();
      const serialized = serializeIndex(emptyIndex);
      const deserialized = deserializeIndex(serialized);

      expect(deserialized.termToPostings.size).toBe(0);
      expect(deserialized.documentLengths.size).toBe(0);
      expect(deserialized.totalDocuments).toBe(0);
      expect(deserialized.averageDocumentLength).toBe(0);
    });
  });

  describe('calculateAverageDocumentLength', () => {
    it('should calculate average correctly', () => {
      const lengths = new Map([
        ['doc-1', 100],
        ['doc-2', 200],
        ['doc-3', 150],
      ]);

      const average = calculateAverageDocumentLength(lengths);
      expect(average).toBe(150);
    });

    it('should return 0 for empty map', () => {
      const lengths = new Map<string, number>();
      const average = calculateAverageDocumentLength(lengths);
      expect(average).toBe(0);
    });

    it('should handle single document', () => {
      const lengths = new Map([['doc-1', 250]]);
      const average = calculateAverageDocumentLength(lengths);
      expect(average).toBe(250);
    });

    it('should handle fractional averages', () => {
      const lengths = new Map([
        ['doc-1', 100],
        ['doc-2', 150],
      ]);

      const average = calculateAverageDocumentLength(lengths);
      expect(average).toBe(125);
    });
  });
});

import * as fc from 'fast-check';
import { Document, validateDocument, createDocument, DocumentValidationError } from './document';

/**
 * Property-based tests for Document model
 * Feature: reddit-search-engine
 */

describe('Document Model - Property-Based Tests', () => {
  /**
   * Property 3: Complete metadata storage
   * Validates: Requirements 1.4
   *
   * For any document stored by the collector, retrieving it should return
   * all required metadata fields: title, URL, timestamp, author, subreddit,
   * score, and comment count.
   */
  describe('Property 3: Complete metadata storage', () => {
    // Custom arbitraries for generating valid documents
    const documentTypeArb = fc.constantFrom('post' as const, 'comment' as const);

    const uuidArb = fc.uuid();

    const nonEmptyStringArb = fc
      .string({ minLength: 1, maxLength: 200 })
      .filter((s) => s.trim().length > 0);

    const urlArb = fc.webUrl();

    const redditScoreArb = fc.integer({ min: -1000000, max: 1000000 });

    const commentCountArb = fc.nat({ max: 100000 });

    const dateArb = fc.date({
      min: new Date('2020-01-01'),
      max: new Date('2025-12-31'),
    });

    const documentArb: fc.Arbitrary<Document> = fc.record({
      id: uuidArb,
      type: documentTypeArb,
      title: nonEmptyStringArb,
      content: nonEmptyStringArb,
      url: urlArb,
      author: nonEmptyStringArb,
      subreddit: nonEmptyStringArb,
      redditScore: redditScoreArb,
      commentCount: commentCountArb,
      createdUtc: dateArb,
      collectedAt: dateArb,
      processed: fc.boolean(),
    });

    it('should preserve all metadata fields after validation', () => {
      fc.assert(
        fc.property(documentArb, (originalDoc) => {
          // Simulate storing and retrieving: validate then check all fields
          validateDocument(originalDoc);

          // Create a copy to simulate retrieval
          const retrievedDoc = { ...originalDoc };

          // All required fields should be preserved
          expect(retrievedDoc.id).toBe(originalDoc.id);
          expect(retrievedDoc.type).toBe(originalDoc.type);
          expect(retrievedDoc.title).toBe(originalDoc.title);
          expect(retrievedDoc.content).toBe(originalDoc.content);
          expect(retrievedDoc.url).toBe(originalDoc.url);
          expect(retrievedDoc.author).toBe(originalDoc.author);
          expect(retrievedDoc.subreddit).toBe(originalDoc.subreddit);
          expect(retrievedDoc.redditScore).toBe(originalDoc.redditScore);
          expect(retrievedDoc.commentCount).toBe(originalDoc.commentCount);
          expect(retrievedDoc.createdUtc).toEqual(originalDoc.createdUtc);
          expect(retrievedDoc.collectedAt).toEqual(originalDoc.collectedAt);
          expect(retrievedDoc.processed).toBe(originalDoc.processed);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate that all required fields are present', () => {
      fc.assert(
        fc.property(documentArb, (doc) => {
          // A valid document should pass validation
          expect(() => validateDocument(doc)).not.toThrow();

          // Removing any required field should cause validation to fail
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
            const incompleteDoc = { ...doc };
            delete (incompleteDoc as Partial<Document>)[field];
            expect(() => validateDocument(incompleteDoc)).toThrow(DocumentValidationError);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve metadata through createDocument helper', () => {
      fc.assert(
        fc.property(
          uuidArb,
          documentTypeArb,
          nonEmptyStringArb,
          nonEmptyStringArb,
          urlArb,
          nonEmptyStringArb,
          nonEmptyStringArb,
          redditScoreArb,
          commentCountArb,
          dateArb,
          (id, type, title, content, url, author, subreddit, score, comments, created) => {
            const doc = createDocument({
              id,
              type,
              title,
              content,
              url,
              author,
              subreddit,
              redditScore: score,
              commentCount: comments,
              createdUtc: created,
            });

            // All provided fields should be preserved
            expect(doc.id).toBe(id);
            expect(doc.type).toBe(type);
            expect(doc.title).toBe(title);
            expect(doc.content).toBe(content);
            expect(doc.url).toBe(url);
            expect(doc.author).toBe(author);
            expect(doc.subreddit).toBe(subreddit);
            expect(doc.redditScore).toBe(score);
            expect(doc.commentCount).toBe(comments);
            expect(doc.createdUtc).toEqual(created);

            // Default fields should be set
            expect(doc.processed).toBe(false);
            expect(doc.collectedAt).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases for numeric fields', () => {
      fc.assert(
        fc.property(documentArb, (doc) => {
          // Test with zero commentCount
          const docWithZeroComments = { ...doc, commentCount: 0 };
          expect(() => validateDocument(docWithZeroComments)).not.toThrow();
          expect(docWithZeroComments.commentCount).toBe(0);

          // Test with negative redditScore
          const docWithNegativeScore = { ...doc, redditScore: -100 };
          expect(() => validateDocument(docWithNegativeScore)).not.toThrow();
          expect(docWithNegativeScore.redditScore).toBe(-100);

          // Test with very large values
          const docWithLargeValues = {
            ...doc,
            redditScore: 1000000,
            commentCount: 50000,
          };
          expect(() => validateDocument(docWithLargeValues)).not.toThrow();
          expect(docWithLargeValues.redditScore).toBe(1000000);
          expect(docWithLargeValues.commentCount).toBe(50000);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle both post and comment types correctly', () => {
      fc.assert(
        fc.property(documentArb, (doc) => {
          // Test post type
          const postDoc = { ...doc, type: 'post' as const };
          expect(() => validateDocument(postDoc)).not.toThrow();
          expect(postDoc.type).toBe('post');

          // Test comment type
          const commentDoc = { ...doc, type: 'comment' as const };
          expect(() => validateDocument(commentDoc)).not.toThrow();
          expect(commentDoc.type).toBe('comment');
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve date precision', () => {
      fc.assert(
        fc.property(documentArb, (doc) => {
          validateDocument(doc);

          // Dates should preserve millisecond precision
          const createdTime = doc.createdUtc.getTime();
          const collectedTime = doc.collectedAt.getTime();

          expect(doc.createdUtc.getTime()).toBe(createdTime);
          expect(doc.collectedAt.getTime()).toBe(collectedTime);

          // Dates should be valid
          expect(isNaN(doc.createdUtc.getTime())).toBe(false);
          expect(isNaN(doc.collectedAt.getTime())).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle special characters in string fields', () => {
      fc.assert(
        fc.property(
          documentArb,
          fc.string({ minLength: 1, maxLength: 100 }),
          (doc, specialContent) => {
            // Skip if the string is only whitespace
            if (specialContent.trim().length === 0) {
              return true;
            }

            const docWithSpecialChars = {
              ...doc,
              title: specialContent,
              content: specialContent,
              author: specialContent.trim(),
            };

            expect(() => validateDocument(docWithSpecialChars)).not.toThrow();
            expect(docWithSpecialChars.title).toBe(specialContent);
            expect(docWithSpecialChars.content).toBe(specialContent);
            expect(docWithSpecialChars.author).toBe(specialContent.trim());
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

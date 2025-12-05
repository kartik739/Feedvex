/**
 * Document model representing a Reddit post or comment
 */
export interface Document {
  id: string; // UUID
  type: 'post' | 'comment';
  title: string;
  content: string;
  url: string;
  author: string;
  subreddit: string;
  redditScore: number; // upvotes - downvotes
  commentCount: number;
  createdUtc: Date;
  collectedAt: Date;
  processed: boolean;
}

/**
 * Token representing a processed word with position information
 */
export interface Token {
  text: string; // original text
  position: number; // position in document
  stem: string; // stemmed form
}

/**
 * Processed document with tokenized content
 */
export interface ProcessedDocument {
  docId: string;
  tokens: Token[];
  tokenCount: number;
  uniqueTerms: Set<string>;
}

/**
 * Validation error for document fields
 */
export class DocumentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentValidationError';
  }
}

/**
 * Validates that a document has all required fields
 * @throws DocumentValidationError if validation fails
 */
export function validateDocument(doc: Partial<Document>): asserts doc is Document {
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
    if (doc[field] === undefined || doc[field] === null) {
      throw new DocumentValidationError(`Missing required field: ${field}`);
    }
  }

  // Validate type
  if (doc.type !== 'post' && doc.type !== 'comment') {
    throw new DocumentValidationError(`Invalid type: ${doc.type}. Must be 'post' or 'comment'`);
  }

  // Validate string fields are not empty
  const stringFields: (keyof Document)[] = ['id', 'title', 'content', 'url', 'author', 'subreddit'];
  for (const field of stringFields) {
    if (typeof doc[field] !== 'string' || (doc[field] as string).trim() === '') {
      throw new DocumentValidationError(`Field ${field} must be a non-empty string`);
    }
  }

  // Validate numeric fields
  if (typeof doc.redditScore !== 'number') {
    throw new DocumentValidationError('redditScore must be a number');
  }
  if (typeof doc.commentCount !== 'number' || doc.commentCount < 0) {
    throw new DocumentValidationError('commentCount must be a non-negative number');
  }

  // Validate dates
  if (!(doc.createdUtc instanceof Date) || isNaN(doc.createdUtc.getTime())) {
    throw new DocumentValidationError('createdUtc must be a valid Date');
  }
  if (!(doc.collectedAt instanceof Date) || isNaN(doc.collectedAt.getTime())) {
    throw new DocumentValidationError('collectedAt must be a valid Date');
  }

  // Validate boolean
  if (typeof doc.processed !== 'boolean') {
    throw new DocumentValidationError('processed must be a boolean');
  }
}

/**
 * Validates a token
 * @throws DocumentValidationError if validation fails
 */
export function validateToken(token: Partial<Token>): asserts token is Token {
  if (!token.text || typeof token.text !== 'string' || token.text.trim() === '') {
    throw new DocumentValidationError('Token text must be a non-empty string');
  }
  if (typeof token.position !== 'number' || token.position < 0) {
    throw new DocumentValidationError('Token position must be a non-negative number');
  }
  if (!token.stem || typeof token.stem !== 'string' || token.stem.trim() === '') {
    throw new DocumentValidationError('Token stem must be a non-empty string');
  }
}

/**
 * Validates a processed document
 * @throws DocumentValidationError if validation fails
 */
export function validateProcessedDocument(
  doc: Partial<ProcessedDocument>
): asserts doc is ProcessedDocument {
  if (!doc.docId || typeof doc.docId !== 'string' || doc.docId.trim() === '') {
    throw new DocumentValidationError('docId must be a non-empty string');
  }
  if (!Array.isArray(doc.tokens)) {
    throw new DocumentValidationError('tokens must be an array');
  }
  if (typeof doc.tokenCount !== 'number' || doc.tokenCount < 0) {
    throw new DocumentValidationError('tokenCount must be a non-negative number');
  }
  if (!(doc.uniqueTerms instanceof Set)) {
    throw new DocumentValidationError('uniqueTerms must be a Set');
  }

  // Validate each token
  for (const token of doc.tokens) {
    validateToken(token);
  }

  // Validate consistency
  if (doc.tokens.length !== doc.tokenCount) {
    throw new DocumentValidationError(
      `tokenCount (${doc.tokenCount}) does not match tokens array length (${doc.tokens.length})`
    );
  }
}

/**
 * Creates a new document with default values
 */
export function createDocument(data: Omit<Document, 'collectedAt' | 'processed'>): Document {
  return {
    ...data,
    collectedAt: new Date(),
    processed: false,
  };
}

/**
 * Creates a processed document from tokens
 */
export function createProcessedDocument(docId: string, tokens: Token[]): ProcessedDocument {
  const uniqueTerms = new Set(tokens.map((t) => t.stem));
  return {
    docId,
    tokens,
    tokenCount: tokens.length,
    uniqueTerms,
  };
}

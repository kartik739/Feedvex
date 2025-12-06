/**
 * Index data structures for the search engine
 * 
 * An inverted index maps terms (words) to the documents containing them.
 * This allows fast lookup: given a search term, quickly find all matching documents.
 */

/**
 * PostingsList represents all occurrences of a term in a single document
 * 
 * Example: If "machine" appears 3 times in document "doc-123" at positions 5, 12, 45:
 * {
 *   docId: "doc-123",
 *   termFrequency: 3,
 *   positions: [5, 12, 45]
 * }
 */
export interface PostingsList {
  docId: string; // Which document contains this term
  termFrequency: number; // How many times the term appears in this document
  positions: number[]; // Where in the document (for phrase queries and snippets)
}

/**
 * IndexEntry represents all information about a single term across all documents
 * 
 * Example: The word "machine" appears in 3 documents:
 * {
 *   term: "machine",
 *   documentFrequency: 3,
 *   postings: [
 *     { docId: "doc-1", termFrequency: 2, positions: [5, 12] },
 *     { docId: "doc-2", termFrequency: 1, positions: [8] },
 *     { docId: "doc-3", termFrequency: 5, positions: [1, 3, 7, 15, 20] }
 *   ]
 * }
 */
export interface IndexEntry {
  term: string; // The word/term
  documentFrequency: number; // How many documents contain this term (for IDF calculation)
  postings: PostingsList[]; // List of all documents containing this term
}

/**
 * InvertedIndex is the main data structure for the search engine
 * 
 * It maps each term to its postings list and tracks document statistics
 * needed for ranking algorithms (BM25, TF-IDF)
 * 
 * Structure:
 * {
 *   termToPostings: {
 *     "machine": [{ docId: "doc-1", termFrequency: 2, positions: [5, 12] }, ...],
 *     "learning": [{ docId: "doc-1", termFrequency: 1, positions: [6] }, ...],
 *     ...
 *   },
 *   documentLengths: {
 *     "doc-1": 150,  // doc-1 has 150 tokens
 *     "doc-2": 200,  // doc-2 has 200 tokens
 *     ...
 *   },
 *   totalDocuments: 1000,
 *   averageDocumentLength: 175.5
 * }
 */
export interface InvertedIndex {
  // Maps term → list of documents containing it
  termToPostings: Map<string, PostingsList[]>;
  
  // Maps docId → number of tokens in that document (for BM25 length normalization)
  documentLengths: Map<string, number>;
  
  // Total number of documents in the index
  totalDocuments: number;
  
  // Average document length (for BM25 calculation)
  averageDocumentLength: number;
}

/**
 * Serializable version of InvertedIndex for JSON storage
 * 
 * Maps can't be directly serialized to JSON, so we convert them to objects
 */
export interface SerializableInvertedIndex {
  termToPostings: Record<string, PostingsList[]>;
  documentLengths: Record<string, number>;
  totalDocuments: number;
  averageDocumentLength: number;
}

/**
 * Creates an empty inverted index
 */
export function createEmptyIndex(): InvertedIndex {
  return {
    termToPostings: new Map(),
    documentLengths: new Map(),
    totalDocuments: 0,
    averageDocumentLength: 0,
  };
}

/**
 * Serializes an inverted index to a JSON-compatible format
 * 
 * Converts Maps to plain objects so they can be saved to disk
 */
export function serializeIndex(index: InvertedIndex): SerializableInvertedIndex {
  return {
    termToPostings: Object.fromEntries(index.termToPostings),
    documentLengths: Object.fromEntries(index.documentLengths),
    totalDocuments: index.totalDocuments,
    averageDocumentLength: index.averageDocumentLength,
  };
}

/**
 * Deserializes an inverted index from JSON format
 * 
 * Converts plain objects back to Maps for efficient lookup
 */
export function deserializeIndex(serialized: SerializableInvertedIndex): InvertedIndex {
  return {
    termToPostings: new Map(Object.entries(serialized.termToPostings)),
    documentLengths: new Map(Object.entries(serialized.documentLengths)),
    totalDocuments: serialized.totalDocuments,
    averageDocumentLength: serialized.averageDocumentLength,
  };
}

/**
 * Calculates the average document length from document lengths map
 */
export function calculateAverageDocumentLength(documentLengths: Map<string, number>): number {
  if (documentLengths.size === 0) {
    return 0;
  }
  
  const totalLength = Array.from(documentLengths.values()).reduce((sum, len) => sum + len, 0);
  return totalLength / documentLengths.size;
}

/**
 * Validates a PostingsList
 */
export function validatePostingsList(posting: Partial<PostingsList>): asserts posting is PostingsList {
  if (!posting.docId || typeof posting.docId !== 'string' || posting.docId.trim() === '') {
    throw new Error('PostingsList docId must be a non-empty string');
  }
  
  if (typeof posting.termFrequency !== 'number' || posting.termFrequency < 1) {
    throw new Error('PostingsList termFrequency must be a positive number');
  }
  
  if (!Array.isArray(posting.positions)) {
    throw new Error('PostingsList positions must be an array');
  }
  
  if (posting.positions.length === 0) {
    throw new Error('PostingsList positions must not be empty');
  }
  
  // Validate positions are non-negative and sorted
  for (let i = 0; i < posting.positions.length; i++) {
    const pos = posting.positions[i];
    if (typeof pos !== 'number' || pos < 0) {
      throw new Error('PostingsList positions must be non-negative numbers');
    }
    if (i > 0 && pos <= posting.positions[i - 1]) {
      throw new Error('PostingsList positions must be in ascending order');
    }
  }
  
  // Validate termFrequency matches positions length
  if (posting.termFrequency !== posting.positions.length) {
    throw new Error(
      `PostingsList termFrequency (${posting.termFrequency}) must match positions length (${posting.positions.length})`
    );
  }
}

/**
 * Validates an IndexEntry
 */
export function validateIndexEntry(entry: Partial<IndexEntry>): asserts entry is IndexEntry {
  if (!entry.term || typeof entry.term !== 'string' || entry.term.trim() === '') {
    throw new Error('IndexEntry term must be a non-empty string');
  }
  
  if (typeof entry.documentFrequency !== 'number' || entry.documentFrequency < 1) {
    throw new Error('IndexEntry documentFrequency must be a positive number');
  }
  
  if (!Array.isArray(entry.postings)) {
    throw new Error('IndexEntry postings must be an array');
  }
  
  if (entry.postings.length === 0) {
    throw new Error('IndexEntry postings must not be empty');
  }
  
  // Validate each posting
  for (const posting of entry.postings) {
    validatePostingsList(posting);
  }
  
  // Validate documentFrequency matches postings length
  if (entry.documentFrequency !== entry.postings.length) {
    throw new Error(
      `IndexEntry documentFrequency (${entry.documentFrequency}) must match postings length (${entry.postings.length})`
    );
  }
}

/**
 * Validates an InvertedIndex
 */
export function validateInvertedIndex(index: Partial<InvertedIndex>): asserts index is InvertedIndex {
  if (!(index.termToPostings instanceof Map)) {
    throw new Error('InvertedIndex termToPostings must be a Map');
  }
  
  if (!(index.documentLengths instanceof Map)) {
    throw new Error('InvertedIndex documentLengths must be a Map');
  }
  
  if (typeof index.totalDocuments !== 'number' || index.totalDocuments < 0) {
    throw new Error('InvertedIndex totalDocuments must be a non-negative number');
  }
  
  if (typeof index.averageDocumentLength !== 'number' || index.averageDocumentLength < 0) {
    throw new Error('InvertedIndex averageDocumentLength must be a non-negative number');
  }
  
  // Validate totalDocuments matches documentLengths size
  if (index.totalDocuments !== index.documentLengths.size) {
    throw new Error(
      `InvertedIndex totalDocuments (${index.totalDocuments}) must match documentLengths size (${index.documentLengths.size})`
    );
  }
  
  // Validate document lengths are positive
  for (const [docId, length] of index.documentLengths.entries()) {
    if (typeof length !== 'number' || length < 1) {
      throw new Error(`Document length for ${docId} must be a positive number`);
    }
  }
  
  // Validate each index entry
  for (const [term, postings] of index.termToPostings.entries()) {
    if (typeof term !== 'string' || term.trim() === '') {
      throw new Error('Index term must be a non-empty string');
    }
    
    if (!Array.isArray(postings) || postings.length === 0) {
      throw new Error(`Postings for term "${term}" must be a non-empty array`);
    }
    
    for (const posting of postings) {
      validatePostingsList(posting);
    }
  }
}

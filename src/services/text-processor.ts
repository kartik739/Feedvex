import * as cheerio from 'cheerio';
import { stopwords, PorterStemmer } from 'natural';
import { Document, ProcessedDocument, Token, createProcessedDocument } from '../models/document';

/**
 * Configuration for text processing
 */
export interface ProcessorConfig {
  // Future configuration options can be added here
  preservePositions?: boolean;
}

/**
 * TextProcessor handles cleaning, normalizing, and tokenizing text content
 * Implements requirements 2.1, 2.2, 2.3, and 2.6 for HTML stripping, case normalization, and tokenization
 */
export class TextProcessor {
  private config: ProcessorConfig;

  constructor(config: ProcessorConfig = {}) {
    this.config = {
      preservePositions: true,
      ...config,
    };
  }

  /**
   * Strips HTML tags and entities from text
   * Requirement 2.1: Strip all HTML tags and entities
   * @param text Raw text that may contain HTML
   * @returns Clean text with HTML removed
   */
  cleanHtml(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Use cheerio to parse and extract text content
    const $ = cheerio.load(text);

    // Extract text content, which automatically strips HTML tags and decodes entities
    const cleanText = $.text();

    // Clean up extra whitespace that may result from HTML removal
    return cleanText.replace(/\s+/g, ' ').trim();
  }

  /**
   * Converts text to lowercase
   * Requirement 2.2: Convert all characters to lowercase
   * @param text Input text
   * @returns Lowercase text
   */
  normalizeCase(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text.toLowerCase();
  }

  /**
   * Tokenizes text by splitting on whitespace and punctuation boundaries
   * Requirements 2.3, 2.6: Split on whitespace and punctuation boundaries, track token positions
   * @param text Input text to tokenize
   * @returns Array of tokens with positions
   */
  tokenize(text: string): Token[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const tokens: Token[] = [];

    // Split text into tokens using regex that matches word boundaries
    // This regex splits on whitespace and punctuation while preserving the tokens
    const tokenRegex = /\b\w+\b/g;
    let match;

    while ((match = tokenRegex.exec(text)) !== null) {
      const tokenText = match[0];
      const tokenPosition = match.index;

      // Create token with original text and position
      tokens.push({
        text: tokenText,
        position: tokenPosition,
        stem: tokenText, // Stemming will be implemented in task 3.9
      });
    }

    return tokens;
  }

  /**
   * Removes English stopwords from tokens
   * Requirement 2.4: Filter tokens against stopwords
   * @param tokens Array of tokens to filter
   * @returns Array of tokens with stopwords removed
   */
  removeStopwords(tokens: Token[]): Token[] {
    if (!tokens || !Array.isArray(tokens)) {
      return [];
    }

    // Get English stopwords from natural library
    const englishStopwords = new Set(stopwords);

    // Filter out stopwords (case-insensitive comparison)
    return tokens.filter((token) => {
      const lowercaseText = token.text.toLowerCase();
      return !englishStopwords.has(lowercaseText);
    });
  }

  /**
   * Applies Porter Stemmer to reduce words to their root form
   * Requirement 2.5: Apply stemming to filtered tokens
   * @param tokens Array of tokens to stem
   * @returns Array of tokens with stems applied
   */
  stem(tokens: Token[]): Token[] {
    if (!tokens || !Array.isArray(tokens)) {
      return [];
    }

    return tokens.map((token) => ({
      ...token,
      stem: PorterStemmer.stem(token.text.toLowerCase()),
    }));
  }

  /**
   * Processes a document by cleaning HTML, normalizing case, tokenizing, removing stopwords, and stemming
   * @param document Document to process
   * @returns Processed document with tokenized content
   */
  processDocument(document: Document): ProcessedDocument {
    // Clean HTML from title and content
    const cleanTitle = this.cleanHtml(document.title);
    const cleanContent = this.cleanHtml(document.content);

    // Normalize case
    const normalizedTitle = this.normalizeCase(cleanTitle);
    const normalizedContent = this.normalizeCase(cleanContent);

    // Combine title and content for processing
    const combinedText = `${normalizedTitle} ${normalizedContent}`.trim();

    // Tokenize the combined text
    const tokens = this.tokenize(combinedText);

    // Remove stopwords
    const filteredTokens = this.removeStopwords(tokens);

    // Apply stemming
    const stemmedTokens = this.stem(filteredTokens);

    return createProcessedDocument(document.id, stemmedTokens);
  }

  /**
   * Processes multiple documents in batch
   * @param documents Array of documents to process
   * @returns Array of processed documents
   */
  processBatch(documents: Document[]): ProcessedDocument[] {
    return documents.map((doc) => this.processDocument(doc));
  }
}

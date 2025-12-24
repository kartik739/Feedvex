import * as fs from 'fs';
import * as path from 'path';

/**
 * Validation utilities for monorepo restructure
 * Checks file existence, content, and validates paths in config files
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that a file exists
 */
export function validateFileExists(filePath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(filePath)) {
    errors.push(`File does not exist: ${filePath}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates that a directory exists
 */
export function validateDirectoryExists(dirPath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(dirPath)) {
    errors.push(`Directory does not exist: ${dirPath}`);
  } else if (!fs.statSync(dirPath).isDirectory()) {
    errors.push(`Path exists but is not a directory: ${dirPath}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates that all files in a list exist
 */
export function validateFilesExist(filePaths: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) {
      errors.push(`File does not exist: ${filePath}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Gets all files in a directory recursively
 */
export function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) {
    return arrayOfFiles;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  }

  return arrayOfFiles;
}

/**
 * Validates that source directory structure is preserved in destination
 */
export function validateStructurePreserved(
  sourceDir: string,
  destDir: string,
  sourceFiles: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const sourceFile of sourceFiles) {
    const relativePath = path.relative(sourceDir, sourceFile);
    const expectedDestPath = path.join(destDir, relativePath);

    if (!fs.existsSync(expectedDestPath)) {
      errors.push(`File not found in destination: ${expectedDestPath}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

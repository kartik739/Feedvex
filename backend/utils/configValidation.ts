import * as fs from 'fs';

/**
 * Configuration file validation utilities
 * Validates paths in config files like tsconfig.json, jest.config.js, etc.
 */

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  pathsFound: string[];
}

/**
 * Validates paths in tsconfig.json
 */
export function validateTsConfigPaths(
  tsconfigPath: string = 'tsconfig.json'
): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pathsFound: string[] = [];

  if (!fs.existsSync(tsconfigPath)) {
    errors.push(`tsconfig.json not found at: ${tsconfigPath}`);
    return { valid: false, errors, warnings, pathsFound };
  }

  try {
    const content = fs.readFileSync(tsconfigPath, 'utf-8');
    const config = JSON.parse(content);

    if (config.compilerOptions?.rootDir) {
      pathsFound.push(`rootDir: ${config.compilerOptions.rootDir}`);
      const rootDir = config.compilerOptions.rootDir.replace('./', '');
      if (!fs.existsSync(rootDir)) {
        errors.push(`rootDir path does not exist: ${rootDir}`);
      }
    }

    if (config.compilerOptions?.outDir) {
      pathsFound.push(`outDir: ${config.compilerOptions.outDir}`);
    }

    if (config.include) {
      for (const includePath of config.include) {
        pathsFound.push(`include: ${includePath}`);
        const basePath = includePath.split('/**')[0].replace('./', '');
        if (basePath && !fs.existsSync(basePath)) {
          warnings.push(`include path base does not exist: ${basePath}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      pathsFound
    };
  } catch (error) {
    errors.push(`Failed to parse tsconfig.json: ${error instanceof Error ? error.message : String(error)}`);
    return { valid: false, errors, warnings, pathsFound };
  }
}

/**
 * Validates paths in jest.config.js
 */
export function validateJestConfigPaths(
  jestConfigPath: string = 'jest.config.js'
): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pathsFound: string[] = [];

  if (!fs.existsSync(jestConfigPath)) {
    errors.push(`jest.config.js not found at: ${jestConfigPath}`);
    return { valid: false, errors, warnings, pathsFound };
  }

  try {
    const content = fs.readFileSync(jestConfigPath, 'utf-8');

    const rootsMatch = content.match(/roots:\s*\[(.*?)\]/s);
    if (rootsMatch) {
      const rootsPaths = rootsMatch[1].match(/'([^']+)'/g);
      if (rootsPaths) {
        for (const rootPath of rootsPaths) {
          const cleanPath = rootPath.replace(/'/g, '').replace('<rootDir>/', '');
          pathsFound.push(`roots: ${cleanPath}`);
          if (cleanPath && !fs.existsSync(cleanPath)) {
            warnings.push(`roots path does not exist: ${cleanPath}`);
          }
        }
      }
    }

    const coverageMatch = content.match(/collectCoverageFrom:\s*\[(.*?)\]/s);
    if (coverageMatch) {
      const coveragePaths = coverageMatch[1].match(/'([^']+)'/g);
      if (coveragePaths) {
        for (const covPath of coveragePaths) {
          const cleanPath = covPath.replace(/'/g, '').split('/**')[0];
          if (cleanPath && !cleanPath.startsWith('!')) {
            pathsFound.push(`collectCoverageFrom: ${cleanPath}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      pathsFound
    };
  } catch (error) {
    errors.push(`Failed to parse jest.config.js: ${error instanceof Error ? error.message : String(error)}`);
    return { valid: false, errors, warnings, pathsFound };
  }
}

/**
 * Validates paths in package.json scripts
 */
export function validatePackageJsonPaths(
  packageJsonPath: string = 'package.json'
): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pathsFound: string[] = [];

  if (!fs.existsSync(packageJsonPath)) {
    errors.push(`package.json not found at: ${packageJsonPath}`);
    return { valid: false, errors, warnings, pathsFound };
  }

  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);

    if (packageJson.scripts) {
      for (const [scriptName, scriptCommand] of Object.entries(packageJson.scripts)) {
        if (typeof scriptCommand === 'string') {
          const pathPatterns = [
            /ts-node\s+([^\s]+)/,
            /node\s+([^\s]+)/,
            /cd\s+([^\s&|]+)/
          ];

          for (const pattern of pathPatterns) {
            const match = scriptCommand.match(pattern);
            if (match && match[1]) {
              const scriptPath = match[1];
              pathsFound.push(`${scriptName}: ${scriptPath}`);
              
              if (!fs.existsSync(scriptPath)) {
                warnings.push(`Script path does not exist: ${scriptPath} (in ${scriptName})`);
              }
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      pathsFound
    };
  } catch (error) {
    errors.push(`Failed to parse package.json: ${error instanceof Error ? error.message : String(error)}`);
    return { valid: false, errors, warnings, pathsFound };
  }
}

/**
 * Validates all configuration files
 */
export function validateAllConfigPaths(): {
  tsconfig: ConfigValidationResult;
  jest: ConfigValidationResult;
  packageJson: ConfigValidationResult;
  overallValid: boolean;
} {
  const tsconfig = validateTsConfigPaths();
  const jest = validateJestConfigPaths();
  const packageJson = validatePackageJsonPaths();

  const overallValid = 
    tsconfig.valid &&
    jest.valid &&
    packageJson.valid;

  return {
    tsconfig,
    jest,
    packageJson,
    overallValid
  };
}

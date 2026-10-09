import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get(key: string): string | undefined {
    return process.env[key];
  }

  getOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable "${key}" is not defined`);
    }
    return value;
  }

  /**
   * Return the value of `key` as a number, or `defaultValue` if the variable
   * is missing, empty, or not a valid number.
   */
  getNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  /**
   * Return the value of `key` as a boolean, or `defaultValue` if the variable
   * is missing or empty. Accepts 'true'/'false', '1'/'0', 'yes'/'no', 'on'/'off'.
   */
  getBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    return defaultValue;
  }

  /**
   * Return the value of `key` as a trimmed string, or `defaultValue` if the
   * variable is missing or empty.
   */
  getString(key: string, defaultValue: string): string {
    const value = process.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    return value.trim();
  }
}

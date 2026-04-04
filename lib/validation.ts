/**
 * Input validation utilities for StellarPay
 */

import { StrKey } from '@stellar/stellar-sdk';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate Stellar public key (G...)
 */
export function validatePublicKey(key: string): ValidationResult {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Public key is required' };
  }

  if (!key.startsWith('G')) {
    return { valid: false, error: 'Public key must start with G' };
  }

  if (key.length !== 56) {
    return { valid: false, error: 'Public key must be 56 characters' };
  }

  try {
    StrKey.decodeEd25519PublicKey(key);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid public key format' };
  }
}

/**
 * Validate Stellar secret key (S...)
 */
export function validateSecretKey(key: string): ValidationResult {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Secret key is required' };
  }

  if (!key.startsWith('S')) {
    return { valid: false, error: 'Secret key must start with S' };
  }

  if (key.length !== 56) {
    return { valid: false, error: 'Secret key must be 56 characters' };
  }

  try {
    StrKey.decodeEd25519SecretSeed(key);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid secret key format' };
  }
}

/**
 * Validate payment amount
 */
export function validateAmount(amount: string): ValidationResult {
  if (!amount || typeof amount !== 'string') {
    return { valid: false, error: 'Amount is required' };
  }

  const num = parseFloat(amount);

  if (isNaN(num)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (num <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (num > 1000000000) {
    return { valid: false, error: 'Amount exceeds maximum limit' };
  }

  // Check decimal places (Stellar supports up to 7, but USDC typically uses 6)
  const parts = amount.split('.');
  if (parts[1] && parts[1].length > 7) {
    return { valid: false, error: 'Amount cannot have more than 7 decimal places' };
  }

  return { valid: true };
}

/**
 * Validate memo text
 */
export function validateMemo(memo: string): ValidationResult {
  if (!memo) {
    return { valid: true }; // Memo is optional
  }

  if (typeof memo !== 'string') {
    return { valid: false, error: 'Memo must be text' };
  }

  if (memo.length > 28) {
    return { valid: false, error: 'Memo cannot exceed 28 characters' };
  }

  // Check for invalid characters (only ASCII printable)
  if (!/^[\x20-\x7E]*$/.test(memo)) {
    return { valid: false, error: 'Memo contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Sanitize user input by removing dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove any script-like content
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+=/gi, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validate email address (for user onboarding)
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  return { valid: true };
}

/**
 * Validate display name
 */
export function validateDisplayName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  const sanitized = sanitizeInput(name);

  if (sanitized.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }

  if (sanitized.length > 50) {
    return { valid: false, error: 'Name cannot exceed 50 characters' };
  }

  return { valid: true };
}

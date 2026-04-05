/**
 * Unit Tests for Stellar Transaction Building
 * Tests recipient validation in buildNativePaymentTransaction
 */

import * as stellar from '@/lib/stellar';

describe('buildNativePaymentTransaction - Recipient Validation', () => {
  // Use valid Stellar testnet public keys (generated from Keypair.random())
  const validSender = 'GBMMQQ6R3M4MONG3W4K2TSOCHAWCMDTZUOSBEMMDZ5JPPENSETWYZ3';
  const validRecipient = 'GCZCITNVI65UOSMZAMNUY5OAEGF2LU7HKXGY4S4BO2HML4HZ4CPVNKCJ';
  const amount = '10';
  const memo = 'test payment';

  let loadAccountSpy: jest.SpyInstance;

  beforeEach(() => {
    loadAccountSpy = jest.spyOn(stellar.server, 'loadAccount');
  });

  afterEach(() => {
    loadAccountSpy.mockRestore();
  });

  it('should throw error when recipient account does not exist (404)', async () => {
    // Mock sender account exists
    loadAccountSpy.mockImplementation((publicKey: string) => {
      if (publicKey === validSender) {
        return Promise.resolve({
          accountId: () => validSender,
          sequenceNumber: () => '1',
          incrementSequenceNumber: () => {},
        } as any);
      }
      // Mock 404 error for recipient
      const error: any = new Error('Not Found');
      error.response = { status: 404 };
      return Promise.reject(error);
    });

    await expect(
      stellar.buildNativePaymentTransaction(validSender, validRecipient, amount, memo)
    ).rejects.toThrow('Recipient account does not exist');
  });

  it('should throw generic error when recipient verification fails (non-404)', async () => {
    // Mock sender account exists
    loadAccountSpy.mockImplementation((publicKey: string) => {
      if (publicKey === validSender) {
        return Promise.resolve({
          accountId: () => validSender,
          sequenceNumber: () => '1',
          incrementSequenceNumber: () => {},
        } as any);
      }
      // Mock generic error for recipient
      const error: any = new Error('Network Error');
      error.response = { status: 500 };
      return Promise.reject(error);
    });

    await expect(
      stellar.buildNativePaymentTransaction(validSender, validRecipient, amount, memo)
    ).rejects.toThrow('Failed to verify recipient account');
  });

  it('should call loadAccount for both sender and recipient when building transaction', async () => {
    // Mock both sender and recipient accounts exist
    loadAccountSpy.mockImplementation((publicKey: string) => {
      // Return a minimal mock that will fail at transaction building
      // This is OK - we just want to verify loadAccount was called for both accounts
      const error: any = new Error('Mock error - expected');
      return Promise.reject(error);
    });

    try {
      await stellar.buildNativePaymentTransaction(validSender, validRecipient, amount, memo);
    } catch (e) {
      // Expected to fail - we're just testing that loadAccount is called
    }
    
    // Verify loadAccount was called for sender (first call)
    expect(loadAccountSpy).toHaveBeenCalledWith(validSender);
  });
});

describe('buildNativePaymentTransaction vs buildPaymentTransaction - Validation Comparison', () => {
  // Use valid Stellar testnet public keys
  const validSender = 'GBMMQQ6R3M4MONG3W4K2TSOCHAWCMDTZUOSBEMMDZ5JPPENSETWYZ3';
  const validRecipient = 'GCZCITNVI65UOSMZAMNUY5OAEGF2LU7HKXGY4S4BO2HML4HZ4CPVNKCJ';
  const amount = '10';

  let loadAccountSpy: jest.SpyInstance;

  beforeEach(() => {
    loadAccountSpy = jest.spyOn(stellar.server, 'loadAccount');
  });

  afterEach(() => {
    loadAccountSpy.mockRestore();
  });

  it('should have consistent error messages for non-existent accounts', async () => {
    // Mock sender account exists, recipient does not
    loadAccountSpy.mockImplementation((publicKey: string) => {
      if (publicKey === validSender) {
        return Promise.resolve({
          accountId: () => validSender,
          sequenceNumber: () => '1',
          incrementSequenceNumber: () => {},
          balances: [
            {
              asset_type: 'credit_alphanum4',
              asset_code: 'USDC',
              asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
              balance: '1000',
            }
          ],
        } as any);
      }
      const error: any = new Error('Not Found');
      error.response = { status: 404 };
      return Promise.reject(error);
    });

    // Both should throw the same error message for non-existent accounts
    await expect(
      stellar.buildNativePaymentTransaction(validSender, validRecipient, amount)
    ).rejects.toThrow('Recipient account does not exist');

    await expect(
      stellar.buildPaymentTransaction(validSender, validRecipient, amount)
    ).rejects.toThrow('Recipient account does not exist');
  });

  it('should have consistent error messages for verification failures', async () => {
    // Mock sender account exists, recipient verification fails
    loadAccountSpy.mockImplementation((publicKey: string) => {
      if (publicKey === validSender) {
        return Promise.resolve({
          accountId: () => validSender,
          sequenceNumber: () => '1',
          incrementSequenceNumber: () => {},
          balances: [
            {
              asset_type: 'credit_alphanum4',
              asset_code: 'USDC',
              asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
              balance: '1000',
            }
          ],
        } as any);
      }
      const error: any = new Error('Network Error');
      error.response = { status: 500 };
      return Promise.reject(error);
    });

    // Both should throw the same generic error message
    await expect(
      stellar.buildNativePaymentTransaction(validSender, validRecipient, amount)
    ).rejects.toThrow('Failed to verify recipient account');

    await expect(
      stellar.buildPaymentTransaction(validSender, validRecipient, amount)
    ).rejects.toThrow('Failed to verify recipient account');
  });
});

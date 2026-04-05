/**
 * Unit Tests for SendForm UI Behavior
 * Feature: xlm-payment-support
 * Task 14: Write unit tests for UI behavior
 * 
 * Tests the SendForm component's UI behavior including asset selection,
 * form validation, and message display.
 * 
 * Validates: Requirements 1.1, 1.2, 1.4, 7.3, 8.4
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SendForm from '@/components/SendForm';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock Freighter API
jest.mock('@stellar/freighter-api', () => ({
  signTransaction: jest.fn(),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(),
    })),
  })),
}));

// Mock stellar functions
jest.mock('@/lib/stellar', () => {
  const actual = jest.requireActual('@/lib/stellar');
  return {
    ...actual,
    server: {
      ...actual.server,
      loadAccount: jest.fn(),
    },
    submitTransaction: jest.fn(),
    isMultisigAccount: jest.fn(),
  };
});

describe('SendForm UI Behavior', () => {
  const validPublicKey = 'GBMMQQ6R3M4MONG3W4K2TSOCHAWCMDTZUOSBEMMDZ5JPPENSETWYZ3';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Asset selector contains XLM and USDC options
   * Validates: Requirement 1.1
   */
  describe('Asset Selector Options', () => {
    it('should contain XLM option', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const assetSelector = screen.getAllByRole('combobox')[0];
      const xlmOption = screen.getByRole('option', { name: /XLM \(Stellar Lumens\)/i });
      
      expect(assetSelector).toBeInTheDocument();
      expect(xlmOption).toBeInTheDocument();
      expect(xlmOption).toHaveValue('XLM');
    });

    it('should contain USDC option', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const usdcOption = screen.getByRole('option', { name: /USDC \(USD Coin\)/i });
      
      expect(usdcOption).toBeInTheDocument();
      expect(usdcOption).toHaveValue('USDC');
    });

    it('should contain both XLM and USDC options', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const options = screen.getAllByRole('option');
      
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveValue('XLM');
      expect(options[1]).toHaveValue('USDC');
    });
  });

  /**
   * Test: Asset selector defaults to XLM on mount
   * Validates: Requirement 1.2
   */
  describe('Asset Selector Default Value', () => {
    it('should default to XLM on mount', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const assetSelector = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
      
      expect(assetSelector.value).toBe('XLM');
    });

    it('should display XLM in the amount label on mount', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const amountLabel = screen.getByText(/Amount \(XLM\)/i);
      
      expect(amountLabel).toBeInTheDocument();
    });

    it('should display "Send XLM" button text on mount', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const submitButton = screen.getByRole('button', { name: /Send XLM/i });
      
      expect(submitButton).toBeInTheDocument();
    });
  });

  /**
   * Test: Asset selector positioned above amount input in DOM
   * Validates: Requirement 1.4
   */
  describe('Asset Selector Position', () => {
    it('should be positioned above amount input in DOM order', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const assetSelector = screen.getAllByRole('combobox')[0];
      const amountInput = screen.getByPlaceholderText(/0\.00/i);
      
      // Get parent form element
      const form = assetSelector.closest('form');
      expect(form).not.toBeNull();
      
      // Get all form controls in order
      const formControls = form!.querySelectorAll('select, input[type="text"], input[type="number"]');
      const controlsArray = Array.from(formControls);
      
      const assetIndex = controlsArray.indexOf(assetSelector);
      const amountIndex = controlsArray.indexOf(amountInput);
      
      expect(assetIndex).toBeLessThan(amountIndex);
    });

    it('should render asset selector before recipient input', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const assetSelector = screen.getAllByRole('combobox')[0];
      const recipientInput = screen.getByPlaceholderText(/G\.\.\./i);
      
      const form = assetSelector.closest('form');
      const formControls = form!.querySelectorAll('select, input[type="text"], input[type="number"]');
      const controlsArray = Array.from(formControls);
      
      const assetIndex = controlsArray.indexOf(assetSelector);
      const recipientIndex = controlsArray.indexOf(recipientInput);
      
      expect(assetIndex).toBeLessThan(recipientIndex);
    });
  });

  /**
   * Test: Button disabled when required fields empty
   * Validates: Requirement 8.4
   */
  describe('Button Disabled State', () => {
    it('should be disabled when recipient is empty', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const submitButton = screen.getByRole('button', { name: /Send XLM/i });
      const amountInput = screen.getByPlaceholderText(/0\.00/i);
      
      // Fill only amount
      fireEvent.change(amountInput, { target: { value: '10' } });
      
      expect(submitButton).toBeDisabled();
    });

    it('should be disabled when amount is empty', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const submitButton = screen.getByRole('button', { name: /Send XLM/i });
      const recipientInput = screen.getByPlaceholderText(/G\.\.\./i);
      
      // Fill only recipient
      fireEvent.change(recipientInput, { target: { value: 'GCZCITNVI65UOSMZAMNUY5OAEGF2LU7HKXGY4S4BO2HML4HZ4CPVNKCJ' } });
      
      expect(submitButton).toBeDisabled();
    });

    it('should be disabled when both recipient and amount are empty', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const submitButton = screen.getByRole('button', { name: /Send XLM/i });
      
      expect(submitButton).toBeDisabled();
    });

    it('should be enabled when both recipient and amount are filled', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const submitButton = screen.getByRole('button', { name: /Send XLM/i });
      const recipientInput = screen.getByPlaceholderText(/G\.\.\./i);
      const amountInput = screen.getByPlaceholderText(/0\.00/i);
      
      // Fill both required fields
      fireEvent.change(recipientInput, { target: { value: 'GCZCITNVI65UOSMZAMNUY5OAEGF2LU7HKXGY4S4BO2HML4HZ4CPVNKCJ' } });
      fireEvent.change(amountInput, { target: { value: '10' } });
      
      expect(submitButton).not.toBeDisabled();
    });

    it('should be disabled during loading state', () => {
      const { isMultisigAccount } = require('@/lib/stellar');
      isMultisigAccount.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<SendForm publicKey={validPublicKey} />);
      
      const submitButton = screen.getByRole('button', { name: /Send XLM/i });
      const recipientInput = screen.getByPlaceholderText(/G\.\.\./i);
      const amountInput = screen.getByPlaceholderText(/0\.00/i);
      
      // Fill form and submit
      fireEvent.change(recipientInput, { target: { value: 'GCZCITNVI65UOSMZAMNUY5OAEGF2LU7HKXGY4S4BO2HML4HZ4CPVNKCJ' } });
      fireEvent.change(amountInput, { target: { value: '10' } });
      fireEvent.click(submitButton);
      
      // Button should be disabled during loading
      expect(submitButton).toBeDisabled();
    });
  });

  /**
   * Test: Error message display for validation failures
   * Validates: Requirement 7.3
   */
  describe('Error Message Display', () => {
    it('should display error message for invalid recipient address', async () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const recipientInput = screen.getByPlaceholderText(/G\.\.\./i);
      const amountInput = screen.getByPlaceholderText(/0\.00/i);
      const submitButton = screen.getByRole('button', { name: /Send XLM/i });
      
      // Fill with invalid address (doesn't start with G)
      fireEvent.change(recipientInput, { target: { value: 'INVALID_ADDRESS' } });
      fireEvent.change(amountInput, { target: { value: '10' } });
      fireEvent.click(submitButton);
      
      // Wait for error message - actual message from validation.ts
      const errorMessage = await screen.findByText(/Public key must start with G/i);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-red-400');
    });

    it('should display error message for invalid memo', async () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const recipientInput = screen.getByPlaceholderText(/G\.\.\./i);
      const amountInput = screen.getByPlaceholderText(/0\.00/i);
      const memoInput = screen.getByPlaceholderText(/Payment for\.\.\./i);
      const submitButton = screen.getByRole('button', { name: /Send XLM/i });
      
      // Fill with invalid memo (too long)
      fireEvent.change(recipientInput, { target: { value: 'GCZCITNVI65UOSMZAMNUY5OAEGF2LU7HKXGY4S4BO2HML4HZ4CPVNKCJ' } });
      fireEvent.change(amountInput, { target: { value: '10' } });
      fireEvent.change(memoInput, { target: { value: 'This memo is way too long and exceeds the limit' } });
      fireEvent.click(submitButton);
      
      // Wait for error message
      const errorMessage = await screen.findByText(/Memo cannot exceed 28 characters/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  /**
   * Test: Success and error message styling
   * Validates: Requirement 8.4
   * 
   * Note: Full transaction success flows are tested in integration tests.
   * These tests verify the UI correctly styles success/error messages.
   */
  describe('Message Display Styling', () => {
    it('should display error messages with red styling', async () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const recipientInput = screen.getByPlaceholderText(/G\.\.\./i);
      const amountInput = screen.getByPlaceholderText(/0\.00/i);
      const submitButton = screen.getByRole('button', { name: /Send XLM/i });
      
      // Trigger validation error
      fireEvent.change(recipientInput, { target: { value: 'INVALID' } });
      fireEvent.change(amountInput, { target: { value: '10' } });
      fireEvent.click(submitButton);
      
      const errorContainer = await screen.findByText(/Public key must start with G/i);
      const errorDiv = errorContainer.closest('div');
      
      expect(errorDiv).toHaveClass('bg-red-500/10');
      expect(errorDiv).toHaveClass('border-red-500/30');
      expect(errorDiv).toHaveClass('text-red-400');
    });
  });

  /**
   * Test: Asset selection updates UI labels
   * Validates: Requirements 1.3, 8.1, 8.2, 8.3
   */
  describe('Asset Selection UI Updates', () => {
    it('should update amount label when switching to USDC', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const assetSelector = screen.getAllByRole('combobox')[0];
      
      // Switch to USDC
      fireEvent.change(assetSelector, { target: { value: 'USDC' } });
      
      const amountLabel = screen.getByText(/Amount \(USDC\)/i);
      expect(amountLabel).toBeInTheDocument();
    });

    it('should update button text when switching to USDC', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const assetSelector = screen.getAllByRole('combobox')[0];
      
      // Switch to USDC
      fireEvent.change(assetSelector, { target: { value: 'USDC' } });
      
      const submitButton = screen.getByRole('button', { name: /Send USDC/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should update button text back to XLM when switching back', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const assetSelector = screen.getAllByRole('combobox')[0];
      
      // Switch to USDC
      fireEvent.change(assetSelector, { target: { value: 'USDC' } });
      expect(screen.getByRole('button', { name: /Send USDC/i })).toBeInTheDocument();
      
      // Switch back to XLM
      fireEvent.change(assetSelector, { target: { value: 'XLM' } });
      expect(screen.getByRole('button', { name: /Send XLM/i })).toBeInTheDocument();
    });

    it('should update amount label immediately when asset changes', () => {
      render(<SendForm publicKey={validPublicKey} />);
      
      const assetSelector = screen.getAllByRole('combobox')[0];
      
      // Initially XLM
      expect(screen.getByText(/Amount \(XLM\)/i)).toBeInTheDocument();
      
      // Switch to USDC
      fireEvent.change(assetSelector, { target: { value: 'USDC' } });
      expect(screen.getByText(/Amount \(USDC\)/i)).toBeInTheDocument();
      
      // Switch back to XLM
      fireEvent.change(assetSelector, { target: { value: 'XLM' } });
      expect(screen.getByText(/Amount \(XLM\)/i)).toBeInTheDocument();
    });
  });
});

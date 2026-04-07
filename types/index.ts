export interface User {
  id: string;
  stellar_public_key: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  last_active_at: string;
  is_admin?: boolean;
}

export interface Transaction {
  id: string;
  user_public_key: string;
  stellar_tx_hash: string | null;
  direction: 'sent' | 'received';
  amount: number;
  asset: string;
  counterparty: string | null;
  memo: string | null;
  created_at: string;
}

export interface PendingTransaction {
  id: string;
  vault_public_key: string;
  creator_public_key: string;
  xdr_payload: string;
  required_signatures: number;
  current_signatures: number;
  status: 'pending' | 'executed' | 'rejected';
  created_at: string;
}

export interface Balance {
  asset: string;
  balance: string;
  issuer?: string;
}

export interface Metrics {
  totalUsers: number;
  dau: number;
  totalTransactions: number;
  totalVolume: number;
}

export interface WalletState {
  publicKey: string | null;
  isFreighter: boolean;
  secretKey?: string;
  isConnected: boolean;
}

export interface HorizonOperation {
  id: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  source_account: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  from?: string;
  to?: string;
}

# Changelog

All notable changes to StellarPay will be documented in this file.

## [1.1.0] - 2026-04-04

### Changed
- **BREAKING**: Removed auto-generated testnet account feature
- **BREAKING**: Freighter wallet is now required for all users
- Updated WalletConnect component to only support Freighter
- Improved error messaging when Freighter is not installed
- Added direct link to Freighter installation page

### Security
- Enhanced security by removing client-side key generation
- All secret keys now remain in Freighter extension (hardware-level security)
- Eliminated risk of users losing auto-generated keys

### Documentation
- Updated README.md to reflect Freighter-only authentication
- Updated USER_GUIDE.md with Freighter setup instructions
- Updated TECHNICAL_DOCS.md to remove testnet fallback references
- Updated SECURITY.md with improved key management documentation
- Added note about funding testnet accounts via Stellar Laboratory

### Removed
- `generateKeypair()` function usage in WalletConnect
- `fundTestnetAccount()` function usage in WalletConnect
- Secret key display UI
- Auto-generated wallet fallback logic

## [1.0.0] - 2026-04-03

### Added
- Initial production release
- Multi-signature vault functionality
- Admin dashboard with metrics
- Sentry monitoring integration
- Supabase data indexing
- Complete documentation suite
- Security hardening
- Health check endpoints


/**
 * @file OTP provider public surface.
 *
 * This module re-exports the OTP contract and the provider factory so the rest
 * of the authentication module (and future modules) can depend on a single,
 * stable entry point — never on a concrete OTP provider.
 */
export { OTPAdapter } from './otp-adapter.interface';
export { ProviderFactory, OtpProviderName } from './provider.factory';


import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app/app.module';
import { AdminAuthService } from './src/modules/admin/auth/admin-auth.service';
import { AuthService } from './src/modules/authentication/auth.service';
import { AdminJwtStrategy } from './src/modules/admin/auth/strategies/admin-jwt.strategy';
import { JwtStrategy } from './src/modules/authentication/strategies/jwt.strategy';
import { PrismaService } from './src/prisma/prisma.service';

async function runTests() {
  const adminUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    throw new Error(
      'ADMIN_USERNAME and ADMIN_PASSWORD must be set before running admin auth tests.',
    );
  }

  console.log('=== STARTING ADMIN FOUNDATION & AUTH SECURITY TESTS ===\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const adminAuthService = app.get(AdminAuthService);
  const authService = app.get(AuthService);
  const adminJwtStrategy = app.get(AdminJwtStrategy);
  const farmerJwtStrategy = app.get(JwtStrategy);
  const prisma = app.get(PrismaService);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // CLEANUP: Revoke any stale refresh tokens from previous test runs to ensure isolation
    console.log('[Setup] Revoking any existing admin refresh tokens from previous runs...');
    await prisma.adminRefreshToken.updateMany({
      where: { admin: { username: adminUsername }, isRevoked: false },
      data: { isRevoked: true },
    });
    console.log('[Setup] Cleanup done.\n');

    // TEST 1: Admin login with correct credentials
    console.log('--- Test Suite 1: Admin Authentication ---');
    const loginResult = await adminAuthService.login(
      { username: adminUsername, password: adminPassword },
      '127.0.0.1',
    );
    assert(!!loginResult.accessToken, 'Admin login returns accessToken');
    assert(!!loginResult.refreshToken, 'Admin login returns refreshToken');
    assert(loginResult.admin.username === adminUsername, 'Admin profile username is correct');
    assert(loginResult.admin.role === 'admin', 'Admin profile role is admin');
    assert(!('passwordHash' in loginResult.admin), 'passwordHash is NOT returned in API response');
    assert(!('password' in loginResult.admin), 'password is NOT returned in API response');

    // TEST 2: Admin login with wrong password
    try {
      await adminAuthService.login(
        { username: adminUsername, password: 'WrongPassword999!' },
        '127.0.0.1',
      );
      assert(false, 'Admin login should fail with wrong password');
    } catch (e: any) {
      assert(e.status === 401, 'Wrong password throws 401 Unauthorized');
      assert(e.message === 'Invalid credentials', 'Wrong password returns "Invalid credentials"');
    }

    // TEST 3: Admin login with non-existent username
    try {
      await adminAuthService.login(
        { username: 'nonexistent_user', password: 'SomePassword123' },
        '127.0.0.1',
      );
      assert(false, 'Admin login should fail for non-existent user');
    } catch (e: any) {
      assert(e.status === 401, 'Non-existent user throws 401 Unauthorized');
      assert(e.message === 'Invalid credentials', 'Non-existent user returns generic "Invalid credentials" (no user enumeration)');
    }

    // TEST 4: Admin profile lookup
    console.log('\n--- Test Suite 2: Admin Profile & Authorization ---');
    const profile = await adminAuthService.getProfile(loginResult.admin.id);
    assert(profile.id === loginResult.admin.id, 'getProfile returns correct admin ID');
    assert(profile.username === adminUsername, 'getProfile returns correct username');
    assert(!('passwordHash' in profile), 'getProfile does NOT expose passwordHash');

    // TEST 5: Admin JWT Strategy validates admin token payload
    const validatedAdmin = await adminJwtStrategy.validate({
      sub: loginResult.admin.id,
      username: adminUsername,
      role: 'admin',
      type: 'admin',
    });
    assert(validatedAdmin.id === loginResult.admin.id, 'AdminJwtStrategy successfully validates admin payload');

    // TEST 6: ISOLATION SECURITY - Farmer payload MUST be rejected by Admin strategy!
    console.log('\n--- Test Suite 3: Cross-Authorization & Isolation ---');
    try {
      await adminJwtStrategy.validate({
        sub: '00000000-0000-0000-0000-000000000001',
        username: 'farmer_user',
        role: 'farmer' as any,
        type: 'user' as any,
      });
      assert(false, 'AdminJwtStrategy must reject farmer/user tokens');
    } catch (e: any) {
      assert(e.status === 401, 'AdminJwtStrategy rejects non-admin token with 401');
    }

    // TEST 7: ISOLATION SECURITY - Admin payload MUST be rejected by Farmer strategy!
    try {
      await farmerJwtStrategy.validate({
        sub: loginResult.admin.id,
        mobileNumber: '',
        role: 'admin',
      });
      assert(false, 'Farmer JwtStrategy must reject admin token because admin is not in user table');
    } catch (e: any) {
      assert(e.status === 401, 'Farmer JwtStrategy rejects admin ID with 401 (not in user table)');
    }

    // TEST 8: Token Refresh Flow
    console.log('\n--- Test Suite 4: Token Refresh & Rotation ---');
    const refreshResult = await adminAuthService.refresh({
      refreshToken: loginResult.refreshToken,
    });
    assert(!!refreshResult.accessToken, 'Refresh returns fresh accessToken');
    assert(!!refreshResult.refreshToken, 'Refresh returns fresh rotated refreshToken');
    assert(refreshResult.refreshToken !== loginResult.refreshToken, 'Refresh token was rotated');

    // The very first refresh token (loginResult.refreshToken) was consumed
    // by the refreshResult call above. Attempt to reuse it — must fail.
    try {
      const reuseResult = await adminAuthService.refresh({
        refreshToken: loginResult.refreshToken, // this was the token consumed by refresh
      });
      console.error('[DEBUG] Reuse should have failed.');
      assert(false, 'Consumed refresh token must be rejected');
    } catch (e: any) {

      assert(e.status === 401, 'Reusing consumed refresh token throws 401');
    }

    // TEST 9: Logout Flow
    console.log('\n--- Test Suite 5: Logout & Session Invalidation ---');
    // refreshResult.refreshToken is the rotated new token — revoke it via logout
    const logoutRes = await adminAuthService.logout(
      loginResult.admin.id,
      refreshResult.refreshToken,
    );
    assert(logoutRes.message === 'Logged out successfully', 'Admin logout succeeds');

    // Revoked token cannot be used to refresh
    try {
      await adminAuthService.refresh({
        refreshToken: refreshResult.refreshToken,
      });
      assert(false, 'Logged out refresh token must not refresh session');
    } catch (e: any) {
      assert(e.status === 401, 'Logged out refresh token rejected with 401');
    }

    // TEST 10: Farmer Authentication Integrity Test
    console.log('\n--- Test Suite 6: Farmer Authentication Integrity ---');
    // Ensure Otp table, User table, and sendOtp method remain completely functional
    const farmerOtpRes = await authService.sendOtp({ mobileNumber: '9999999999' });
    assert(!!farmerOtpRes.message, 'Farmer sendOtp works as expected');
    assert(farmerOtpRes.message === 'OTP sent successfully', 'Farmer OTP message is correct (farmer auth untouched)');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    await app.close();
  }

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

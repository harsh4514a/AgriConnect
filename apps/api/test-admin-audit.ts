import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app/app.module';
import { AdminAuthService } from './src/modules/admin/auth/admin-auth.service';
import { AdminAuditService } from './src/modules/admin/audit/admin-audit.service';
import { AdminUsersService } from './src/modules/admin/users/admin-users.service';
import { PrismaService } from './src/prisma/prisma.service';

async function runTests() {
  const adminUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase() || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD must be set before running admin audit tests.');
  }

  console.log('=== STARTING ADMIN ACTIVITY & AUDIT INTEGRATION TESTS ===\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const adminAuthService = app.get(AdminAuthService);
  const adminAuditService = app.get(AdminAuditService);
  const adminUsersService = app.get(AdminUsersService);
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
    console.log('--- Test Suite 1: Automated Audit Logging on Admin Action ---');
    // 1. Admin login creates real audit record
    const loginResult = await adminAuthService.login(
      { username: adminUsername, password: adminPassword },
      '192.168.1.100',
      'Mozilla/5.0 TestBrowser/1.0',
    );
    assert(!!loginResult.accessToken, 'Admin login succeeded');

    // Verify audit log was recorded in DB
    const recentLogs = await adminAuditService.findAll({
      action: 'ADMIN_LOGIN',
      pageSize: 5,
    });
    assert(recentLogs.items.length > 0, 'Audit log created for ADMIN_LOGIN');
    const loginLog = recentLogs.items[0];
    assert(loginLog.action === 'ADMIN_LOGIN', 'Action is ADMIN_LOGIN');
    assert(loginLog.resource === 'auth', 'Resource is auth');
    assert(loginLog.status === 'SUCCESS', 'Status is SUCCESS');
    assert(loginLog.actorName === adminUsername, 'Actor name is recorded as admin');

    console.log('\n--- Test Suite 2: Audit Detail Lookup & Sanitization ---');
    // 2. Fetch full detail
    const details = await adminAuditService.findOne(loginLog.id);
    assert(details.id === loginLog.id, 'Audit detail ID matches');
    assert(details.ipAddress === '192.168.1.100', 'IP address is recorded');
    assert(details.userAgent === 'Mozilla/5.0 TestBrowser/1.0', 'User Agent is recorded');

    // Test sanitization of sensitive metadata
    await adminAuditService.recordAuditLog({
      action: 'TEST_ACTION',
      resource: 'test',
      description: 'Testing sanitization of sensitive payload fields',
      metadata: {
        password: 'SuperSecretPassword!',
        token: 'eyJh...secretToken',
        safeProperty: 'VisibleValue',
      },
    });
    const testLogs = await adminAuditService.findAll({
      action: 'TEST_ACTION',
      pageSize: 1,
    });
    assert(testLogs.items.length > 0, 'Test audit record created');
    const testDetail = await adminAuditService.findOne(testLogs.items[0].id);
    assert(testDetail.metadata?.password === '[REDACTED]', 'Sensitive password was redacted');
    assert(testDetail.metadata?.token === '[REDACTED]', 'Sensitive token was redacted');
    assert(testDetail.metadata?.safeProperty === 'VisibleValue', 'Non-sensitive data preserved');

    console.log('\n--- Test Suite 3: Search, Filters & Pagination ---');
    // Test filters
    const filterOptions = await adminAuditService.getFilters();
    assert(filterOptions.actions.includes('ADMIN_LOGIN'), 'Filter options include ADMIN_LOGIN');
    assert(filterOptions.resources.includes('auth'), 'Filter options include auth resource');
    assert(Array.isArray(filterOptions.actors), 'Filter options include actors list');

    // Search query
    const searchRes = await adminAuditService.findAll({
      search: 'signed in successfully',
    });
    assert(searchRes.items.length > 0, 'Search query successfully matched audit description');

    // Pagination query
    const pagedRes = await adminAuditService.findAll({
      page: 1,
      pageSize: 2,
    });
    assert(pagedRes.pagination.pageSize === 2, 'Pagination pageSize is respected');
    assert(pagedRes.pagination.total >= 2, 'Pagination total is computed');

    console.log('\n--- Test Suite 4: User Status Update Audit Event ---');
    // Find or create test user
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          mobileNumber: '9898000001',
          firstName: 'AuditTest',
          lastName: 'User',
          role: 'farmer',
        },
      });
    }

    const originalStatus = user.isActive;
    await adminUsersService.updateStatus(
      user.id,
      { isActive: !originalStatus },
      loginResult.admin,
    );

    // Verify audit log for USER_STATUS_CHANGE
    const userAuditLogs = await adminAuditService.findAll({
      action: 'USER_STATUS_CHANGE',
      pageSize: 1,
    });
    assert(userAuditLogs.items.length > 0, 'USER_STATUS_CHANGE audit record was created');
    const userLog = userAuditLogs.items[0];
    assert(userLog.resource === 'user', 'Resource is user');
    assert(userLog.resourceId === user.id, 'Resource ID is user ID');

    // Restore original status
    await adminUsersService.updateStatus(
      user.id,
      { isActive: originalStatus },
      loginResult.admin,
    );

    console.log('\n--- Test Suite 5: Error Handling & Not Found ---');
    try {
      await adminAuditService.findOne('00000000-0000-0000-0000-000000000000');
      assert(false, 'Non-existent ID must throw NotFoundException');
    } catch (err: any) {
      assert(err.status === 404, 'Non-existent ID correctly throws 404');
    }
  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    try {
      await prisma.auditLog.deleteMany({
        where: { OR: [{ action: 'TEST_ACTION' }, { resource: 'test' }] },
      });
    } catch {}
    await app.close();
  }

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

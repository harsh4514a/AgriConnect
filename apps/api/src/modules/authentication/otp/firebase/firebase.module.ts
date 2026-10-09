import { Module } from '@nestjs/common';
import { ConfigModule } from '@/config/config.module';
import { FirebaseAdminService } from './firebase-admin.service';

/**
 * FirebaseModule provides the FirebaseAdminService (Firebase Admin SDK).
 *
 * Kept as a dedicated module so the Firebase credential bootstrap stays
 * isolated from the OTP provider abstraction. The FirebaseAdapter consumes
 * this service; other parts of the codebase never talk to Firebase directly.
 */
@Module({
  imports: [ConfigModule],
  providers: [FirebaseAdminService],
  exports: [FirebaseAdminService],
})
export class FirebaseModule {}


import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyFirebaseDto } from './dto/verify-firebase.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  AuthTokens,
  OtpResponse,
  VerifyOtpResponse,
  CompleteProfileResponse,
} from './interfaces/auth-response.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a 6-digit OTP to the given mobile number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests or resend cooldown active' })
  async sendOtp(@Body() dto: SendOtpDto): Promise<OtpResponse> {
    return this.authService.sendOtp(dto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP and login (existing user) or flag for onboarding (new user)',
  })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<VerifyOtpResponse> {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('verify-firebase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Verify a Firebase ID Token (Firebase Phone Auth) and login (existing user) or flag for onboarding (new user)',
  })
  @ApiResponse({ status: 200, description: 'Firebase verification successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired Firebase ID token' })
  async verifyFirebase(@Body() dto: VerifyFirebaseDto): Promise<VerifyOtpResponse> {
    return this.authService.verifyFirebase(dto);
  }

  @Public()
  @Post('complete-profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete user profile and create user account (new users)' })
  @ApiResponse({ status: 200, description: 'Profile completed successfully' })
  @ApiResponse({ status: 409, description: 'Profile already completed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired registration token' })
  async completeProfile(
    @Body() dto: CompleteProfileDto,
  ): Promise<CompleteProfileResponse> {
    return this.authService.completeProfile(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshDto): Promise<AuthTokens> {
    return this.authService.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() dto?: RefreshDto,
  ): Promise<{ message: string }> {
    await this.authService.logout(userId, dto?.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the profile of the authenticated user' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async profile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the profile of the authenticated user' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid profile or location data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/language')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the preferred language of the authenticated user' })
  @ApiResponse({ status: 200, description: 'Language updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid language code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateLanguage(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLanguageDto,
  ): Promise<{ preferredLanguage: string }> {
    return this.authService.updatePreferredLanguage(userId, dto.preferredLanguage);
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { CurrentUser } from './current-user.decorator'; 

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(ClerkAuthGuard)
  me(@CurrentUser() auth: { sub: string }) {
    return { clerkId: auth.sub };
  }
}
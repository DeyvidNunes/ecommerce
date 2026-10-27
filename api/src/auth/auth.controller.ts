import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  @ApiOperation({
    summary:
      'Devolve o usuário autenticado (cria o registro no primeiro acesso)',
  })
  @Get('me')
  @UseGuards(ClerkAuthGuard)
  me(@CurrentUser() user: User) {
    return user;
  }
}

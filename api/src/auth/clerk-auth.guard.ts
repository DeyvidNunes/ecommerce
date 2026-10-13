import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import appConfig from '../config/app.config';
import { UsersService } from '../users/users.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader: string | undefined = request.headers['authorization'];
    const [type, token] = authHeader?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token não informado');
    }

    let payload;
    try {
      payload = await verifyToken(token, {
        secretKey: this.config.clerk.secretKey,
      });
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    request.auth = payload;
    request.user = await this.usersService.findOrCreateByClerkId(payload.sub);

    return true;
  }
}

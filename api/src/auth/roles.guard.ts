import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/entities/user.entity';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lê os papéis permitidos definidos na rota pelo decorator @Roles
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. Se a rota não exige nenhum papel específico, libera o acesso
    if (!requiredRoles) {
      return true;
    }

    // 3. Pega a requisição e o usuário injetado pelo ClerkAuthGuard
    const { user } = context.switchToHttp().getRequest();

    // 4. Valida se o usuário existe e se o seu papel está na lista permitida
    const hasRole = user && requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.',
      );
    }

    return true;
  }
}

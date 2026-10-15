import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../shared/decorators/public.decorator.js';
import { UsersRepository } from '../../users/repositories/users.repository.js';
import { AuthService } from '../services/auth.service.js';
import { AuthRequest } from '../types/auth.request.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly usersRepository: UsersRepository,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const header = request.headers.authorization;

    if (!header) {
      throw new UnauthorizedException('Authorization header is missing', 'unauthorized');
    }

    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization header must use bearer token', 'unauthorized');
    }

    const payload = await this.authService.verifyAccessToken(token);
    const user = await this.usersRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User associated with this token was not found', 'unauthorized');
    }

    request.user = user;

    return true;
  }
}

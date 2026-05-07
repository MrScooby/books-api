import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import type { Request } from 'express'

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name)

  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.ADMIN_TOKEN

    if (!expected) {
      this.logger.error(
        'ADMIN_TOKEN is not set — refusing all writes. Set it in the API env to enable write access.'
      )
      throw new UnauthorizedException('Admin auth not configured')
    }

    const req = context.switchToHttp().getRequest<Request>()
    const provided = req.header('x-admin-token')

    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid or missing admin token')
    }

    return true
  }
}

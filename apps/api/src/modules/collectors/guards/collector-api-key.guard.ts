import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class CollectorApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.COLLECTOR_API_KEY;
    if (!expected) {
      throw new UnauthorizedException('COLLECTOR_API_KEY is not configured');
    }

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const provided = request.headers['x-collector-key'] ?? request.headers['x-api-key'];

    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid collector API key');
    }

    return true;
  }
}

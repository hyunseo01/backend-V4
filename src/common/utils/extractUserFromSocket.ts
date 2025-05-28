import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../interfaces/user-role.type';

export function extractUserFromSocket(
  client: Socket,
  jwtService: JwtService,
): { accountId: number; role: UserRole } {
  const token = client.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new UnauthorizedException('토큰이 존재하지 않습니다.');
  }

  try {
    const payload = jwtService.verify(token);
    return {
      accountId: payload.sub,
      role: payload.role,
    };
  } catch (err) {
    throw new UnauthorizedException('토큰 인증에 실패했습니다.');
  }
}

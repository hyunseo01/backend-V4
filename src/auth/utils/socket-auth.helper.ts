import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

export interface SocketUserPayload {
  accountId: number;
  role: 'user' | 'trainer' | 'admin';
}

export function extractUserFromSocket(
  client: Socket,
  jwtService: JwtService,
): SocketUserPayload {
  console.log('Handshake.query:', client.handshake.query);
  console.log('Handshake.headers:', client.handshake.headers);

  const tokenFromQuery = client.handshake.query.token;
  const authHeader =
    typeof tokenFromQuery === 'string'
      ? tokenFromQuery
      : client.handshake.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    throw new UnauthorizedException('Authorization 헤더가 없습니다.');
  }

  const token = authHeader.replace(/^Bearer\s/, '');
  if (!token) {
    throw new UnauthorizedException('JWT 토큰이 존재하지 않습니다.');
  }

  try {
    const payload = jwtService.verify<{ sub: number; role: string }>(token);
    return {
      accountId: payload.sub,
      role: payload.role as 'user' | 'trainer' | 'admin',
    };
  } catch (err) {
    console.error('소켓 인증 에러:', err);
    throw new UnauthorizedException('유효하지 않은 토큰입니다.');
  }
}

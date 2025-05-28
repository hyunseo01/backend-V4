import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? this.extractMessage(exception)
        : '서버 내부 오류 발생';

    res.status(status).json({
      success: false,
      message,
      statusCode: status,
    });
  }

  private extractMessage(exception: HttpException): string {
    const res = exception.getResponse();

    if (typeof res === 'string') return res;

    if (typeof res === 'object' && res !== null) {
      const maybeMessage = (res as { message?: string | string[] }).message;
      if (Array.isArray(maybeMessage)) return maybeMessage.join(', ');
      if (typeof maybeMessage === 'string') return maybeMessage;
    }

    return '알 수 없는 오류';
  }
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class TimezoneInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next
      .handle()
      .pipe(map((data: unknown): unknown => convertDatesToKST(data)));
  }
}

function convertDatesToKST(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(convertDatesToKST);
  }

  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] =
        value instanceof Date
          ? dayjs(value).tz('Asia/Seoul').format()
          : convertDatesToKST(value);
    }
    return result;
  }

  return obj;
}

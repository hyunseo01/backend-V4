import { Injectable, NotFoundException } from '@nestjs/common';
import { Account } from '../account/entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expo } from 'expo-server-sdk';
import { Cron } from '@nestjs/schedule';
import { ReservationsService } from '../reservations/reservations.service';
import timezone from 'dayjs/plugin/timezone';
import dayjs from 'dayjs';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly reservationsService: ReservationsService,
  ) {}

  async savePushToken(accountId: number, expoPushToken: string): Promise<void> {
    await this.accountRepository.update(accountId, { expoPushToken });
  }

  async sendNotificationToAccount(
    accountId: number,
    title: string,
    body: string,
  ): Promise<void> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });

    if (!account?.expoPushToken) {
      throw new NotFoundException('푸시 토큰이 없습니다');
    }

    await this.sendPushNotification(account.expoPushToken, title, body);
  }

  async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
  ) {
    const expo = new Expo();
    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.error(`푸시 토큰 형식이 잘못됨: ${expoPushToken as string}`);
      return;
    }

    const messages = [
      {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data: { withSome: 'data' },
      },
    ];

    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(messages);
      console.log('알림 전송 성공:', ticketChunk);
    } catch (error) {
      console.error('알림 전송 실패:', error);
    }
  }

  async sendFirstLoginNotice(accountId: number) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });

    if (!account?.expoPushToken) return; // 푸시 토큰 없으면 무시

    await this.sendPushNotification(
      account.expoPushToken,
      '환영합니다!',
      '첫 로그인 PT권 30회 지급!',
    );
  }

  @Cron('0 6 * * *') // 매일 6:00 AM
  async sendMorningReminders() {
    dayjs.extend(timezone);

    const today = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');
    const reservations =
      await this.reservationsService.findTodayReservations(today);

    for (const res of reservations) {
      if (res.user.account.expoPushToken) {
        await this.sendPushNotification(
          res.user.account.expoPushToken,
          '오늘 예약 안내',
          `${res.schedule.startTime.slice(0, 5)}에 예약된 PT가 있습니다.`,
        );
      }
    }
  }

  @Cron('*/5 * * * *') // 5분마다 실행
  async sendBeforeOneHourReminders() {
    const now = dayjs().tz('Asia/Seoul');
    const targetTime = now.add(1, 'hour');

    const rangeStart = targetTime.subtract(2, 'minute').format('HH:mm');
    const rangeEnd = targetTime.add(2, 'minute').format('HH:mm');
    const today = now.format('YYYY-MM-DD');

    const reservations =
      await this.reservationsService.findReservationsBetweenTime(
        today,
        rangeStart,
        rangeEnd,
      );

    for (const res of reservations) {
      const timeText = res.schedule.startTime.slice(0, 5);

      if (res.user?.account.expoPushToken) {
        await this.sendPushNotification(
          res.user.account.expoPushToken,
          '1시간 후 예약 알림',
          `1시간 후 ${timeText}에 예약된 PT가 있습니다. 준비해주세요!`,
        );
      }

      if (res.schedule.trainer?.account.expoPushToken) {
        await this.sendPushNotification(
          res.schedule.trainer.account.expoPushToken,
          '트레이너 알림',
          `회원 ${res.user.account.name}님의 PT가 ${timeText}에 시작됩니다.`,
        );
      }
    }
  }

  async sendReservationNoticeToTrainer(trainerAccountId: number) {
    const trainerAccount = await this.accountRepository.findOne({
      where: { id: trainerAccountId },
    });

    if (!trainerAccount?.expoPushToken) return;

    await this.sendPushNotification(
      trainerAccount.expoPushToken,
      '새로운 예약 알림',
      '새로운 예약이 생성되었습니다. 오늘 스케줄을 확인해보세요!',
    );
  }

  async sendReservationCancelNotice(toAccountId: number, timeText: string) {
    const targetAccount = await this.accountRepository.findOne({
      where: { id: toAccountId },
    });

    if (!targetAccount?.expoPushToken) return;

    await this.sendPushNotification(
      targetAccount.expoPushToken,
      '예약 취소 알림',
      `오늘 ${timeText}에 예정된 예약이 취소되었습니다.`,
    );
  }

  async sendChatPush(toAccountId: number, content: string): Promise<void> {
    const account = await this.accountRepository.findOne({
      where: { id: toAccountId },
    });

    if (!account?.expoPushToken) return; // 토큰 없으면 푸시 생략

    const message = {
      to: account.expoPushToken,
      sound: 'default',
      title: '새 메시지가 도착했어요!',
      body: content.length > 20 ? content.slice(0, 20) + '...' : content,
      data: { type: 'chat' },
    };

    const expo = new Expo();
    await expo.sendPushNotificationsAsync([message]);
  }
}

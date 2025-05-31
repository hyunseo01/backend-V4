import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { Between, DataSource, Repository } from 'typeorm';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Schedule } from '../schedules/entities/schedules.entity';
import { User } from '../users/entities/users.entity';
import { Account } from '../account/entities/account.entity';
import {
  GetMyReservationsResponseDto,
  ReservationInfoDto,
} from './dto/get-my-reservations-response.dto';
import { TrainerReservationDto } from './dto/get-trainer-reservations-response.dto';
import { Trainer } from '../trainer/entities/trainer.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { Chat } from '../chats/entities/chats.entity';
import { ChatsService } from '../chats/chats.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Trainer)
    private readonly trainerRepository: Repository<Trainer>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => ChatsService))
    private readonly chatsService: ChatsService,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ) {}

  async createReservation(
    dto: CreateReservationDto,
    accountId: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const scheduleRepo = manager.getRepository(Schedule);
      const reservationRepo = manager.getRepository(Reservation);

      const user = await userRepo.findOne({ where: { accountId } });
      if (!user) throw new NotFoundException('유저 정보가 없습니다.');
      if (!user.trainerId)
        throw new BadRequestException('트레이너가 배정되지 않았습니다.');
      if (user.ptCount <= 0)
        throw new BadRequestException('보유한 PT권이 없습니다.');

      const fullTime = dto.time + ':00';

      let schedule = await scheduleRepo.findOne({
        where: {
          trainerId: user.trainerId,
          date: new Date(dto.date),
          startTime: fullTime,
        },
      });

      if (!schedule) {
        schedule = scheduleRepo.create({
          trainerId: user.trainerId,
          date: new Date(dto.date),
          startTime: fullTime,
        });
        await scheduleRepo.save(schedule);
      }

      const existing = await reservationRepo.findOne({
        where: { scheduleId: schedule.id, userId: user.id },
      });

      if (existing) throw new ConflictException('이미 예약이 존재합니다.');

      const reservation = reservationRepo.create({
        scheduleId: schedule.id,
        userId: user.id,
        status: 'confirmed',
      });

      user.ptCount -= 1;

      await reservationRepo.save(reservation);
      await userRepo.save(user);
    });

    const user = await this.userRepository.findOneBy({ accountId });
    if (!user || !user.trainerId) return;

    const trainer = await this.trainerRepository.findOne({
      where: { id: user.trainerId },
      relations: ['account'],
    });

    if (trainer?.account?.id) {
      await this.notificationsService.sendReservationNoticeToTrainer(
        trainer.account.id,
      );
    }

    const chat = await this.chatRepository.findOne({
      where: {
        userId: user.id,
        trainerId: user.trainerId,
      },
    });

    if (chat) {
      await this.chatsService.createBotMessage(
        chat.id,
        '예약이 완료되었습니다. 일정에 맞춰 준비해주세요!',
      );
    }
  }

  async cancelReservation(
    reservationId: number,
    accountId: number,
    role: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const reservationRepo = manager.getRepository(Reservation);
      const userRepo = manager.getRepository(User);
      const trainerRepo = manager.getRepository(Trainer);

      const now = new Date();

      const accountUser =
        role === 'user'
          ? await userRepo.findOneBy({ accountId })
          : await trainerRepo.findOneBy({ accountId });

      if (!accountUser)
        throw new NotFoundException('회원 정보를 찾을 수 없습니다.');

      const reservation = await reservationRepo.findOne({
        where: { id: reservationId },
        relations: ['user', 'schedule'],
      });

      if (!reservation) throw new NotFoundException('예약을 찾을 수 없습니다.');

      const ownsReservation =
        (role === 'user' && reservation.user.id === accountUser.id) ||
        (role === 'trainer' &&
          reservation.schedule.trainerId === accountUser.id);

      if (!ownsReservation)
        throw new ForbiddenException('해당 예약을 취소할 권한이 없습니다.');

      if (reservation.status !== 'confirmed')
        throw new BadRequestException('이미 취소되었거나 완료된 예약입니다.');

      const dateStr =
        typeof reservation.schedule.date === 'string'
          ? reservation.schedule.date
          : reservation.schedule.date.toISOString().split('T')[0];

      const start = new Date(`${dateStr}T${reservation.schedule.startTime}`);
      const end = new Date(start.getTime() + 50 * 60 * 1000);

      if (
        role === 'user' &&
        now >= new Date(start.getTime() - 24 * 60 * 60 * 1000)
      )
        throw new BadRequestException(
          '예약 24시간 이전까지만 취소할 수 있습니다.',
        );

      if (role === 'trainer' && now >= end)
        throw new BadRequestException('이미 종료된 예약은 취소할 수 없습니다.');

      reservation.status = 'cancelled';
      if (role === 'user') {
        reservation.user.ptCount += 1;
        await userRepo.save(reservation.user);
      }
      await reservationRepo.save(reservation);
    });

    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      relations: [
        'user',
        'user.account',
        'schedule',
        'schedule.trainer',
        'schedule.trainer.account',
      ],
    });
    if (!reservation) return;

    const targetAccountId =
      role === 'user'
        ? reservation.schedule.trainer?.account?.id
        : reservation.user?.account?.id;

    if (targetAccountId && reservation.schedule.startTime) {
      const timeText = reservation.schedule.startTime.slice(0, 5);
      await this.notificationsService.sendReservationCancelNotice(
        targetAccountId,
        timeText,
      );
    }

    const chat = await this.chatRepository.findOne({
      where: {
        userId: reservation.user.id,
        trainerId: reservation.schedule.trainerId,
      },
    });

    if (chat) {
      await this.chatsService.createBotMessage(
        chat.id,
        '예약이 취소되었습니다. 다음에 다시 이용해주세요.',
      );
    }
  }

  async getMyReservations(
    accountId: number,
  ): Promise<GetMyReservationsResponseDto> {
    const user = await this.userRepository.findOneBy({ accountId });
    if (!user) throw new NotFoundException('회원 정보를 찾을 수 없습니다.');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const reservations = await this.reservationRepository.find({
      where: { userId: user.id, status: 'confirmed' },
      relations: ['schedule', 'schedule.trainer', 'schedule.trainer.account'],
      order: { schedule: { date: 'ASC', startTime: 'ASC' } },
    });

    const today: ReservationInfoDto[] = [];
    const upcoming: ReservationInfoDto[] = [];

    for (const res of reservations) {
      const dateStr =
        typeof res.schedule.date === 'string'
          ? res.schedule.date
          : res.schedule.date.toISOString().split('T')[0];

      const start = new Date(`${dateStr}T${res.schedule.startTime}`);
      const end = new Date(start.getTime() + 50 * 60 * 1000);
      const isInProgress = now >= start && now < end;
      const isFinished = now >= end;

      const item: ReservationInfoDto = {
        reservationId: res.id,
        trainerName: res.schedule.trainer?.account?.name || '알 수 없음',
        date: String(res.schedule.date),
        time: res.schedule.startTime.slice(0, 5),
        duration: 50,
        isInProgress,
        isFinished,
      };

      if (String(res.schedule.date) === todayStr) today.push(item);
      else if (String(res.schedule.date) > todayStr) upcoming.push(item);
    }

    return { today, upcoming };
  }

  async getTrainerReservations(
    accountId: number,
    date: string,
  ): Promise<TrainerReservationDto[]> {
    const trainer = await this.trainerRepository.findOneBy({ accountId });
    if (!trainer)
      throw new NotFoundException('트레이너 정보를 찾을 수 없습니다.');

    const now = new Date();

    const reservations = await this.reservationRepository.find({
      where: {
        status: 'confirmed',
        schedule: {
          date: new Date(date),
          trainerId: trainer.id,
        },
      },
      relations: ['schedule', 'user', 'user.account'],
      order: { schedule: { startTime: 'ASC' } },
    });

    return reservations.map((res) => {
      const dateStr =
        typeof res.schedule.date === 'string'
          ? res.schedule.date
          : res.schedule.date.toISOString().split('T')[0];

      const start = new Date(`${dateStr}T${res.schedule.startTime}`);
      const end = new Date(start.getTime() + 50 * 60 * 1000);
      const isInProgress = now >= start && now < end;
      const isFinished = now >= end;

      return {
        reservationId: res.id,
        userName: res.user?.account?.name || '알 수 없음',
        time: res.schedule.startTime.slice(0, 5),
        duration: 50,
        isInProgress,
        isFinished,
      };
    });
  }

  // 오늘 예약 전체 조회
  async findTodayReservations(date: string): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: {
        status: 'confirmed',
        schedule: { date: new Date(date) },
      },
      relations: [
        'user',
        'user.account',
        'schedule',
        'schedule.trainer',
        'schedule.trainer.account',
      ],
    });
  }

  // 특정 시간대 예약 조회 (1시간 전 기준)
  async findReservationsBetweenTime(
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: {
        status: 'confirmed',
        schedule: {
          date: new Date(date),
          startTime: Between(startTime + ':00', endTime + ':00'), // 'HH:MM:SS'
        },
      },
      relations: [
        'user',
        'user.account',
        'schedule',
        'schedule.trainer',
        'schedule.trainer.account',
      ],
    });
  }
}

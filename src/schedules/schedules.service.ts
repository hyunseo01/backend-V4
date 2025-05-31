import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from './entities/schedules.entity';
import { Repository } from 'typeorm';
import { Reservation } from '../reservations/entities/reservation.entity';
import { GetAvailableScheduleDto } from './dto/get-available-schedule.dto';
import { AvailableScheduleResponseDto } from './dto/available-schedule-response.dto';
import { Trainer } from '../trainer/entities/trainer.entity';
import { User } from '../users/entities/users.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Trainer)
    private readonly trainerRepository: Repository<Trainer>,
  ) {}

  async getAvailableTimeSlotsByAccount(
    dto: GetAvailableScheduleDto,
    accountId: number,
    role: string,
  ): Promise<AvailableScheduleResponseDto[]> {
    let trainerId: number;

    if (role === 'trainer') {
      const trainer = await this.trainerRepository.findOne({
        where: { accountId },
      });
      if (!trainer) throw new NotFoundException('트레이너 정보가 없습니다.');
      trainerId = trainer.id;
    } else if (role === 'user') {
      const user = await this.userRepository.findOne({
        where: { accountId },
      });
      if (!user || !user.trainerId)
        throw new NotFoundException('배정된 트레이너가 없습니다.');
      trainerId = user.trainerId;
    } else {
      throw new BadRequestException('잘못된 역할입니다.');
    }

    return this.getAvailableTimeSlots(dto, trainerId);
  }

  async getAvailableTimeSlots(
    dto: GetAvailableScheduleDto,
    trainerId: number,
  ): Promise<AvailableScheduleResponseDto[]> {
    const { date } = dto;

    //전체 고정 시간대 (점심시간 제외)
    const fullTimeSlots = [
      '09:00:00',
      '10:00:00',
      '11:00:00',
      '13:00:00',
      '14:00:00',
      '15:00:00',
      '16:00:00',
      '17:00:00',
      '18:00:00',
      '19:00:00',
      '20:00:00',
    ];

    //해당 trainer + date 기준 예약된 시간 조회 (confirmed 상태만)
    const reservations = await this.reservationRepository.find({
      where: {
        status: 'confirmed',
      },
      relations: ['schedule'],
    });

    console.log('전체 예약 목록:');
    for (const r of reservations) {
      console.log({
        userId: r.userId,
        trainerId: r.schedule?.trainerId,
        date: r.schedule?.date,
        startTime: r.schedule?.startTime,
      });
    }

    type ReservedRow = { startTime: string };

    const reserved: ReservedRow[] = await this.reservationRepository
      .createQueryBuilder('r')
      .innerJoin('r.schedule', 's')
      .select('s.startTime', 'startTime')
      .where('r.status = :status', { status: 'confirmed' })
      .andWhere('s.trainerId = :trainerId', { trainerId })
      .andWhere('DATE_FORMAT(s.date, "%Y-%m-%d") = :date', { date })
      .getRawMany();

    const reservedTimes = new Set(reserved.map((row) => row.startTime));

    console.log('예약된 시간들 (raw query):', [...reservedTimes]);

    return fullTimeSlots.map((time) => ({
      time: time.slice(0, 5),
      available: !reservedTimes.has(time),
    }));
  }
}

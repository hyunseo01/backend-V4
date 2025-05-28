import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealRecord } from './entities/meal-record.entity';
import { CreateMealRecordDto } from './dto/create-meal-record.dto';
import { RecordsByDateResponseDto } from '../dto/records-by-date-response.dto';

@Injectable()
export class MealService {
  constructor(
    @InjectRepository(MealRecord)
    private readonly mealRepository: Repository<MealRecord>,
  ) {}

  async createMealRecord(
    accountId: number,
    dto: CreateMealRecordDto,
  ): Promise<void> {
    const record = this.mealRepository.create({ ...dto, accountId });
    await this.mealRepository.save(record);
  }

  async getMealRecordsByDate(
    accountId: number,
    date: string,
  ): Promise<RecordsByDateResponseDto> {
    const records = await this.mealRepository.find({
      where: { accountId, date },
      order: { createdAt: 'ASC' },
    });

    const mapped = records.map((record) => ({
      id: record.id,
      date: record.date,
      memo: record.memo,
      photoUrl: record.photoUrl,
      createdAt: record.createdAt.toISOString(),
    }));

    return { records: mapped };
  }

  async updateMealRecord(
    accountId: number,
    id: number,
    dto: CreateMealRecordDto,
  ): Promise<void> {
    const record = await this.mealRepository.findOneBy({ id });
    if (!record) throw new NotFoundException('식단 기록을 찾을 수 없습니다.');
    if (record.accountId !== accountId)
      throw new ForbiddenException('수정 권한이 없습니다.');

    await this.mealRepository.update(id, dto);
  }

  async deleteMealRecord(accountId: number, id: number): Promise<void> {
    const record = await this.mealRepository.findOneBy({ id });
    if (!record) throw new NotFoundException('식단 기록을 찾을 수 없습니다.');
    if (record.accountId !== accountId)
      throw new ForbiddenException('삭제 권한이 없습니다.');

    await this.mealRepository.delete(id);
  }
}

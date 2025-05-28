import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExerciseRecord } from './entities/exercise-record.entity';
import { CreateExerciseRecordDto } from './dto/create-exercise-record.dto';
import { RecordsByDateResponseDto } from '../dto/records-by-date-response.dto';
@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(ExerciseRecord)
    private readonly exerciseRepository: Repository<ExerciseRecord>,
  ) {}

  async createExerciseRecord(
    accountId: number,
    dto: CreateExerciseRecordDto,
  ): Promise<void> {
    const record = this.exerciseRepository.create({ ...dto, accountId });
    await this.exerciseRepository.save(record);
  }

  async getExerciseRecordsByDate(
    accountId: number,
    date: string,
  ): Promise<RecordsByDateResponseDto> {
    const records = await this.exerciseRepository.find({
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

  async updateExerciseRecord(
    accountId: number,
    id: number,
    dto: CreateExerciseRecordDto,
  ): Promise<void> {
    const record = await this.exerciseRepository.findOneBy({ id });
    if (!record) throw new NotFoundException('운동 기록을 찾을 수 없습니다.');
    if (record.accountId !== accountId)
      throw new ForbiddenException('수정 권한이 없습니다.');

    await this.exerciseRepository.update(id, dto);
  }

  async deleteExerciseRecord(accountId: number, id: number): Promise<void> {
    const record = await this.exerciseRepository.findOneBy({ id });
    if (!record) throw new NotFoundException('운동 기록을 찾을 수 없습니다.');
    if (record.accountId !== accountId)
      throw new ForbiddenException('삭제 권한이 없습니다.');

    await this.exerciseRepository.delete(id);
  }
}

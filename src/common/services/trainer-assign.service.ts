import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer } from '../../trainer/entities/trainer.entity';

@Injectable()
export class TrainerAssignService {
  constructor(
    @InjectRepository(Trainer)
    private readonly trainerRepository: Repository<Trainer>,
  ) {}

  async autoAssignTrainer(): Promise<Trainer> {
    // 트레이너 전체 조회
    const trainers = await this.trainerRepository
      .createQueryBuilder('trainer')
      .leftJoinAndSelect('trainer.account', 'account')
      .leftJoinAndSelect('trainer.users', 'user')
      .where('account.role = :role', { role: 'trainer' })
      .getMany();

    if (trainers.length === 0) {
      throw new BadRequestException('등록된 트레이너가 없습니다.');
    }

    // 모든 트레이너가 유저를 하나도 갖고 있지 않은 경우 → 랜덤 배정
    const hasAssignedUser = trainers.some(
      (trainer) => trainer.users.length > 0,
    );
    if (!hasAssignedUser) {
      const selected = trainers[Math.floor(Math.random() * trainers.length)];
      return selected;
    }

    // 점수 계산 (유저 수 * 3 + 유저들의 ptCount 총합 * 7)
    const scored = trainers.map((trainer) => {
      const userCount = trainer.users.length;
      const totalPtLeft = trainer.users.reduce(
        (sum, user) => sum + (user.ptCount || 0),
        0,
      );
      const score = userCount * 3 + totalPtLeft * 7;
      return {
        trainer,
        score,
      };
    });

    const minScore = Math.min(...scored.map((t) => t.score));
    const candidates = scored.filter((t) => t.score === minScore);

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    return selected.trainer;
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/baseTime.entity';
import { Trainer } from '../../trainer/entities/trainer.entity';

@Entity('schedules')
export class Schedule extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  //스케줄 담당 트레이너
  @ManyToOne(() => Trainer, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'trainerId' })
  trainer: Trainer;

  @Column({ nullable: true })
  trainerId: number;

  //날짜 정보
  @Column({ type: 'date' })
  date: Date;

  //시작 시간
  @Column({ type: 'time' })
  startTime: string;
}

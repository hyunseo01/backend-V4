import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/baseTime.entity';
import { User } from '../../users/entities/users.entity';
import { Trainer } from '../../trainer/entities/trainer.entity';

@Entity('chats')
export class Chat extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => Trainer, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'trainerId' })
  trainer: Trainer;

  @Column({ nullable: true })
  trainerId: number;
}

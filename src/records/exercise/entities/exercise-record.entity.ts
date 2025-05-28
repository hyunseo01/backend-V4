import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTimeEntity } from '../../../common/entities/baseTime.entity';
import { Account } from '../../../account/entities/account.entity';

@Entity('exercise_records')
export class ExerciseRecord extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accountId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text' })
  memo: string;

  @Column({ nullable: true })
  photoUrl: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;
}

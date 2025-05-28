import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTimeEntity } from '../../../common/entities/baseTime.entity';
import { Account } from '../../../account/entities/account.entity';

@Entity('meal_records')
export class MealRecord extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accountId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text' })
  memo: string;

  @Column({ nullable: true })
  photoUrl: string; // S3 주소

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;
}

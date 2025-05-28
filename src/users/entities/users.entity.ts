import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/baseTime.entity';
import { Account } from '../../account/entities/account.entity';
import { Trainer } from '../../trainer/entities/trainer.entity';

@Entity('users')
export class User extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  //Account 1:1 연결
  @OneToOne(() => Account, { cascade: true, eager: true })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  accountId: number;

  //배정된 트레이너 (N:1)
  @ManyToOne(() => Trainer, (trainer) => trainer.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'trainerId' })
  trainer?: Trainer | null;

  @Column({ nullable: true })
  trainerId?: number | null;

  @Column({ type: 'int', default: 30 })
  ptCount: number;

  @Column({ default: false })
  isDeleted: boolean;
}

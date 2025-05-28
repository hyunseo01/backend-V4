import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Column,
} from 'typeorm';
import { Account } from '../../account/entities/account.entity';
import { BaseTimeEntity } from '../../common/entities/baseTime.entity';
import { User } from '../../users/entities/users.entity';

@Entity('trainers')
export class Trainer extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  //Account 연결 (1:1)
  @OneToOne(() => Account, { cascade: true, eager: true })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  accountId: number;

  //이 트레이너가 담당하는 유저들
  @OneToMany(() => User, (user): Trainer | null | undefined => user.trainer)
  users: User[];
}

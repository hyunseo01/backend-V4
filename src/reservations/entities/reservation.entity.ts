import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/baseTime.entity';
import { User } from '../../users/entities/users.entity';
import { Schedule } from '../../schedules/entities/schedules.entity';
@Entity('reservations')
export class Reservation extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: number;

  //연결된 스케줄 (트레이너/시간 포함)
  @ManyToOne(() => Schedule, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'scheduleId' })
  schedule: Schedule;

  @Column({ nullable: true })
  scheduleId: number;

  //예약 상태
  @Column({ default: 'pending' })
  status: string;
}

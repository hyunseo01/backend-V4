import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/baseTime.entity';
import { Account } from '../../account/entities/account.entity';

export enum NotificationType {
  RESERVATION = 'reservation',
  CHAT = 'chat',
  RECORD = 'record',
}

@Entity('notifications')
export class Notification extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;
  //알림 수신자 (User 또는 Trainer)
  @ManyToOne(() => Account, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ nullable: true })
  accountId: number;

  //알림 타입
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  //알림 내용
  @Column({ type: 'text' })
  content: string;

  //읽음 여부
  @Column({ default: false })
  isRead: boolean;
}

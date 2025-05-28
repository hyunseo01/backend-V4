import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/baseTime.entity';
import { Chat } from '../../chats/entities/chats.entity';
import { Account } from '../../account/entities/account.entity';

@Entity('messages')
export class Message extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  //채팅방 ID
  @ManyToOne(() => Chat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatId' })
  chat: Chat;

  @Column()
  chatId: number;

  //메시지 작성자 (Account 기준 - 유저, 트레이너, 챗봇)
  @ManyToOne(() => Account, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'senderId' })
  sender: Account;

  @Column({ nullable: true })
  senderId: number;

  @Column({ type: 'text' })
  content: string;

  //읽음 여부 (트레이너/유저 기준에서 활용 가능)
  @Column({ default: false })
  isRead: boolean;

  //시스템 메시지 여부 (ex. 챗봇 자동 메시지)
  @Column({ default: false })
  isSystem: boolean;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/baseTime.entity';
import { User } from '../../users/entities/users.entity';

@Entity('profiles')
export class Profile extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true, length: 10 })
  gender: string;

  @Column({ nullable: true, type: 'float' })
  height: number;

  @Column({ nullable: true, type: 'float' })
  weight: number;

  @Column({ nullable: true, type: 'text' })
  memo: string;

  @Column({ nullable: true, type: 'text' })
  photoUrl: string | null;
}

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../common/interfaces/user-role.type';
import { BaseTimeEntity } from '../../common/entities/baseTime.entity';

@Entity('accounts')
export class Account extends BaseTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string | null;

  @Column({ type: 'varchar', length: 100 })
  password: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'enum', enum: ['user', 'trainer'] })
  role: UserRole;

  @Column({ nullable: true })
  expoPushToken: string;

  @Column({ default: false })
  firstLoginNotified: boolean;
}

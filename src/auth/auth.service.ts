import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Account } from '../account/entities/account.entity';
import { User } from '../users/entities/users.entity';
import { Trainer } from '../trainer/entities/trainer.entity';
import { TrainerAssignService } from '../common/services/trainer-assign.service';
import { SignupUserDto } from './dto/signup-user.dto';
import { SignupTrainerDto } from './dto/signup-trainer.dto';
import { SigninDto } from './dto/signin.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { Chat } from '../chats/entities/chats.entity';
import { UserRole } from '../common/interfaces/user-role.type';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Trainer)
    private readonly trainerRepository: Repository<Trainer>,
    private readonly jwtService: JwtService,
    private readonly trainerAssignService: TrainerAssignService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(payload: { sub: number; role: string }): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') ?? '3600s',
    });
  }

  generateRefreshToken(payload: { sub: number; role: string }): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn:
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d',
    });
  }

  async signupUser(dto: SignupUserDto) {
    try {
      return await this.dataSource.transaction(
        async (manager: EntityManager) => {
          const accountRepo: Repository<Account> =
            manager.getRepository(Account);
          const userRepo: Repository<User> = manager.getRepository(User);

          const exists = await accountRepo.findOneBy({ email: dto.email });
          if (exists)
            throw new ConflictException('이미 존재하는 이메일입니다.');

          const hashed = await bcrypt.hash(dto.password, 10);
          const account = accountRepo.create({
            email: dto.email,
            password: hashed,
            name: dto.name,
            role: 'user',
          });
          await accountRepo.save(account);

          const trainer = await this.trainerAssignService.autoAssignTrainer();

          const user = userRepo.create({
            account,
            trainer,
            ptCount: 30,
          });
          await userRepo.save(user);

          const chatRepo = manager.getRepository(Chat);
          const chat = chatRepo.create({
            userId: user.id,
            trainerId: trainer.id,
          });
          await chatRepo.save(chat);

          return { message: '회원가입 완료' };
        },
      );
    } catch (err: unknown) {
      if (
        err instanceof ConflictException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }

      if (err instanceof Error) {
        console.error('회원가입 실패:', err.message);
      } else {
        console.error('회원가입 실패: 알 수 없는 오류');
      }

      throw new InternalServerErrorException(
        '회원가입 중 오류가 발생했습니다.',
      );
    }
  }

  async signupTrainer(dto: SignupTrainerDto) {
    const exists = await this.accountRepository.findOneBy({ email: dto.email });
    if (exists) throw new ConflictException('이미 존재하는 이메일입니다.');

    const hashed = await bcrypt.hash(dto.password, 10);

    const account = this.accountRepository.create({
      email: dto.email,
      password: hashed,
      name: dto.name,
      role: 'trainer',
    });
    await this.accountRepository.save(account);

    const trainer = this.trainerRepository.create({ account });
    await this.trainerRepository.save(trainer);

    return { success: true, message: '트레이너 등록 완료' };
  }

  async signin(dto: SigninDto) {
    const account = await this.accountRepository.findOneBy({
      email: dto.email,
    });
    if (!account) throw new UnauthorizedException('이메일이 틀렸습니다.');

    if (account.role !== dto.role) {
      throw new UnauthorizedException(
        `해당 계정은 ${account.role}입니다. ${dto.role} 페이지에서 로그인할 수 없습니다.`,
      );
    }

    const isMatch = await bcrypt.compare(dto.password, account.password);
    if (!isMatch) throw new UnauthorizedException('비밀번호가 틀렸습니다.');

    const payload = { sub: account.id, role: account.role };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      message: '로그인 성공',
      data: {
        accessToken,
        refreshToken,
        accountId: account.id,
        role: account.role,
      },
    };
  }

  async updatePassword(accountId: number, dto: UpdatePasswordDto) {
    const account = await this.accountRepository.findOneBy({ id: accountId });
    if (!account) throw new BadRequestException('계정을 찾을 수 없습니다.');

    const isMatch = await bcrypt.compare(dto.oldPassword, account.password);
    if (!isMatch) throw new BadRequestException('기존 비밀번호가 틀렸습니다.');

    if (dto.newPassword !== dto.confirmPassword)
      throw new BadRequestException('비밀번호가 일치하지 않습니다.');

    account.password = await bcrypt.hash(dto.newPassword, 10);
    await this.accountRepository.save(account);

    return { message: '비밀번호가 변경되었습니다.' };
  }

  async withdraw(
    accountId: number,
    role: UserRole,
  ): Promise<{ message: string }> {
    if (role !== 'user') {
      throw new ForbiddenException('회원만 탈퇴할 수 있습니다.');
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const accountRepo = manager.getRepository(Account);

        const user = await userRepo.findOne({
          where: { accountId },
          relations: ['account'],
        });

        if (!user) {
          throw new NotFoundException('사용자를 찾을 수 없습니다.');
        }

        // 탈퇴 처리
        user.isDeleted = true;
        user.ptCount = 0;
        user.trainerId = null;
        user.trainer = null;

        user.account.name = '탈퇴한 회원';
        user.account.email = `deleted_${accountId}@example.com`;

        await accountRepo.save(user.account);
        await userRepo.save(user);
      });

      return { message: '회원 탈퇴가 완료되었습니다.' };
    } catch (err) {
      console.error('회원 탈퇴 트랜잭션 실패:', err);
      throw new InternalServerErrorException(
        '회원 탈퇴 중 오류가 발생했습니다.',
      );
    }
  }

  async reissueAccessToken(refreshToken: string): Promise<string> {
    try {
      const payload = this.jwtService.verify<{ sub: number; role: string }>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      return Promise.resolve(
        this.generateAccessToken({ sub: payload.sub, role: payload.role }),
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('리프레시 토큰 오류:', err.message);
      }
      throw new UnauthorizedException(
        'Refresh token이 유효하지 않거나 만료되었습니다.',
      );
    }
  }
}

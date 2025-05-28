import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { User } from '../users/entities/users.entity';
import { Trainer } from '../trainer/entities/trainer.entity';
import { ProfileInfoDto } from './dto/profile-info.dto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  getImageKey,
  validateImageFile,
} from '../common/utils/validate-image.util';

const DEFAULT_PROFILE_IMAGE =
  'https://i.pinimg.com/236x/f4/4c/b9/f44cb9b5f64a60d95b78b3187f459ccd.jpg';

function createS3Client(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION ?? '',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
  });
}

@Injectable()
export class ProfileService {
  private readonly s3: S3Client;

  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Trainer)
    private readonly trainerRepository: Repository<Trainer>,
  ) {
    this.s3 = createS3Client();
  }

  private async getActiveUserByAccountId(accountId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { accountId, isDeleted: false },
      relations: ['account'],
    });
    if (!user) throw new NotFoundException('유저 정보가 없습니다.');
    return user;
  }

  private async getActiveTrainerByAccountId(
    accountId: number,
  ): Promise<Trainer> {
    const trainer = await this.trainerRepository.findOne({
      where: { accountId },
      relations: ['account'],
    });
    if (!trainer) throw new NotFoundException('트레이너 정보가 없습니다.');
    return trainer;
  }

  // 유저 홈 정보
  async getUserHome(accountId: number) {
    const user = await this.getActiveUserByAccountId(accountId);
    const profile = await this.profileRepository.findOne({
      where: { userId: user.id },
    });

    const createdAt = user.account.createdAt;
    const today = new Date();
    const joinedDays = Math.floor(
      (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      name: user.account.name,
      height: profile?.height ?? null,
      weight: profile?.weight ?? null,
      photoUrl: profile?.photoUrl ?? DEFAULT_PROFILE_IMAGE,
      ptCount: user.ptCount,
      joinedDays,
    };
  }

  // 프로필 테이블 조회
  async getProfileInfo(accountId: number) {
    const user = await this.getActiveUserByAccountId(accountId);
    const profile = await this.profileRepository.findOne({
      where: { userId: user.id },
    });

    const trainer = user.trainerId
      ? await this.trainerRepository.findOne({
          where: { id: user.trainerId },
          relations: ['account'],
        })
      : null;

    return {
      name: user.account.name,
      age: profile?.age ?? null,
      gender: profile?.gender ?? null,
      height: profile?.height ?? null,
      weight: profile?.weight ?? null,
      memo: profile?.memo ?? null,
      photoUrl: profile?.photoUrl ?? DEFAULT_PROFILE_IMAGE,
      trainerName: trainer?.account.name ?? null,
    };
  }

  // 프로필 최초 생성
  async createProfile(
    accountId: number,
    dto: ProfileInfoDto,
  ): Promise<Profile> {
    const user = await this.getActiveUserByAccountId(accountId);

    const exists = await this.profileRepository.findOneBy({ userId: user.id });
    if (exists) throw new ConflictException('이미 등록된 프로필이 있습니다.');

    const profile = this.profileRepository.create({ ...dto, userId: user.id });
    return this.profileRepository.save(profile);
  }

  // 이름, 키, 몸무게 수정
  async updateProfile(
    accountId: number,
    dto: ProfileInfoDto,
  ): Promise<Profile> {
    const user = await this.getActiveUserByAccountId(accountId);

    if (dto.name) {
      user.account.name = dto.name;
      await this.userRepository.save(user);
    }

    const profile = await this.profileRepository.findOneBy({ userId: user.id });
    if (!profile) throw new NotFoundException('프로필이 없습니다.');

    Object.assign(profile, dto);
    return this.profileRepository.save(profile);
  }

  // 사진 업로드 또는 삭제(null)
  async updatePhoto(
    accountId: number,
    file: Express.Multer.File | null,
  ): Promise<Profile> {
    const user = await this.getActiveUserByAccountId(accountId);
    const profile = await this.profileRepository.findOneBy({ userId: user.id });
    if (!profile) throw new NotFoundException('프로필이 없습니다.');

    if (!file) {
      profile.photoUrl = null;
      return this.profileRepository.save(profile);
    }

    validateImageFile(file);
    const key = getImageKey('profile', user.id, file.originalname);

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET ?? '',
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.uploadToS3(command);

    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    profile.photoUrl = url;
    return this.profileRepository.save(profile);
  }

  // 트레이너 간단 정보 (기본 이미지 사용)
  async getTrainerInfo(accountId: number) {
    const trainer = await this.getActiveTrainerByAccountId(accountId);

    return {
      name: trainer.account.name,
      photoUrl: DEFAULT_PROFILE_IMAGE,
    };
  }

  private async uploadToS3(command: PutObjectCommand): Promise<void> {
    try {
      await this.s3.send(command);
    } catch (err: unknown) {
      console.error(
        'S3 업로드 실패:',
        err instanceof Error ? err.message : err,
      );
      throw new BadRequestException('이미지 업로드 중 오류 발생');
    }
  }
}

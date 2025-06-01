import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealRecord } from './entities/meal-record.entity';
import { CreateMealRecordDto } from './dto/create-meal-record.dto';
import { RecordsByDateResponseDto } from '../dto/records-by-date-response.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface OpenAIApiResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

@Injectable()
export class MealService {
  constructor(
    @InjectRepository(MealRecord)
    private readonly mealRepository: Repository<MealRecord>,
    private readonly httpService: HttpService,
  ) {}

  async createMealRecord(
    accountId: number,
    dto: CreateMealRecordDto,
  ): Promise<void> {
    const record = this.mealRepository.create({ ...dto, accountId });
    await this.mealRepository.save(record);
  }

  async getMealRecordsByDate(
    accountId: number,
    date: string,
  ): Promise<RecordsByDateResponseDto> {
    const records = await this.mealRepository.find({
      where: { accountId, date },
      order: { createdAt: 'ASC' },
    });

    const mapped = records.map((record) => ({
      id: record.id,
      date: record.date,
      memo: record.memo,
      photoUrl: record.photoUrl,
      createdAt: record.createdAt.toISOString(),
    }));

    return { records: mapped };
  }

  async updateMealRecord(
    accountId: number,
    id: number,
    dto: CreateMealRecordDto,
  ): Promise<void> {
    const record = await this.mealRepository.findOneBy({ id });
    if (!record) throw new NotFoundException('식단 기록을 찾을 수 없습니다.');
    if (record.accountId !== accountId)
      throw new ForbiddenException('수정 권한이 없습니다.');

    await this.mealRepository.update(id, dto);
  }

  async deleteMealRecord(accountId: number, id: number): Promise<void> {
    const record = await this.mealRepository.findOneBy({ id });
    if (!record) throw new NotFoundException('식단 기록을 찾을 수 없습니다.');
    if (record.accountId !== accountId)
      throw new ForbiddenException('삭제 권한이 없습니다.');

    await this.mealRepository.delete(id);
  }

  async analyzeMealImage(imageUrl: string): Promise<string> {
    try {
      const prompt = `
이 이미지를 보고 음식 종류를 추정하고, 예상 칼로리도 함께 알려줘.
형식은 꼭 아래 예시처럼 해줘:
"김치찌개, 공깃밥, 김 – 총 720kcal로 추정됩니다."

주의사항:
- 너무 장황하게 설명하지 마.
- 반드시 음식 이름들과 칼로리만 알려줘.
- 한 문장으로 간결하게 말해줘. 
`;

      const response = await firstValueFrom(
        this.httpService.post<OpenAIApiResponse>(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: '너는 영양 분석 전문가야.' },
              { role: 'user', content: prompt },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageUrl,
                    },
                  },
                ],
              },
            ],
            temperature: 0.5,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
          },
        ),
      );

      const result = response.data.choices?.[0]?.message?.content;
      if (!result) {
        throw new Error('GPT 응답이 비어 있습니다.');
      }

      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error('Unknown error:', error);
      }

      console.error('Unknown error:', error);
      throw new InternalServerErrorException('알 수 없는 오류가 발생했습니다.');
    }
  }
}

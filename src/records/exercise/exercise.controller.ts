import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Req,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RecordsByDateResponseDto } from '../dto/records-by-date-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/current-user.decorator';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { CreateExerciseRecordDto } from './dto/create-exercise-record.dto';

@ApiTags('Exercise Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
@Controller('records/exercise')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Post()
  @ApiOperation({ summary: '운동 기록 생성' })
  async createExerciseRecord(
    @Req() req: RequestWithUser,
    @Body() dto: CreateExerciseRecordDto,
  ): Promise<{ message: string; data: null }> {
    await this.exerciseService.createExerciseRecord(req.user.userId, dto);
    return {
      message: '운동 기록이 성공적으로 등록되었습니다.',
      data: null,
    };
  }

  @Get()
  @ApiOperation({ summary: '운동 기록 조회 (날짜별)' })
  @ApiQuery({
    name: 'date',
    required: true,
    description: '조회할 날짜 (YYYY-MM-DD)',
  })
  @ApiOkResponse({ type: RecordsByDateResponseDto })
  async getExerciseRecords(
    @Req() req: RequestWithUser,
    @Query('date') date: string,
  ): Promise<{ message: string; data: RecordsByDateResponseDto }> {
    const data = await this.exerciseService.getExerciseRecordsByDate(
      req.user.userId,
      date,
    );
    return {
      message: '운동 기록 조회 성공',
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '운동 기록 수정' })
  async updateExerciseRecord(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateExerciseRecordDto,
  ): Promise<{ message: string; data: null }> {
    await this.exerciseService.updateExerciseRecord(req.user.userId, id, dto);
    return {
      message: '운동 기록이 성공적으로 수정되었습니다.',
      data: null,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '운동 기록 삭제' })
  async deleteExerciseRecord(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string; data: null }> {
    await this.exerciseService.deleteExerciseRecord(req.user.userId, id);
    return {
      message: '운동 기록이 성공적으로 삭제되었습니다.',
      data: null,
    };
  }
}

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
import { MealService } from './meal.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RecordsByDateResponseDto } from '../dto/records-by-date-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/current-user.decorator';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { CreateMealRecordDto } from './dto/create-meal-record.dto';

@ApiTags('Meal Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
@Controller('records/meal')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post()
  @ApiOperation({ summary: '식단 기록 생성' })
  createMealRecord(
    @Req() req: RequestWithUser,
    @Body() dto: CreateMealRecordDto,
  ): Promise<void> {
    return this.mealService.createMealRecord(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '식단 기록 조회 (날짜별)' })
  getMealRecords(
    @Req() req: RequestWithUser,
    @Query('date') date: string,
  ): Promise<RecordsByDateResponseDto> {
    return this.mealService.getMealRecordsByDate(req.user.userId, date);
  }

  @Patch(':id')
  @ApiOperation({ summary: '식단 기록 수정' })
  updateMealRecord(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMealRecordDto,
  ): Promise<void> {
    return this.mealService.updateMealRecord(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '식단 기록 삭제' })
  deleteMealRecord(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.mealService.deleteMealRecord(req.user.userId, id);
  }
}

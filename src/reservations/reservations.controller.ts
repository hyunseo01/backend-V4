import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/current-user.decorator';
import { ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { ReservationsService } from './reservations.service';
import { GetMyReservationsResponseDto } from './dto/get-my-reservations-response.dto';
import { TrainerReservationDto } from './dto/get-trainer-reservations-response.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @ApiOperation({ summary: '예약 생성' })
  async createReservation(
    @Body() dto: CreateReservationDto,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string; data: null }> {
    await this.reservationsService.createReservation(dto, req.user.userId);
    return {
      message: '예약이 성공적으로 완료되었습니다.',
      data: null,
    };
  }
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'trainer')
  @ApiOperation({ summary: '예약 취소 (유저/트레이너)' })
  async cancelReservation(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.reservationsService.cancelReservation(
      id,
      req.user.userId,
      req.user.role,
    );
    return { message: '예약이 성공적으로 취소되었습니다.' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Get('my')
  @ApiOperation({ summary: '유저 본인의 오늘/예정 예약 목록 조회' })
  @ApiOkResponse({ type: GetMyReservationsResponseDto })
  async getMyReservations(
    @Req() req: RequestWithUser,
  ): Promise<GetMyReservationsResponseDto> {
    return this.reservationsService.getMyReservations(req.user.userId);
  }

  @Get('trainer/today')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('trainer')
  @ApiOperation({ summary: '트레이너 오늘 예약 목록 조회' })
  async getTrainerTodayReservations(
    @Req() req: RequestWithUser,
  ): Promise<{ message: string; data: TrainerReservationDto[] }> {
    const today = new Date().toISOString().split('T')[0];
    const data = await this.reservationsService.getTrainerReservations(
      req.user.userId,
      today,
    );
    return {
      message: '트레이너 오늘 예약 목록 조회 성공',
      data,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('trainer')
  @Get('trainer')
  @ApiOperation({ summary: '트레이너용 특정 날짜 예약 목록 조회' })
  @ApiQuery({
    name: 'date',
    required: true,
    description: '조회할 날짜 (YYYY-MM-DD)',
  })
  @ApiOkResponse({ type: [TrainerReservationDto] }) // Swagger 표시는 유지
  async getTrainerReservations(
    @Query('date') date: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string; data: TrainerReservationDto[] }> {
    const data = await this.reservationsService.getTrainerReservations(
      req.user.userId,
      date,
    );
    return {
      message: '트레이너 예약 목록 조회 성공',
      data,
    };
  }
}

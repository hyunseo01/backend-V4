import { ApiProperty } from '@nestjs/swagger';

export class ReservationInfoDto {
  reservationId: number;
  trainerName: string;
  date: string;
  time: string;
  duration: number; // 50
  isInProgress: boolean; // 11:00 <= now < 11:50
  isFinished: boolean; // now >= 11:50
}

//유저 예약화면 응답용 dto
export class GetMyReservationsResponseDto {
  @ApiProperty({ type: [ReservationInfoDto] })
  today: ReservationInfoDto[];

  @ApiProperty({ type: [ReservationInfoDto] })
  upcoming: ReservationInfoDto[];
}

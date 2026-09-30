import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  IsIn,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { EpisodesService } from './episodes.service';

class CreateEpisodeDto {
  @IsString()
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsISO8601()
  onsetDate?: string;

  @IsOptional()
  @IsString()
  onsetCertainty?: string;
}

class AddEventDto {
  @IsIn(['报告', '症状', '医嘱', '行动', '结局'])
  eventType!: string;

  @IsISO8601()
  occurredAt!: string;

  @IsIn(['自述', '报告原文', '医生记录'])
  sourceType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  rawText?: string;

  @IsOptional()
  @IsIn(['已确认', '尚未确认', '有冲突'])
  verifyStatus?: string;
}

class CorrectEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  rawText?: string;

  @IsOptional()
  @IsIn(['已确认', '尚未确认', '有冲突'])
  verifyStatus?: string;
}

class AddSymptomLogDto {
  @IsISO8601()
  occurredAt!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sitMinutes?: number;

  @IsOptional()
  @IsString()
  plannedActivityDone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  sleepImpact?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  topWorry?: string;

  @IsOptional()
  @IsIn(['有', '没有', '尚未确认'])
  legChange?: string;
}

@Controller('episodes')
@UseGuards(AuthGuard)
export class EpisodesController {
  constructor(private readonly episodes: EpisodesService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.episodes.listEpisodes(user.userId);
  }

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateEpisodeDto) {
    return this.episodes.createEpisode(user.userId, dto.title, dto.onsetDate ?? null, dto.onsetCertainty ?? '尚未确认');
  }

  @Get(':id')
  detail(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.episodes.getEpisode(user.userId, id);
  }

  @Get(':id/events')
  listEvents(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.episodes.listEvents(user.userId, id);
  }

  @Post(':id/events')
  addEvent(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: AddEventDto) {
    return this.episodes.addEvent(user.userId, id, dto);
  }

  @Put('events/:eventId')
  correctEvent(@CurrentUser() user: { userId: string }, @Param('eventId') eventId: string, @Body() dto: CorrectEventDto) {
    return this.episodes.correctEvent(user.userId, eventId, dto);
  }

  @Delete('events/:eventId')
  deleteEvent(@CurrentUser() user: { userId: string }, @Param('eventId') eventId: string) {
    return this.episodes.deleteEvent(user.userId, eventId);
  }

  @Get(':id/timeline')
  timeline(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.episodes.timeline(user.userId, id);
  }

  @Get(':id/symptom-logs')
  listSymptomLogs(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.episodes.listSymptomLogs(user.userId, id);
  }

  @Post(':id/symptom-logs')
  addSymptomLog(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: AddSymptomLogDto) {
    return this.episodes.addSymptomLog(user.userId, id, dto);
  }
}

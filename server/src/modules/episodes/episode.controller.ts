import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { EpisodeService } from './episode.service';
import { CreateEpisodeDto, CreateCareEventDto, CreateSymptomLogDto, UpdateCareEventDto } from './dto/episode.dto';

@Controller('episodes')
@UseGuards(AuthGuard)
export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) {}

  @Post()
  createEpisode(@Req() req: any, @Body() dto: CreateEpisodeDto) {
    return this.episodeService.createEpisode(req.user.userId, dto);
  }

  @Get()
  getEpisodes(@Req() req: any) {
    return this.episodeService.getEpisodes(req.user.userId);
  }

  @Get(':id')
  getEpisode(@Param('id') id: string, @Req() req: any) {
    return this.episodeService.getEpisode(id, req.user.userId);
  }

  @Get(':id/events')
  getCareEvents(@Param('id') id: string, @Req() req: any) {
    return this.episodeService.getCareEvents(id, req.user.userId);
  }

  @Post('events')
  createCareEvent(@Req() req: any, @Body() dto: CreateCareEventDto) {
    return this.episodeService.createCareEvent(req.user.userId, dto);
  }

  @Put('events/:eventId')
  updateCareEvent(@Param('eventId') eventId: string, @Req() req: any, @Body() dto: UpdateCareEventDto) {
    return this.episodeService.updateCareEvent(eventId, req.user.userId, dto);
  }

  @Delete('events/:eventId')
  deleteCareEvent(@Param('eventId') eventId: string, @Req() req: any) {
    return this.episodeService.deleteCareEvent(eventId, req.user.userId);
  }

  @Post('symptom-logs')
  createSymptomLog(@Req() req: any, @Body() dto: CreateSymptomLogDto) {
    return this.episodeService.createSymptomLog(req.user.userId, dto);
  }

  @Get(':id/timeline')
  getTimeline(@Param('id') id: string, @Req() req: any) {
    return this.episodeService.getTimeline(id, req.user.userId);
  }
}

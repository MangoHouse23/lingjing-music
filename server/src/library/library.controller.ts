import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { LibraryService } from './library.service';
import { SongPayload } from './song.payload';

@Controller('library')
export class LibraryController {
  constructor(private lib: LibraryService) {}

  @Get('overview')
  async overview() {
    const [playlists, stats] = await Promise.all([this.lib.listPlaylists(), this.lib.stats()]);
    return { playlists, stats };
  }

  /* 歌单 */
  @Get('playlists')
  playlists() {
    return this.lib.listPlaylists();
  }

  @Get('playlists/:id')
  playlist(@Param('id') id: string) {
    return this.lib.getPlaylist(Number(id));
  }

  @Post('playlists')
  createPlaylist(@Body() body: { name: string; desc?: string; cover?: string; tint?: string }) {
    return this.lib.createPlaylist({ name: body.name || '未命名歌单', desc: body.desc, cover: body.cover, tint: body.tint });
  }

  @Patch('playlists/:id')
  updatePlaylist(@Param('id') id: string, @Body() body: { name?: string; desc?: string }) {
    return this.lib.updatePlaylist(Number(id), body);
  }

  @Delete('playlists/:id')
  deletePlaylist(@Param('id') id: string) {
    return this.lib.deletePlaylist(Number(id));
  }

  @Post('playlists/:id/tracks')
  addTracks(@Param('id') id: string, @Body() body: { songs: SongPayload[] }) {
    return this.lib.addTracks(Number(id), body?.songs ?? []);
  }

  @Delete('playlists/:id/tracks/:trackId')
  removeTrack(@Param('id') id: string, @Param('trackId') trackId: string) {
    return this.lib.removeTrack(Number(id), Number(trackId));
  }

  /* 我喜欢 */
  @Get('liked')
  liked() {
    return this.lib.listLiked();
  }

  @Post('liked')
  like(@Body() body: SongPayload) {
    return this.lib.likeSong(body);
  }

  @Delete('liked/:key')
  unlike(@Param('key') key: string) {
    return this.lib.unlikeSong(key);
  }

  /* 播放历史 */
  @Get('history')
  history(@Query('limit') limit?: string) {
    return this.lib.listHistory(Number(limit) || 100);
  }

  @Post('history')
  addHistory(@Body() body: SongPayload) {
    return this.lib.addHistory(body);
  }

  @Delete('history')
  clearHistory() {
    return this.lib.clearHistory();
  }

  /* 设置 */
  @Get('settings')
  settings() {
    return this.lib.getSettings();
  }

  @Put('settings')
  putSettings(@Body() body: { value: any }) {
    return this.lib.putSettings(body?.value ?? {});
  }
}

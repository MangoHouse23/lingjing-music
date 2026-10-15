import { Body, Controller, Get, Headers, HttpException, Param, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { MusicService, SongSpec } from './music.service';

@Controller('music')
export class MusicController {
  constructor(private music: MusicService) {}

  /** 音源列表与健康度 */
  @Get('sources')
  sources() {
    return this.music.sources();
  }

  /** 聚合搜索 */
  @Get('search')
  async search(@Query('keyword') keyword: string, @Query('sources') sources?: string, @Query('limit') limit?: string) {
    return this.music.search(
      keyword || '',
      sources ? sources.split(',').filter(Boolean) : undefined,
      Math.min(Number(limit) || 20, 50),
    );
  }

  /** 播放直链（多来源依次尝试 + 跨源搜索兜底） */
  @Get('url')
  async url(@Query('songs') songsJson: string, @Query('br') br?: string) {
    let specs: SongSpec[];
    try {
      specs = JSON.parse(songsJson || '[]');
    } catch {
      throw new HttpException('songs 参数格式错误', 400);
    }
    if (!Array.isArray(specs) || !specs.length) throw new HttpException('缺少 songs 参数', 400);
    return this.music.getUrl(specs, Math.min(Number(br) || 320, 999));
  }

  /** 歌词（原始 LRC + 翻译） */
  @Get('lyric')
  async lyric(@Query('source') source: string, @Query('songId') songId: string) {
    return this.music.getLyric(source || '', songId || '');
  }

  /** 封面地址（按歌曲源 ID 惰性获取） */
  @Get('pic')
  async pic(@Query('source') source: string, @Query('songId') songId: string, @Query('size') size?: string) {
    return this.music.getPic(source || '', songId || '', Math.min(Number(size) || 300, 1300));
  }

  /** 编辑精选歌单库（列表） */
  @Get('editor')
  editorList() {
    return this.music.editorList();
  }

  /** 编辑精选歌单详情（关键词聚合） */
  @Get('editor/:id')
  editorDetail(@Param('id') id: string) {
    return this.music.editorDetail(id);
  }

  /** 每日推荐（ratio: 熟悉占比 0-1） */
  @Get('daily')
  daily(@Query('ratio') ratio?: string, @Query('count') count?: string) {
    return this.music.daily(Number(ratio) || 0.7, Math.min(Number(count) || 24, 50));
  }

  /** 情绪电台 */
  @Get('radio/:mood')
  radio(@Param('mood') mood: string) {
    return this.music.radio(mood);
  }

  /** 新歌速递 */
  @Get('new')
  newSongs(@Query('limit') limit?: string) {
    return this.music.newSongs(Math.min(Number(limit) || 12, 30));
  }

  /** 导入向导：解析分享链接 */
  @Post('import/resolve')
  async resolvePlaylist(@Body() body: { link?: string }) {
    return this.music.resolvePlaylist(body?.link || '');
  }

  /** 图片代理（解决外链封面 CORS，供前端取色） */
  @Get('proxy/image')
  async image(@Query('url') url: string, @Res() res: Response) {
    const img = await this.music.proxyImage(url || '');
    if (!img) throw new HttpException('图片获取失败', 404);
    res.setHeader('Content-Type', img.ct);
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.send(img.buf);
  }

  /** 音频代理（流式透传 + Range，供 Web Audio 频谱跨域使用） */
  @Get('proxy/audio')
  async audio(@Query('url') url: string, @Headers('range') range: string | undefined, @Res() res: Response) {
    const out = await this.music.proxyAudio(url || '', range);
    if (!out) throw new HttpException('音频获取失败', 404);
    res.status(out.status as any);
    for (const [k, v] of Object.entries(out.headers)) res.setHeader(k, v);
    res.setHeader('Cache-Control', 'no-store');
    res.send(Buffer.from(out.buf));
  }
}

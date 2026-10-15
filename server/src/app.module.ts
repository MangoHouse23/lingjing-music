import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MusicModule } from './music/music.module';
import { LibraryModule } from './library/library.module';

@Module({
  imports: [PrismaModule, MusicModule, LibraryModule],
})
export class AppModule {}

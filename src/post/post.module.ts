import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { RssCrawlerModule } from '../../libs/rss-crawler/src';
import { CategoryModule } from '../category/category.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [RssCrawlerModule, CategoryModule],
  controllers: [PostController],
  providers: [PostService, PrismaService]
})
export class PostModule {}

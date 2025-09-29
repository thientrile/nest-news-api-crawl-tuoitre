import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RssCrawlerModule } from '../../libs/rss-crawler/src';

@Module({
  imports: [RssCrawlerModule],
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService],
  exports: [CategoryService]
})
export class CategoryModule {}

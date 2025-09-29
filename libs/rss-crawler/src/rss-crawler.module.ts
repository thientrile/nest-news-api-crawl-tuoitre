import { Module } from '@nestjs/common';
import { RssCrawlerService } from './rss-crawler.service';

@Module({
  providers: [RssCrawlerService],
  exports: [RssCrawlerService]
})
export class RssCrawlerModule {}

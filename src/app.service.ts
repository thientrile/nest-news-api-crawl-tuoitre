import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy
} from '@nestjs/common';
import { PostService } from './post/post.service';

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppService.name);
  private crawlInterval: NodeJS.Timeout;

  constructor(private readonly postService: PostService) {}

  onModuleInit() {
    this.logger.log('AppService initialized');
    this.startAutoCrawling();
  }

  private startAutoCrawling() {
    // Start auto-crawling every 5 minutes
    this.crawlInterval = setInterval(
      () => {
        void this.performCrawling();
      },
      5 * 60 * 1000
    ); // 5 minutes

    this.logger.log('Auto-crawling started (every 5 minutes)');
  }

  private async performCrawling() {
    try {
      this.logger.log('Starting scheduled RSS crawling...');
      await this.postService.crawl();
      this.logger.log('Scheduled RSS crawling completed successfully');
    } catch (error) {
      this.logger.error('Error during scheduled RSS crawling:', error);
    }
  }

  onModuleDestroy() {
    if (this.crawlInterval) {
      clearInterval(this.crawlInterval);
      this.logger.log('Auto-crawling stopped');
    }
  }

  getHello(): string {
    return 'NewsX Backend API is running!';
  }
}

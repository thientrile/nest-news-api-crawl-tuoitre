import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete
  // Query
} from '@nestjs/common';
import { PostService } from './post.service';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('crawl')
  async crawl() {
    return this.postService.crawl();
  }
}

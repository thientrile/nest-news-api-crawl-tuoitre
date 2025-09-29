import { Controller, Get, Param, Query } from '@nestjs/common';
import { PostService } from './post.service';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('crawl')
  async crawl() {
    return this.postService.crawl();
  }

  @Get()
  async findAll() {
    return this.postService.findAll();
  }

  @Get('category/:slug')
  async findByCategorySlug(
    @Param('slug') categorySlug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.postService.findByCategorySlug(categorySlug, pageNum, limitNum);
  }
}

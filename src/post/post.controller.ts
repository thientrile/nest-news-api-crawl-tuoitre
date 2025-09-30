import { Controller, Get, Param, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { normalizeVietnamese } from '../utils/text.helper';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('crawl')
  crawl() {
    // Fire-and-forget: start crawling in background
    this.postService.crawl().catch((error) => {
      console.error('Background crawl failed:', error);
    });

    // Return immediate response
    return {
      message: 'Crawl process started in background',
      status: 'initiated',
      timestamp: new Date().toISOString()
    };
  }

  @Get()
  async findAll() {
    return this.postService.findAll();
  }

  @Get('search')
  async searchByTitle(
    @Query('q') searchQuery?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    if (!searchQuery) {
      return {
        error: 'Search query is required',
        message: 'Please provide a search query using ?q=your-search-term'
      };
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    // Chuẩn hóa query
    const normalizedQuery = normalizeVietnamese(searchQuery);

    return this.postService.searchByTitle(normalizedQuery, pageNum, limitNum);
  }

  @Get('category/:slug')
  async findByCategorySlug(
    @Param('slug') categorySlug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 100;
    // Normalize slug (phòng khi slug có dấu/space)
    const normalizedSlug = normalizeVietnamese(categorySlug);
    return this.postService.findByCategorySlug(
      normalizedSlug,
      pageNum,
      limitNum
    );
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.postService.findBySlug(slug);
  }
}

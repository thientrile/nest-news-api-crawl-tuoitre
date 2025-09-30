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
  searchPosts(
    @Query('q') searchQuery?: string,
    @Query('category') categorySlug?: string,
    @Query('sort') sortBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    // Nếu không có search query và không có category thì báo lỗi
    if (!searchQuery && !categorySlug) {
      return {
        error: 'Search query or category is required',
        message:
          'Please provide a search query (?q=) or category (?category=) or both'
      };
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    // Validate sort parameter: newest (mới nhất) hoặc oldest (cũ nhất)
    const validSorts = ['newest', 'oldest'];
    const sortOrder = validSorts.includes(sortBy || '')
      ? (sortBy as 'newest' | 'oldest')
      : 'newest';

    // Chuẩn hóa search query nếu có
    const normalizedQuery = searchQuery
      ? normalizeVietnamese(searchQuery)
      : undefined;

    // Xử lý category: nếu category = '' thì tìm tất cả, không thì normalize
    let normalizedCategory: string | undefined;
    if (categorySlug === '') {
      normalizedCategory = undefined; // Tìm tất cả category
    } else if (categorySlug) {
      normalizedCategory = normalizeVietnamese(categorySlug);
    }

    return this.postService.searchPosts({
      searchQuery: normalizedQuery,
      categorySlug: normalizedCategory,
      sortBy: sortOrder,
      page: pageNum,
      limit: limitNum
    });
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

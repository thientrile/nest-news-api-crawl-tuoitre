import { Injectable, Logger } from '@nestjs/common';
import { Article, RssCrawlerService } from '../../libs/rss-crawler/src';
import { CategoryService } from 'src/category/category.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { normalizeVietnamese } from 'src/utils/text.helper';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);
  private readonly BATCH_SIZE = 50; // Xử lý 50 posts mỗi batch
  private readonly BATCH_DELAY = 100; // Delay 100ms giữa các batch

  constructor(
    private readonly rssCrawlerService: RssCrawlerService,
    private readonly categoryService: CategoryService,
    private readonly prismaService: PrismaService
  ) {}

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async upsertPostsBatch(posts: Article[]): Promise<void> {
    const operations = posts.map((post) => ({
      where: { link: post.link },
      update: {
        title: post.title,
        titleNormalized: normalizeVietnamese(post.title),
        description: post.description || '',
        content: post.content,
        image: post.image,
        pubDate: post.pubDate,
        updatedAt: new Date()
      },
      create: {
        title: post.title,
        titleNormalized: normalizeVietnamese(post.title),
        link: post.link,
        slug: post.slug ?? this.rssCrawlerService.createSlug(post.title),
        pubDate: post.pubDate,
        description: post.description || '',
        content: post.content,
        image: post.image || null,
        author:
          typeof post.author === 'string'
            ? { name: post.author, avatar: { src: '' } }
            : post.author,
        categories: post.categories || [],
        published: true,
        source: 'tuoitre.vn'
      }
    }));

    // Sử dụng transaction để đảm bảo atomicity
    await this.prismaService.$transaction(
      operations.map((op) => this.prismaService.posts.upsert(op))
    );
  }

  async crawl() {
    try {
      const getAllCategories = await this.categoryService.findAll();
      const links = getAllCategories
        .map((category) => ({
          link: category.link,
          id: category.id
        }))
        .filter((item) => typeof item.link === 'string' && item.link !== null);

      this.logger.log(`📡 Starting crawl for ${links.length} categories...`);

      const results = await this.rssCrawlerService.crawlManyFeeds(
        links.map((x) => ({ link: x.link as string, id: x.id }))
      );

      const allPosts = results
        .flat()
        .filter((post: Article) => post !== undefined && post !== null);

      this.logger.log(
        `🎯 Crawled ${allPosts.length} articles total. Processing in batches...`
      );

      let processedCount = 0;
      let successCount = 0;
      let errorCount = 0;

      // Process posts in batches to avoid write conflicts
      for (let i = 0; i < allPosts.length; i += this.BATCH_SIZE) {
        const batch = allPosts.slice(i, i + this.BATCH_SIZE);
        const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(allPosts.length / this.BATCH_SIZE);

        try {
          this.logger.log(
            `⚡ Processing batch ${batchNumber}/${totalBatches} (${batch.length} posts)`
          );

          await this.upsertPostsBatch(batch);

          successCount += batch.length;
          this.logger.log(
            `✅ Batch ${batchNumber}/${totalBatches} completed successfully`
          );

          // Delay between batches to prevent overwhelming the database
          if (i + this.BATCH_SIZE < allPosts.length) {
            await this.sleep(this.BATCH_DELAY);
          }
        } catch (error) {
          errorCount += batch.length;
          this.logger.error(
            `❌ Batch ${batchNumber} failed:`,
            error instanceof Error ? error.message : String(error)
          );

          // Try individual upserts for failed batch
          this.logger.log(`🔄 Retrying batch ${batchNumber} individually...`);
          await this.retryBatchIndividually(batch);
        }

        processedCount += batch.length;
      }

      this.logger.log(
        `🎉 Crawl completed! Processed: ${processedCount}, Success: ${successCount}, Errors: ${errorCount}`
      );
      return allPosts;
    } catch (error) {
      this.logger.error('❌ Error crawling RSS feed:', error);
      throw error;
    }
  }

  private async retryBatchIndividually(posts: Article[]): Promise<void> {
    let individualSuccessCount = 0;
    let individualErrorCount = 0;

    for (const post of posts) {
      try {
        await this.prismaService.posts.upsert({
          where: { link: post.link },
          update: {
            title: post.title,
            titleNormalized: normalizeVietnamese(post.title),
            description: post.description || '',
            content: post.content,
            image: post.image,
            pubDate: post.pubDate,
            updatedAt: new Date()
          },
          create: {
            title: post.title,
            titleNormalized: normalizeVietnamese(post.title),
            link: post.link,
            slug: post.slug ?? this.rssCrawlerService.createSlug(post.title),
            pubDate: post.pubDate,
            description: post.description || '',
            content: post.content,
            image: post.image || null,
            author:
              typeof post.author === 'string'
                ? { name: post.author, avatar: { src: '' } }
                : post.author,
            categories: post.categories || [],
            published: true,
            source: 'tuoitre.vn'
          }
        });
        individualSuccessCount++;

        // Small delay between individual retries
        await this.sleep(10);
      } catch (error) {
        individualErrorCount++;
        this.logger.error(
          `Failed to upsert individual post: ${post.title}`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    this.logger.log(
      `🔄 Individual retry completed: ${individualSuccessCount} success, ${individualErrorCount} failed`
    );
  }

  // Thêm method để lấy existing slugs cho smart crawling
  async getExistingSlugs(): Promise<string[]> {
    try {
      const posts = await this.prismaService.posts.findMany({
        select: { slug: true }
      });
      return posts.map((post) => post.slug);
    } catch (error) {
      this.logger.error('Error fetching existing slugs:', error);
      return [];
    }
  }

  // Thêm method để lấy existing links cho duplicate checking
  async getExistingLinks(): Promise<string[]> {
    try {
      const posts = await this.prismaService.posts.findMany({
        select: { link: true }
      });
      return posts.map((post) => post.link);
    } catch (error) {
      this.logger.error('Error fetching existing links:', error);
      return [];
    }
  }

  async findAll() {
    try {
      const posts = await this.prismaService.posts.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
      return posts;
    } catch (error) {
      this.logger.error('Error fetching all posts:', error);
      throw error;
    }
  }

  async findBySlug(slug: string) {
    try {
      const post = await this.prismaService.posts.findUnique({
        where: { slug }
      });

      if (!post || !post.published) {
        throw new Error(`Post with slug "${slug}" not found or unpublished`);
      }

      // Lấy thông tin categories
      const categories = await this.prismaService.categories.findMany({
        where: {
          id: { in: post.categories }
        },
        select: {
          id: true,
          name: true,
          slug: true
        }
      });

      return {
        ...post,
        categories
      };
    } catch (error) {
      this.logger.error(`Error fetching post by slug "${slug}":`, error);
      throw error;
    }
  }

  async findByCategorySlug(
    categorySlug: string,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      const category = await this.categoryService.findBySlug(categorySlug);

      if (!category) {
        throw new Error(`Category with slug "${categorySlug}" not found`);
      }

      const skip = (page - 1) * limit;

      const posts = await this.prismaService.posts.findMany({
        where: {
          categories: {
            has: category.id
          },
          published: true
        },
        orderBy: {
          createdAt: 'desc' // Changed to desc for newest first
        },
        skip,
        take: limit
      });

      const totalPosts = await this.prismaService.posts.count({
        where: {
          categories: {
            has: category.id
          },
          published: true
        }
      });

      const totalPages = Math.ceil(totalPosts / limit);
      return {
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug
        }
      };
    } catch (error) {
      this.logger.error(
        `Error fetching posts for category slug "${categorySlug}":`,
        error
      );
      throw error;
    }
  }

  async searchByTitle(
    searchQuery: string,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      if (!searchQuery || searchQuery.trim().length === 0) {
        throw new Error('Search query cannot be empty');
      }

      const skip = (page - 1) * limit;
      const normalized = normalizeVietnamese(searchQuery);

      const posts = await this.prismaService.posts.findMany({
        where: {
          AND: [
            {
              titleNormalized: {
                contains: normalized,
                mode: 'insensitive'
              }
            },
            {
              published: true
            }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });

      const totalPosts = await this.prismaService.posts.count({
        where: {
          AND: [
            {
              titleNormalized: {
                contains: normalized,
                mode: 'insensitive'
              }
            },
            {
              published: true
            }
          ]
        }
      });

      this.logger.log(
        `Search completed: found ${totalPosts} posts for query "${searchQuery}"`
      );

      return {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNext: page < Math.ceil(totalPosts / limit),
          hasPrev: page > 1
        },
        searchQuery: searchQuery.trim(),
        searchMetadata: {
          executedAt: new Date().toISOString(),
          resultsFound: posts.length,
          totalMatches: totalPosts
        }
      };
    } catch (error) {
      this.logger.error(
        `Error searching posts with query "${searchQuery}":`,
        error
      );
      throw error;
    }
  }
}

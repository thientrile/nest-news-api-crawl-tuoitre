import { Injectable, Logger } from '@nestjs/common';
import { Article, RssCrawlerService } from '../../libs/rss-crawler/src';
import { CategoryService } from 'src/category/category.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { normalizeVietnamese } from 'src/utils/text.helper';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private readonly rssCrawlerService: RssCrawlerService,
    private readonly categoryService: CategoryService,
    private readonly prismaService: PrismaService
  ) {}
  async crawl() {
    try {
      const getAllCategories = await this.categoryService.findAll();
      const links = getAllCategories
        .map((category) => {
          return {
            link: category.link,
            id: category.id
          };
        })
        .filter((item) => typeof item.link === 'string' && item.link !== null);

      const results = await Promise.all(
        links.map((item) =>
          this.rssCrawlerService.crawlRSSAndContent(
            item.link as string,
            item.id
          )
        )
      );
      this.logger.log(
        `Crawled ${results.flat().length} articles from ${links.length} categories.`
      );
      const createPosts = results
        .flat()
        .filter((post: Article) => post !== undefined && post !== null)
        .map((post: Article) =>
          this.prismaService.posts.upsert({
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
          })
        );
      await Promise.all(createPosts);
      return results.flat();
    } catch (error) {
      this.logger.error('Error crawling RSS feed:', error);
      throw error;
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

  async findByCategorySlug(
    categorySlug: string,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      // First, find the category by slug to get its ID
      const category = await this.categoryService.findBySlug(categorySlug);

      if (!category) {
        throw new Error(`Category with slug "${categorySlug}" not found`);
      }

      const skip = (page - 1) * limit;

      // Find posts that contain this category ID in their categories array
      const posts = await this.prismaService.posts.findMany({
        where: {
          categories: {
            has: category.id // MongoDB array contains operation
          },
          published: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });

      // Get total count for pagination
      const totalPosts = await this.prismaService.posts.count({
        where: {
          categories: {
            has: category.id
          },
          published: true
        }
      });

      return {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNext: page < Math.ceil(totalPosts / limit),
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

      // Search for posts with title containing the search query (case insensitive)
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
          createdAt: 'desc' // Sắp xếp mới nhất trước
        },
        skip,
        take: limit
      });

      // Get total count for pagination
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

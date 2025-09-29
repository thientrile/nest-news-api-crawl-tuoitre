import { Injectable, Logger } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Article, RssCrawlerService } from '../../libs/rss-crawler/src';
import { CategoryService } from 'src/category/category.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private readonly rssCrawlerService: RssCrawlerService,
    private readonly categoryService: CategoryService,
    private readonly prismaService: PrismaService
  ) { }

  create(createPostDto: CreatePostDto) {
    return 'This action adds a new post';
  }
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
              description: post.description || '',
              content: post.content,
              image: post.image,
              pubDate: post.pubDate,
              updatedAt: new Date()
            },
            create: {
              title: post.title,
              link: post.link,
              slug: this.generateSlugFromTitle(post.title),
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
  private generateSlugFromTitle(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD') // Normalize Vietnamese characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Keep only alphanumeric, spaces, and hyphens
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }

  findAll() {
    return `This action returns all post`;
  }


}

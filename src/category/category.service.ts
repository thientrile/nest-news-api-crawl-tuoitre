import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RssCrawlerService } from '../../libs/rss-crawler/src';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly rssCrawlerService: RssCrawlerService
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const { name, link } = createCategoryDto;
      let { slug } = createCategoryDto;
      if (!slug) {
        slug = this.rssCrawlerService.createSlug(name);
      }
      const Category = await this.prismaService.categories.upsert({
        where: { slug },
        update: {},
        create: {
          name,
          link,
          slug
        }
      });

      return Category;
    } catch (error) {
      this.logger.error(`Error creating category:`, error);
      throw error;
    }
  }

  async findAll() {
    try {
      const categories = await this.prismaService.categories.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });

      this.logger.log(`Retrieved ${categories.length} categories`);
      return categories;
    } catch (error) {
      this.logger.error('Error retrieving categories:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const category = await this.prismaService.categories.findUnique({
        where: { id }
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return category;
    } catch (error) {
      this.logger.error(`Error retrieving category ${id}:`, error);
      throw error;
    }
  }

  async findBySlug(slug: string) {
    try {
      const category = await this.prismaService.categories.findUnique({
        where: { slug }
      });

      if (!category) {
        throw new NotFoundException(`Category with slug "${slug}" not found`);
      }

      return category;
    } catch (error) {
      this.logger.error(`Error retrieving category by slug ${slug}:`, error);
      throw error;
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      // Check if category exists
      const existingCategory = await this.findOne(id);

      const { name, link, slug } = updateCategoryDto;

      // If name or link is being updated, check for conflicts
      if (name || link) {
        const conflictCategory = await this.prismaService.categories.findFirst({
          where: {
            AND: [
              { id: { not: id } }, // Exclude current category
              {
                OR: [...(name ? [{ name }] : []), ...(link ? [{ link }] : [])]
              }
            ]
          }
        });

        if (conflictCategory) {
          throw new ConflictException(
            `Another category with name "${name}" or link "${link}" already exists`
          );
        }
      }

      // Generate new slug if name is updated but slug is not provided
      let finalSlug = slug;
      if (name && !slug && name !== existingCategory.name) {
        finalSlug = this.rssCrawlerService.createSlug(name);

        // Ensure slug is unique
        const existingSlugs = await this.prismaService.categories.findMany({
          where: { id: { not: id } },
          select: { slug: true }
        });
        const slugList = existingSlugs.map((cat) => cat.slug).filter(Boolean);

        let counter = 1;
        const baseSlug = finalSlug;
        while (slugList.includes(finalSlug)) {
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      const updatedCategory = await this.prismaService.categories.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(link && { link }),
          ...(finalSlug && { slug: finalSlug })
        }
      });

      this.logger.log(`Updated category: ${updatedCategory.name}`);
      return updatedCategory;
    } catch (error) {
      this.logger.error(`Error updating category ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Check if category exists
      await this.findOne(id);

      const deletedCategory = await this.prismaService.categories.delete({
        where: { id }
      });

      this.logger.log(`Deleted category: ${deletedCategory.name}`);
      return {
        message: `Category "${deletedCategory.name}" deleted successfully`
      };
    } catch (error) {
      this.logger.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }

  async createSlugFromName(name: string): Promise<string> {
    const baseSlug = this.rssCrawlerService.createSlug(name);

    // Check for existing slugs
    const existingSlugs = await this.prismaService.categories.findMany({
      select: { slug: true }
    });
    const slugList = existingSlugs.map((cat) => cat.slug).filter(Boolean);

    let finalSlug = baseSlug;
    let counter = 1;
    while (slugList.includes(finalSlug)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }
}

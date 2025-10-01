import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { username: string; content: string; postId: string }) {
    return this.prisma.comment.create({ data });
  }

  async findAll(postId?: string) {
    if (postId) {
      return this.prisma.comment.findMany({ where: { postId } });
    }
    return this.prisma.comment.findMany();
  }

  async findOne(id: string) {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  async update(id: string, data: { content?: string }) {
    return this.prisma.comment.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }
}
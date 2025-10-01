import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostModule } from './post/post.module';
import { PrismaService } from './prisma/prisma.service';
import { CategoryModule } from './category/category.module';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [PostModule, CategoryModule, CommentModule],
  controllers: [AppController],
  providers: [AppService, PrismaService]
})
export class AppModule {}

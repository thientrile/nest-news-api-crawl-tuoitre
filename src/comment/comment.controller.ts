import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { CommentService } from './comment.service';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  create(@Body() body: { username: string; content: string; postId: string }) {
    return this.commentService.create(body);
  }

  @Get()
  findAll(@Query('postId') postId?: string) {
    return this.commentService.findAll(postId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { content?: string }) {
    return this.commentService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentService.remove(id);
  }
}
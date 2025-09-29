import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Parser } from 'xml2js';
import * as cheerio from 'cheerio';
import { Article, AuthorInfo, ParserResult } from './types';
import slugify from 'slugify';
@Injectable()
export class RssCrawlerService {
  private async getArticleContent(url: string): Promise<string> {
    try {
      const res = await axios.get(url);
      const $ = cheerio.load(res.data as string);

      const contentDiv = $('div.detail-content.afcbc-body');

      // Loại bỏ các phần tử không mong muốn, ví dụ như div con chứa quảng cáo
      contentDiv.find('div').remove();
      contentDiv.find('script').remove();
      contentDiv.find('figure').remove();

      // Lấy toàn bộ nội dung HTML bên trong div chính
      const htmlContent = contentDiv.html();

      // Kiểm tra và trả về nội dung
      return htmlContent || 'Cannot find any content.';
    } catch (err) {
      return `Error when fetching article content: ${(err as Error).message}`;
    }
  }

  private async getArticleAuthor(url: string): Promise<AuthorInfo | string> {
    try {
      const res = await axios.get(url);
      const $ = cheerio.load(res.data);

      const authorDiv = $('div.detail-author.oneauthor');

      // Lấy tên trong .author-info a
      const name = authorDiv.find('.author-info a').first().text().trim();

      // Lấy avatar trong .groupavtauthor a img
      const avatar = authorDiv.find('.groupavtauthor a img').attr('src') || '';

      if (!name && !avatar) {
        return "Can't find any author information.";
      }

      return {
        name: name || 'Unknown',
        avatar: { src: avatar || 'No avatar found' }
      };
    } catch (err) {
      return `Error when fetching article content: ${(err as Error).message}`;
    }
  }
  async crawlRSSAndContent(RSS_URL: string, categoryId: string) {
    try {
      const res = await axios.get(RSS_URL);
      const parser = new Parser({ explicitArray: false });
      const xmlData: string = res.data as string;
      const parsedResult: unknown = await parser.parseStringPromise(xmlData);
      // Optionally, add runtime validation here if needed
      const result = parsedResult as ParserResult;

      const items = result.rss.channel.item;
      const articles: Array<Article> = [];
      for (const item of items.slice(0, 5)) {
        const content = await this.getArticleContent(item.link);
        const author = await this.getArticleAuthor(item.link);

        articles.push({
          author,
          title: item.title,
          link: item.link,
          slug: this.createSlug(item.title),
          pubDate: item.pubDate,
          categories: [categoryId],
          description: item.description?.replace(/<[^>]+>/g, '').trim(),
          image: item.enclosure?.['$']?.url || null,
          content
        });
      }

      return articles;
    } catch (err) {
      console.error('Error when crawl RSS:', (err as Error).message);
    }
  }
  createSlug(str: string): string {
    return slugify(str, {
      lower: true,
      strict: true,
      locale: 'vi'
    });
  }
}

import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { Parser } from 'xml2js';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import http from 'http';
import https from 'https';
import slugify from 'slugify';
import { Article, AuthorInfo, ParserResult } from './types';

@Injectable()
export class RssCrawlerService {
  private httpClient: AxiosInstance;

  // Tùy biến concurrency qua ENV (ví dụ FEED_CONC=6, ITEM_CONC=12)
  private readonly FEED_CONC = Number(process.env.FEED_CONC ?? 6);
  private readonly ITEM_CONC = Number(process.env.ITEM_CONC ?? 12);

  constructor() {
    const httpAgent = new http.Agent({
      keepAlive: true,
      maxSockets: 128
    });
    const httpsAgent = new https.Agent({
      keepAlive: true,
      maxSockets: 128
    });

    this.httpClient = axios.create({
      timeout: 12_000,
      httpAgent,
      httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (RssCrawler/1.0; +https://example.com)',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
      // validateStatus: (s) => s < 500, // nếu muốn bỏ qua 4xx
    });

    // Nếu muốn retry:
    // axiosRetry(this.httpClient, { retries: 2, retryDelay: axiosRetry.exponentialDelay });
  }

  /** Gộp content + author từ 1 lần fetch HTML */
  private async scrapeArticle(
    url: string
  ): Promise<{ content: string; author: AuthorInfo | string }> {
    try {
      const res = await this.httpClient.get<string>(url);
      const $ = cheerio.load(res.data);

      // ===== CONTENT =====
      const $root = $('div.detail-content.afcbc-body');

      // 1) Bỏ rác có chọn lọc (đừng remove toàn bộ <div> kẻo bay img)
      $root
        .find('script, style, iframe, ins, .ads, .qc, .advertisement')
        .remove();
      $root.find('div[type="RelatedOneNews"]').remove();
      $root.find('div[class="readmore-body-box d-none"]').remove();
      $root.find('div[class="content-wrap"]').remove();
      // 2) Unwrap <noscript> (nhiều site nhúng <img> thật trong đây)
      $root.find('noscript').each((_, el) => {
        const html = $(el).html();
        if (html) $(el).before(html);
        $(el).remove();
      });

      // 3) Chuẩn hoá ảnh: data-* -> src, thêm protocol, bỏ srcset/sizes
      $root.find('img').each((_, img) => {
        const $img = $(img);

        // Lấy candidate src từ các lazy attrs
        const firstFromSrcset = (() => {
          const srcset = $img.attr('srcset');
          if (!srcset) return '';
          const first = srcset.split(',')[0]?.trim().split(' ')[0];
          return first || '';
        })();

        let src =
          $img.attr('data-src') ||
          $img.attr('data-original') ||
          $img.attr('data-lazy-src') ||
          $img.attr('data-zoom-image') ||
          firstFromSrcset ||
          $img.attr('src') ||
          '';

        src = src.trim();
        if (src.startsWith('//')) src = 'https:' + src;

        if (src) {
          $img.attr('src', src);
        }

        // Dọn lazy attrs để browser không load placeholder 1x1
        $img
          .removeAttr('srcset')
          .removeAttr('sizes')
          .removeAttr('data-src')
          .removeAttr('data-original')
          .removeAttr('data-lazy-src')
          .removeAttr('data-zoom-image');

        if (!$img.attr('alt')) $img.attr('alt', '');
        $img.attr('loading', 'lazy').attr('decoding', 'async');

        // Optional: style nhẹ nhàng cho hiển thị đẹp (tuỳ bạn)
        // $img.addClass('article-img');
      });

      // 4) Chuẩn hoá liên kết: mở tab mới + bảo mật
      $root.find('a[href]').each((_, a) => {
        const $a = $(a);
        $a.attr('target', '_blank');
        const rel = ($a.attr('rel') || '').split(' ').filter(Boolean);
        if (!rel.includes('noopener')) rel.push('noopener');
        if (!rel.includes('noreferrer')) rel.push('noreferrer');
        $a.attr('rel', rel.join(' '));
      });

      // 5) Giữ figure/caption nguyên vẹn (đừng xoá .VCSortableInPreviewMode)
      // -> Không đụng vào figure/figcaption.

      const htmlContent = $root.html() || 'Cannot find any content.';

      // ===== AUTHOR =====
      const $author = $('div.detail-author.oneauthor');
      const name = $author.find('.author-info a').first().text().trim();
      const avatarRaw = $author.find('.groupavtauthor a img').attr('src') || '';
      const avatar = avatarRaw.startsWith('//')
        ? 'https:' + avatarRaw
        : avatarRaw;

      const author: AuthorInfo | string =
        !name && !avatar
          ? "Can't find any author information."
          : {
              name: name || 'Unknown',
              avatar: { src: avatar || 'No avatar found' }
            };

      return { content: htmlContent, author };
    } catch (err) {
      const msg = (err as Error).message || String(err);
      return {
        content: `Error when fetching article content: ${msg}`,
        author: `Error when fetching author: ${msg}`
      };
    }
  }

  createSlug(str: string): string {
    return slugify(str, { lower: true, strict: true, locale: 'vi' });
  }

  /** Crawl 1 RSS feed → trả về danh sách Article */
  async crawlRSSAndContent(RSS_URL: string, categoryId: string) {
    try {
      const res = await this.httpClient.get<string>(RSS_URL, {
        headers: {
          Accept: 'application/rss+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      const parser = new Parser({ explicitArray: false });
      const parsed = (await parser.parseStringPromise(
        res.data
      )) as ParserResult;

      let items = parsed?.rss?.channel?.item ?? [];
      if (!Array.isArray(items)) items = [items];

      // Dedup theo link (nếu feed có trùng)
      const seen = new Set<string>();
      items = items.filter((it) => {
        const k = it?.link ?? '';
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      // Giới hạn concurrency ở cấp ITEM
      const limitItem = pLimit(this.ITEM_CONC);

      const jobs = items.map((item) =>
        limitItem(async () => {
          const { content, author } = await this.scrapeArticle(item.link);

          const article: Article = {
            author,
            title: item.title,
            link: item.link,
            slug: this.createSlug(item.title),
            pubDate: item.pubDate,
            categories: [categoryId],
            description: item.description?.replace(/<[^>]+>/g, '').trim(),
            image: item.enclosure?.['$']?.url || null,
            content
          };

          return article;
        })
      );

      const settled = await Promise.allSettled(jobs);
      const articles = settled
        .filter(
          (s): s is PromiseFulfilledResult<Article> => s.status === 'fulfilled'
        )
        .map((s) => s.value);

      // (Tuỳ chọn) Bulk insert DB ở đây để giảm round-trip:
      // await this.articleModel.insertMany(articles, { ordered: false });

      return articles;
    } catch (err) {
      console.error('Error when crawl RSS:', (err as Error).message);
      return [];
    }
  }

  /**
   * Crawl nhiều feed (links) song song có giới hạn.
   * Trả về flatten list các Article.
   */
  async crawlManyFeeds(
    links: Array<{ link: string; id: string }>
  ): Promise<Article[]> {
    const limitFeed = pLimit(this.FEED_CONC);

    const feedJobs = links.map((item) =>
      limitFeed(() => this.crawlRSSAndContent(item.link, item.id))
    );

    const settled = await Promise.allSettled(feedJobs);
    const allArticles = settled.flatMap((s) =>
      s.status === 'fulfilled' ? s.value : []
    );

    // (Tuỳ chọn) dedup cross-feeds theo link nếu cùng bài xuất hiện ở nhiều category:
    // const uniq = new Map<string, Article>();
    // for (const a of allArticles) if (!uniq.has(a.link)) uniq.set(a.link, a);
    // return [...uniq.values()];

    return allArticles;
  }
}

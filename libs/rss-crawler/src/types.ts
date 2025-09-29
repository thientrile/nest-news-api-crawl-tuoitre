export interface AuthorAvatar {
  src: string;
}

export interface AuthorInfo {
  name: string;
  avatar: AuthorAvatar;
}

export interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  enclosure?: {
    $?: {
      url?: string;
    };
  };
}

export interface Article {
  author: AuthorInfo | string;
  title: string;
  link: string;
  categories?: string[];
  pubDate: string;
  description?: string;
  image?: string | null;
  content: string;
}

export interface RSSFeed {
  name: string;
  url: string;
  category: string;
}

export interface ParserResult {
  rss: {
    channel: {
      item: RSSItem[];
    };
  };
}

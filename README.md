# 📰 NewsX Backend API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  <strong>A modern news aggregation and management system built with NestJS</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
</p>

## 📋 Description

NewsX Backend API is a comprehensive news management system that crawls RSS feeds from Vietnamese news sources (primarily Tuoi Tre), processes content, and provides RESTful APIs for news consumption. Built with modern technologies for scalability and performance.

## ✨ Features

- 🕷️ **RSS Feed Crawling**: Automated news crawling from multiple RSS sources
- 📰 **Content Processing**: Intelligent content extraction and processing
- 🏷️ **Category Management**: Organize news by categories with slug-based routing
- 📄 **Pagination Support**: Efficient data pagination for large datasets  
- 🔍 **Advanced Filtering**: Filter posts by category, publication status, and more
- 🚀 **Modern Stack**: Built with NestJS, MongoDB, and Prisma ORM
- 📝 **TypeScript**: Full TypeScript support for better developer experience

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **NestJS** | Backend Framework | Latest |
| **TypeScript** | Programming Language | Latest |
| **MongoDB** | Database | Latest |
| **Prisma** | ORM & Database Toolkit | Latest |
| **RSS Parser** | Feed Processing | Custom |

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd newsx-be-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/newsx-db"

PORT=3000
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Open Prisma Studio (optional)
npx prisma studio
```

### Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run start:prod

# Watch mode
npm run start
```

The API will be available at: `http://localhost:3000`

## 📚 API Endpoints

### 🏠 Health Check
Check if the API is running properly.

```http
GET /
```

**Response:**
```json
"NewsX Backend API is running!"
```

### 📂 Categories

#### Get All Categories
Retrieve all news categories.

```http
GET /category
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Tin tức",
    "slug": "tin-tuc",
    "description": "Tin tức tổng hợp",
    "link": "https://tuoitre.vn/rss/tin-moi-nhat.rss",
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
]
```

#### Create Category
Create a new news category with RSS feed URL.

```http
POST /category
Content-Type: application/json

{
  "name": "Công nghệ",
  "slug": "cong-nghe",
  "link": "https://tuoitre.vn/rss/cong-nghe.rss",
  "description": "Tin tức công nghệ"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "name": "Công nghệ",
  "slug": "cong-nghe",
  "description": "Tin tức công nghệ",
  "link": "https://tuoitre.vn/rss/cong-nghe.rss",
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

### 📰 Posts

#### Crawl RSS Feeds
Crawl all RSS feeds from categories and create/update posts.

```http
GET /post/crawl
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439013",
    "title": "Breaking news title",
    "slug": "breaking-news-title",
    "content": "Full article content...",
    "description": "Article description",
    "image": "https://example.com/image.jpg",
    "author": {
      "name": "Author Name",
      "avatar": {
        "src": "https://example.com/avatar.jpg"
      }
    },
    "categories": ["507f1f77bcf86cd799439011"],
    "published": true,
    "source": "tuoitre.vn",
    "pubDate": "2024-01-01T12:00:00Z"
  }
]
```

#### Get All Posts
Retrieve all published posts with pagination.

```http
GET /post
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439013",
    "title": "Sample News Title",
    "slug": "sample-news-title",
    "link": "https://tuoitre.vn/article-link",
    "author": {
      "name": "Author Name",
      "avatar": { "src": "avatar-url" }
    },
    "content": "Full article content",
    "description": "Brief description",
    "image": "image-url",
    "categories": ["category-id"],
    "published": true,
    "source": "tuoitre.vn",
    "pubDate": "2024-01-01T12:00:00Z",
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
]
```

#### Get Posts by Category
Retrieve posts filtered by category slug with pagination support.

```http
GET /post/category/{categorySlug}?page=1&limit=10
```

**Parameters:**
- `categorySlug` (path): Category slug (e.g., "tin-tuc", "cong-nghe")
- `page` (query): Page number (default: 1)
- `limit` (query): Number of posts per page (default: 10, max: 100)

**Example:**
```http
GET /post/category/tin-tuc?page=1&limit=5
```

**Response:**
```json
{
  "posts": [
    {
      "id": "507f1f77bcf86cd799439013",
      "title": "Sample News Title",
      "slug": "sample-news-title",
      "content": "Full article content",
      "description": "Brief description",
      "author": {
        "name": "Author Name",
        "avatar": { "src": "avatar-url" }
      },
      "categories": ["507f1f77bcf86cd799439011"],
      "published": true,
      "pubDate": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalPosts": 50,
    "hasNext": true,
    "hasPrev": false
  },
  "category": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Tin tức",
    "slug": "tin-tuc"
  }
}
```

## 🗄️ Database Schema

### Collections Overview

#### Users
```typescript
{
  id: ObjectId,
  email: string (unique),
  name: string,
  profile?: {
    bio: string
  },
  createdAt: DateTime,
  updatedAt: DateTime
}
```

#### Categories
```typescript
{
  id: ObjectId,
  name: string (unique),
  slug?: string (unique),
  description?: string,
  link?: string, // RSS feed URL
  createdAt: DateTime,
  updatedAt: DateTime
}
```

#### Posts
```typescript
{
  id: ObjectId,
  title: string,
  slug: string (unique),
  link: string (unique),
  author: {
    name: string,
    avatar: {
      src: string
    }
  },
  content: string,
  description: string,
  image?: string,
  categories: ObjectId[], // References to categories
  published: boolean (default: true),
  source?: string,
  tags: string[],
  pubDate: string,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

## 🔧 Development Tools

### Prisma Commands
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes (development)
npx prisma db push

# Pull schema from database
npx prisma db pull

# Open Prisma Studio
npx prisma studio

# Reset database (⚠️ Deletes all data!)
npx prisma migrate reset --force
```

### Code Quality
```bash
# Format code
npm run format

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

### Testing
```bash
# Unit tests
npm run test

# E2E tests  
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 📖 Usage Examples

### Creating and Using Categories

1. **Create a category:**
```bash
curl -X POST http://localhost:3000/category \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Thể thao",
    "slug": "the-thao",
    "link": "https://tuoitre.vn/rss/the-thao.rss",
    "description": "Tin tức thể thao"
  }'
```

2. **Crawl RSS feeds:**
```bash
curl http://localhost:3000/post/crawl
```

3. **Get posts from category:**
```bash
curl "http://localhost:3000/post/category/the-thao?page=1&limit=5"
```

### Batch RSS Processing
The crawling system processes multiple RSS feeds concurrently:
- Fetches all categories with RSS links
- Processes feeds in parallel using Promise.all()
- Handles duplicates using upsert operations
- Provides detailed logging for monitoring

## 🚀 Production Deployment

### Environment Setup
```env
NODE_ENV=production
DATABASE_URL="your-production-mongodb-url"
JWT_SECRET="strong-production-secret"
PORT=3000
CORS_ORIGIN="https://yourdomain.com"
```

### Security Considerations
- Enable CORS restrictions for production domains
- Use HTTPS/TLS encryption
- Implement rate limiting
- Add input validation and sanitization
- Set up monitoring and logging
- Use environment-specific secrets

### Performance Optimization
- MongoDB indexing on frequently queried fields
- Connection pooling for database
- Caching for static data
- Pagination for large datasets
- Concurrent RSS processing limits

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features  
- Update documentation
- Use conventional commits
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions and support:
- Create an issue on GitHub
- Check existing documentation
- Review API examples above

## 📞 Contact

- **Author**: thientrile
- **Repository**: nest-news-api-crawl-tuoitre
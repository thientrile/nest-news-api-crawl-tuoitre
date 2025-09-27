<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

NewsX Backend API - A NestJS application with MongoDB and Prisma ORM for news management system.

## Tech Stack
- **Framework**: NestJS (Node.js)
- **Database**: MongoDB Atlas
- **ORM**: Prisma
- **Language**: TypeScript

## Project setup

```bash
$ npm install
```

## Database Setup with Prisma

### 1. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/newsx-db"
```

### 2. Prisma Commands

#### Generate Prisma Client
```bash
$ npx prisma generate
```

#### Push Schema to Database (Development)
```bash
# Push schema changes to database without migration files
$ npx prisma db push
```

#### Pull Schema from Database
```bash
# Pull schema from existing database (use --force to override local schema)
$ npx prisma db pull
$ npx prisma db pull --force
```

#### Open Prisma Studio (Database GUI)
```bash
# Open web interface to view and edit data
$ npx prisma studio
```

#### Reset Database (Development only!)
```bash
# WARNING: This will delete all data!
$ npx prisma migrate reset --force
```

### 3. Database Models

Current schema includes:
- **Users**: User accounts with profiles
- **Categories**: News categories
- **Posts**: News articles with author and category relationships

#### Sample Data Structure:
```typescript
// User
{
  id: ObjectId,
  email: "user@example.com",
  name: "John Doe",
  profile: {
    bio: "User biography"
  }
}

// Category
{
  id: ObjectId,
  name: "Technology"
}

// Post
{
  id: ObjectId,
  title: "News Title",
  content: "Article content...",
  published: true,
  author: ObjectId, // Reference to User
  categories: [ObjectId] // Array of Category references
}
```

### 4. Useful Prisma Commands

```bash
# Check Prisma version
$ npx prisma --version

# Validate schema file
$ npx prisma validate

# Format schema file
$ npx prisma format

# Show database status
$ npx prisma migrate status

# Generate migration (for SQL databases, not used with MongoDB)
$ npx prisma migrate dev --name migration_name
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Development Workflow

### 1. Start the application
```bash
# development
$ npm run start

# watch mode (recommended for development)
$ npm run start:dev

# production mode
$ npm run start:prod
```

### 2. Working with Prisma in Development
```bash
# After changing schema.prisma
$ npx prisma db push
$ npx prisma generate

# View data in Prisma Studio
$ npx prisma studio
```

### 3. MongoDB & Prisma Best Practices

#### Schema Changes Workflow:
1. Modify `prisma/schema.prisma`
2. Run `npx prisma db push` to apply changes
3. Run `npx prisma generate` to update Prisma Client
4. Restart your NestJS application

#### Important Notes:
- **MongoDB doesn't support migrations**: Use `db push` instead of `migrate dev`
- **Relations**: Use `@db.ObjectId` for referencing other collections
- **Embedded documents**: Use `type` for nested objects (like `UsersProfile`)

### 4. Troubleshooting

#### Common Issues:

**Connection String Error (P1013)**
```
Error: The provided database string is invalid
```
Solution: Ensure database name is included in connection string
```env
# Wrong
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net"

# Correct  
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/database_name"
```

**Empty Database Error (P4001)**
```
Error: The introspected database was empty
```
Solution: Use `db push` instead of `db pull` for new databases
```bash
$ npx prisma db push
```

**Re-introspection Error**
```
Error: Iterating on one schema using re-introspection with db pull is currently not supported with MongoDB
```
Solution: Use `--force` flag or stick with `db push`
```bash
$ npx prisma db pull --force
```

## Using Prisma Client in NestJS

### 1. Basic Service Example
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class UserService {
  private prisma = new PrismaClient();

  async findAll() {
    return this.prisma.users.findMany({
      include: {
        profile: true
      }
    });
  }

  async create(data: { email: string; name: string }) {
    return this.prisma.users.create({
      data
    });
  }

  async findById(id: string) {
    return this.prisma.users.findUnique({
      where: { id }
    });
  }
}
```

### 2. Prisma Service (Recommended Pattern)
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

### 3. Example Queries

```typescript
// Find posts with categories and author
const posts = await prisma.posts.findMany({
  include: {
    // Note: Relations need to be manually resolved in MongoDB
  }
});

// Create post with categories
const post = await prisma.posts.create({
  data: {
    title: "New Article",
    content: "Content here...",
    published: true,
    author: userId,
    categories: [categoryId1, categoryId2]
  }
});

// Search posts by title
const posts = await prisma.posts.findMany({
  where: {
    title: {
      contains: "search term",
      mode: 'insensitive'
    }
  }
});
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // tất cả domain
    methods: '*', // GET, POST, PUT, PATCH, DELETE, OPTIONS...
    allowedHeaders: '*', // mọi header
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400 // cache preflight 1 ngày
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

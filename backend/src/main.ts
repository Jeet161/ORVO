import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Allow large payloads for base64 document uploads
    bodyParser: true,
    rawBody: true,
  });

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Increase request body size limit for base64 PDF uploads
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(require('express').json({ limit: '15mb' }));
  expressApp.use(require('express').urlencoded({ limit: '15mb', extended: true }));

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 ORVO backend running on http://localhost:${port}/api/v1`);
}
bootstrap();

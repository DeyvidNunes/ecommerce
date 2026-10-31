import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import appConfig from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const isProduction = config.nodeEnv === 'production';

  if (isProduction) {
    app.set('trust proxy', 1);
    app.use(helmet());
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({ origin: config.frontendUrl });

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('E-commerce API')
      .setDescription(
        'API de e-commerce com catálogo, carrinho, pedidos, pagamento (Stripe) e e-mails (Resend)',
      )
      .setVersion('0.5.0')
      .addBearerAuth()
      .build();

    SwaggerModule.setup(
      'api',
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
    );
  }

  await app.listen(config.port);
}

void bootstrap();
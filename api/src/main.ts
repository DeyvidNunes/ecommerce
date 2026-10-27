import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import appConfig from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);

  app.enableCors({
    origin: config.frontendUrl,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription(
      'API de e-commerce com catálogo, carrinho, pedidos, pagamento (Stripe) e e-mails (Resend)',
    )
    .setVersion('0.4.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(config.port);
}

void bootstrap();
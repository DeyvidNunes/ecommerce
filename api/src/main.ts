import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RawBody, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
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
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();

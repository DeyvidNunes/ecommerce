import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import { envValidationSchema } from './config/env.validation';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { MailModule } from './mail/mail.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (config: ConfigType<typeof appConfig>) => config.database,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ProductsModule,
    AuthModule,
    UsersModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    PaymentsModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

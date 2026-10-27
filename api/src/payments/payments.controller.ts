// src/payments/payments.controller.ts
import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException(
        'O corpo cru (rawBody) da requisição não foi preservado',
      );
    }

    // 1. Valida a assinatura e constrói o evento seguro
    const event = this.paymentsService.constructWebhookEvent(
      rawBody,
      signature,
    );

    // 2. Processa o evento e retorna 200 OK
    return this.paymentsService.handleWebhookEvent(event);
  }
}

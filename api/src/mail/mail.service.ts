import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Resend } from 'resend';
import appConfig from '../config/app.config';

export interface OrderConfirmationItem {
  name: string;
  quantity: number;
  unitPriceInCents: number;
  subtotalInCents: number;
}

export interface OrderConfirmationData {
  to: string;
  customerName: string;
  orderId: number;
  items: OrderConfirmationItem[];
  totalInCents: number;
}

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly mailFrom: string;

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {
    this.resend = new Resend(this.config.resend.apiKey!);
    this.mailFrom = this.config.resend.mailFrom!;
  }

  async sendOrderConfirmation(data: OrderConfirmationData): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.mailFrom,
      to: data.to,
      subject: `Pedido #${data.orderId} confirmado`,
      html: this.buildHtml(data),
      text: this.buildText(data),
    });

    // O SDK do Resend não lança exceção: devolve { data, error }
    if (error) {
      throw new Error(
        `Falha ao enviar e-mail do pedido ${data.orderId}: ${error.message}`,
      );
    }
  }

  private formatMoney(cents: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildHtml(data: OrderConfirmationData): string {
    const rows = data.items
      .map(
        (item) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${this.escapeHtml(item.name)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${this.formatMoney(item.unitPriceInCents)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${this.formatMoney(item.subtotalInCents)}</td>
          </tr>`,
      )
      .join('');

    return `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#222;">
        <h2 style="margin-bottom:4px;">Pedido #${data.orderId} confirmado</h2>
        <p>Olá, ${this.escapeHtml(data.customerName)}! Recebemos o seu pagamento. Segue o resumo da compra:</p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:8px;text-align:left;">Produto</th>
              <th style="padding:8px;text-align:center;">Qtd.</th>
              <th style="padding:8px;text-align:right;">Preço</th>
              <th style="padding:8px;text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <p style="text-align:right;font-size:18px;">
          <strong>Total: ${this.formatMoney(data.totalInCents)}</strong>
        </p>

        <p>Obrigado pela compra!</p>
      </div>`;
  }

  private buildText(data: OrderConfirmationData): string {
    const lines = data.items.map(
      (item) =>
        `- ${item.name} (${item.quantity} x ${this.formatMoney(item.unitPriceInCents)}) = ${this.formatMoney(item.subtotalInCents)}`,
    );

    return [
      `Pedido #${data.orderId} confirmado`,
      '',
      `Olá, ${data.customerName}! Recebemos o seu pagamento.`,
      '',
      ...lines,
      '',
      `Total: ${this.formatMoney(data.totalInCents)}`,
      '',
      'Obrigado pela compra!',
    ].join('\n');
  }
}

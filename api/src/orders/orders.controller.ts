import { Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { OrdersService } from './orders.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('orders')
@UseGuards(ClerkAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@CurrentUser() user: User) {
    return this.ordersService.checkout(user);
  }
}

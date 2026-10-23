import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { OrdersService } from './orders.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { QueryOrdersDto } from './dto/query-orders-dto';

@UseGuards(ClerkAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@CurrentUser() user: User) {
    return this.ordersService.checkout(user);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Query() query: QueryOrdersDto) {
    return this.ordersService.findAll(user, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(user, id);
  }
}

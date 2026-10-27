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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({
    summary:
      'Cria o pedido a partir do carrinho e devolve a URL de pagamento do Stripe',
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('checkout')
  checkout(@CurrentUser() user: User) {
    return this.ordersService.checkout(user);
  }

  @ApiOperation({ summary: 'Lista os pedidos do usuário, com paginação' })
  @Get()
  findAll(@CurrentUser() user: User, @Query() query: QueryOrdersDto) {
    return this.ordersService.findAll(user, query);
  }

  @ApiOperation({ summary: 'Mostra os detalhes de um pedido do usuário' })
  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(user, id);
  }
}

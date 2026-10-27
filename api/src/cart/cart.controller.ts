import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { User } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/current-user.decorator';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @ApiOperation({
    summary: 'Mostra o carrinho do usuário, com subtotais e total',
  })
  @Get()
  getCart(@CurrentUser() user: User) {
    return this.cartService.getCart(user);
  }

  @ApiOperation({
    summary: 'Adiciona um produto ao carrinho (soma à quantidade existente)',
  })
  @Post('items')
  addItem(@CurrentUser() user: User, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addItem(user, addToCartDto);
  }

  @ApiOperation({ summary: 'Define a quantidade de um item do carrinho' })
  @Patch('items/:itemId')
  updateItem(
    @CurrentUser() user: User,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.cartService.updateItem(user, itemId, updateCartItemDto);
  }

  @ApiOperation({ summary: 'Remove um item do carrinho' })
  @Delete('items/:itemId')
  removeItem(
    @CurrentUser() user: User,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.cartService.removeItem(user, itemId);
  }

  @ApiOperation({ summary: 'Esvazia o carrinho' })
  @Delete()
  clear(@CurrentUser() user: User) {
    return this.cartService.clear(user);
  }
}

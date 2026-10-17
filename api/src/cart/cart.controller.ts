import {
  Body,
  Controller,
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

@UseGuards(ClerkAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: User) {
    return this.cartService.getCart(user);
  }

  @Post('items')
  addItem(@CurrentUser() user: User, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addItem(user, addToCartDto);
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser() user: User,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.cartService.updateItem(user, itemId, updateCartItemDto);
  }
}

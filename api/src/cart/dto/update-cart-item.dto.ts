import { PartialType } from '@nestjs/mapped-types';
import { CreateCartDto } from './create-cart.dto';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateCartItemDto extends PartialType(CreateCartDto) {
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

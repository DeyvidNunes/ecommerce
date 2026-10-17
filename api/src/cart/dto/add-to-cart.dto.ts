import { IsInt, Max, Min } from 'class-validator';

export class AddToCartDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Req,
  Post,
  UseGuards,
  HttpStatus,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// import { BasicAuthGuard, JwtAuthGuard } from '../auth';
import { OrderService } from '../order';
import { AppRequest } from '../shared';

import { calculateCartTotal } from './models-rules';
import { CartService } from './services';

@ApiTags('Carts')
@Controller('api/profile/cart/')
export class CartController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  @Get()
  async findCarts(@Req() req: AppRequest) {
    const cart = await this.cartService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: { cart },
    };
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Get(':id')
  async findUserCart(@Param('id') id: string, @Req() req: AppRequest) {
    const userCart = await this.cartService.findByUserId(id);
    if (!userCart.length) {
      throw new NotFoundException(`Cart with user ID '${id}' not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: { userCart },
    };
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Put(':id')
  async updateUserCart(
    @Param('id') id: string,
    @Req() req: AppRequest,
    @Body() body,
  ) {
    // TODO: validate body payload...
    const cart = await this.cartService.updateByUserId(id, body);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Updated',
      data: {
        cart,
      },
    };
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Delete(':userId/cart/:cartId')
  clearUserCart(
    @Param('userId') userId: string,
    @Param('cartId') cartId: string,
  ) {
    this.cartService.removeByCartIdAndUserId(cartId, userId);

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Post('checkout/:cartId')
  async checkout(@Param('cartId') cartId: string, @Body() body) {
    const order = await this.cartService.checkout(cartId, body);

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: { order },
    };
  }

  @Post(':id')
  async createCartById(@Param('id') userId: string, @Body() body) {
    const cart = await this.cartService.createCartById(userId, body);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Created',
      data: {
        cart,
      },
    };
  }
}

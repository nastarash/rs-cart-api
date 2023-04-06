import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository, InjectConnection } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';

import { v4 } from 'uuid';

import { Carts } from '../models';
import { Carts as CartEntity } from '../../database/entities/cart.entity';
import { CartItems as CartItemsEntity } from '../../database/entities/cart-item.entity';
import { Orders as OrderEntity } from 'src/database/entities/orders.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepo: Repository<CartEntity>,
    @InjectConnection() private readonly connection: Connection,
  ) {}
  private userCarts: Record<string, Carts> = {};

  findAll() {
    return this.cartRepo.find({ relations: ['cartItems', 'orders'] });
  }

  findByUserId(userId: string) {
    return this.cartRepo.find({
      relations: ['cartItems', 'orders'],
      where: { user_id: userId },
    });
  }

  findByCartId(cartId: string) {
    return this.cartRepo.findOne({
      relations: ['cartItems'],
      where: { id: cartId },
    });
  }

  createByUserId(userId: string) {
    const id = v4(v4());
    const userCart = {
      id,
      items: [],
    };

    this.userCarts[userId] = userCart;

    return userCart;
  }

  async findOrCreateByUserId(userId: string) {
    const userCart = this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, items): Promise<any> {
    const userCart = await this.findOrCreateByUserId(userId);
    try {
      const transactionCartEntity = this.connection.getRepository(CartEntity);
      const transactionCartItemEntity =
        this.connection.getRepository(CartItemsEntity);
      const cartItem = userCart[0].cartItems[0];
      const { id, user_id, created_at, updated_at, status } = userCart[0];
      const userCartWitoutCartItems = {
        id,
        user_id,
        created_at,
        updated_at,
        status,
      };
      console.log({
        ...userCartWitoutCartItems,
        updated_at: new Date().toISOString(),
      });

      await transactionCartItemEntity.save(
        {
          cart_id: cartItem.cart_id,
          count: items.count || cartItem.count,
          product_id: items.product_id || cartItem.product_id,
        },
        { transaction: true },
      );

      await transactionCartEntity.save(
        {
          ...userCartWitoutCartItems,
          updated_at: new Date().toISOString(),
        },
        { transaction: true },
      );

      return await this.findByUserId(userId);
    } catch (e) {
      return false;
    }
  }

  async removeByCartIdAndUserId(
    cartId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      await this.connection.transaction(async (entityManager) => {
        const transactionCartItemEntity =
          entityManager.getRepository(CartItemsEntity);
        await transactionCartItemEntity.delete({ cart_id: cartId });

        const transactionCartEntity = entityManager.getRepository(CartEntity);
        await transactionCartEntity.delete({ id: cartId, user_id: userId });
      });
    } catch (e) {
      console.log(e);
      return false;
    }
    return true;
  }

  async createCartById(userId: string, items: Carts) {
    const cartId = v4(v4());
    const cart = {
      id: cartId,
      user_id: userId,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const cartItems = {
      cart_id: cartId,
      ...items,
    };
    await this.connection.transaction(async (entityManager) => {
      const transactionCartEntity = entityManager.getRepository(CartEntity);
      await transactionCartEntity.save(cart, { transaction: true });

      const transactionCartItemEntity =
        entityManager.getRepository(CartItemsEntity);
      await transactionCartItemEntity.save(cartItems, { transaction: true });
    });
    return { cart, cartItems };
  }

  async checkout(cartId: string, items: any): Promise<any> {
    const cart = await this.findByCartId(cartId);
    console.log(cart.user_id);
    const cartItems = cart.cartItems;
    const { payment, delivery, comments, status } = items;
    const total = cartItems.reduce((acc, curr) => {
      return acc + 300 * curr.count;
    }, 0);
    const order = {
      id: v4(v4()),
      user_id: cart.user_id,
      cart_id: cart.id,
      payment,
      delivery,
      comments,
      status,
      total,
    };
    console.log(order);
    if (!cartItems || cartItems.length === 0) {
      return new NotFoundException(`Cart is empty`);
    }

    if (!cart || cart.status === 'ORDERED') {
      return new NotFoundException(`Cart with ID '${cartId}' not found`);
    }
    try {
      await this.connection.transaction(async (entityManager) => {
        const transactionCartEntity = entityManager.getRepository(CartEntity);
        const transactionOrderEntity = entityManager.getRepository(OrderEntity);

        await transactionOrderEntity.save(order);
        await transactionCartEntity.update(cartId, {
          status: 'ORDERED',
        });
      });
    } catch (e) {
      return new ServiceUnavailableException('Service error');
    }

    return order;
  }
}

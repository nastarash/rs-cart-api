import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Carts } from './cart.entity';

@Entity()
export class CartItems {
  @ManyToOne(
    () => Carts,
    cart => cart.cartItems,
  )
  @JoinColumn({ name: 'cart_id' })
  cart: Carts;

  @PrimaryGeneratedColumn('uuid')
  cart_id: string;

  @Column()
  product_id: string;

  @Column()
  count: number;
}

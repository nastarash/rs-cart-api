import { Carts, CartItem } from '../models';

/**
 * @param {Carts} cart
 * @returns {number}
 */
export function calculateCartTotal(cart: Carts): number {
  return cart ? cart.items.reduce((acc: number, { product: { price }, count }: CartItem) => {
    return acc += price * count;
  }, 0) : 0;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Carts } from './cart.entity';

@Entity()
export class Orders {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Carts)
  cart: Carts;
  
  @Column()
  cart_id: string;

  @Column()
  user_id: string;

  @Column({ type: 'json', nullable: true })
  payment: any;

  @Column({ type: 'json', nullable: true })
  delivery: any;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ type: 'text', nullable: true })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

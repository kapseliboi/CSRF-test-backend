import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @ManyToOne(type => User, user => user.posts)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column('text')
    title: string;

    @Column('text')
    text: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    editedAt: Date;
}

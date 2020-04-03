import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class User {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({
        length: 50,
        unique: true,
    })
    username: string;

    @Column('text')
    passwordHash: string;

    @Column('text',{
        unique: true
    })
    email: string;

    @Column({
        default: false
    })
    emailConfirmed: boolean;

    @Column({
        default: true
    })
    isActive: boolean;

    @Column({
        nullable: true
    })
    lastLogin: Date;

    @CreateDateColumn()
    createdAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({
        length: 50
    })
    username: string;

    @Column('text')
    passwordHash: string;

    @Column('text')
    email: string;

}

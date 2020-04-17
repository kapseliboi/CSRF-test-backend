import { Entity } from 'typeorm';
import { User } from './User';

@Entity('fake_user')
export class FakeUser extends User{}

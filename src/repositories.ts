import { getConnection } from 'typeorm';
import { User } from './entity/User';
import { FakeUser } from './entity/FakeUser';
import { Post } from './entity/Post';

const connection = getConnection();
export const userRepository = connection.getRepository(User);
export const fakeUserRepository = connection.getRepository(FakeUser);
export const postRepository = connection.getRepository(Post);

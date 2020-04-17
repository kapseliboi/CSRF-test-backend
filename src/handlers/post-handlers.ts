import * as Boom from '@hapi/boom';
import * as Hapi from '@hapi/hapi';
import { postRepository } from '../repositories';
import { ResponseStrings } from '../constants/strings';
import { Post } from '../entity/Post';
import {
    AuthenticatedRequest,
    GetOrDeletePostRequest,
    CreatePostRequest,
    EditPostRequest,
} from '../types/requests';

function mapPostToReturnablePost(post: Post) {
    return {
        id: post.id,
        username: post.user.username,
        userId: post.user.id,
        title: post.title,
        text: post.text,
        createdAt: post.createdAt,
        editedAt: post.editedAt,
    };
}

export async function getAllPostsHandler(req: AuthenticatedRequest, h: Hapi.ResponseToolkit) {
    try {
        const posts = await postRepository.find({ take: 50, relations: ['user'] });
        return posts.map(mapPostToReturnablePost);
    }
    catch(e) {
        console.log(`Getting posts from the database failed with error: ${e}`);
        return Boom.internal(ResponseStrings.internalSomethingWentWrong);
    }
}

export async function getPostHandler(req: GetOrDeletePostRequest, h: Hapi.ResponseToolkit) {
    const { id } = req.params;
    try {
        const post = await postRepository.findOne(id, { relations: ['user'] });
        if (post) {
            return mapPostToReturnablePost(post);
        }
        return Boom.notFound(ResponseStrings.postNotFound);
    }
    catch(e) {
        console.log(`Getting post with ${id} from database failed with error: ${e}`);
        return Boom.internal(ResponseStrings.internalSomethingWentWrong);
    }
}

export async function createPostHandler(req: CreatePostRequest, h: Hapi.ResponseToolkit) {
    const {
      payload: { title, text },
      auth: {
          credentials: { id, username },
        },
    } = req;
    const newPost = new Post();
    newPost.userId = id;
    newPost.title = title;
    newPost.text = text;
    try {
        const post = await postRepository.save(newPost);
        return ({
            id: post.id,
            username,
            userId: id,
            title: post.title,
            text: post.text,
            createdAt: post.createdAt,
            editedAt: post.editedAt,
        });
    }
    catch(e) {
        console.log(`An error occurred while saving a new post to database: ${e}`);
        return Boom.internal(ResponseStrings.internalSomethingWentWrong);
    }
}

export async function editPostHandler(req: EditPostRequest, h: Hapi.ResponseToolkit) {
    const {
        payload: { title, text },
        params: { id },
        auth: { credentials: { id: userId } },
    } = req;
    let post: Post;
    try {
        post = await postRepository.findOne(id, { relations: ['user'] });
    }
    catch(e) {
        console.log(`An error occurred while getting a post with id ${id} from database to edit: ${e}`);
        return Boom.internal(ResponseStrings.internalSomethingWentWrong);
    }

    if (!post) {
        return Boom.notFound(ResponseStrings.postNotFound);
    }
    else if (post.user.id !== userId) {
        return Boom.unauthorized(ResponseStrings.notAuhtorized);
    }
    post.title = title;
    post.text = text;
    try {
        return mapPostToReturnablePost(await postRepository.save(post));
    }
    catch(e) {
        console.log(`An error occurred while saving an edited post with id ${id}: ${e}`);
        return Boom.internal(ResponseStrings.internalSomethingWentWrong);
    }
}

export async function deletePostHandler(req: GetOrDeletePostRequest, h: Hapi.ResponseToolkit) {
    const {
        params: { id },
        auth: {
            credentials: {
                id: userId,
            },
        },
    } = req;

    let post: Post;
    try {
        post = await postRepository.findOne(id, { relations: ['user'] });
    }
    catch(e) {
        console.log(`An error occurred while getting a post with id ${id} from database to edit: ${e}`);
        return Boom.internal(ResponseStrings.internalSomethingWentWrong);
    }

    if (!post) {
        return Boom.notFound(ResponseStrings.postNotFound);
    }
    else if (post.user.id !== userId) {
        return Boom.unauthorized(ResponseStrings.notAuhtorized);
    }

    try {
        await postRepository.delete({ id });
        return h.response();
    }
    catch(e) {
        console.log(`An error occurred while deleting a post from database with id ${id}: ${e}`);
        return Boom.internal(ResponseStrings.internalSomethingWentWrong);
    }
}

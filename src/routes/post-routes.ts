import * as Hapi from '@hapi/hapi';
import { getAllPostsHandler, getPostHandler, createPostHandler, editPostHandler, deletePostHandler } from '../handlers/post-handlers';
import * as Joi from '@hapi/joi';

export default [
    {
        method: 'GET',
        path: '/post',
        handler: getAllPostsHandler,
        options: {
            auth: 'jwt',
            description: 'Get all posts from all users',
        },
    },
    {
        method: 'GET',
        path: '/post/{id}',
        handler: getPostHandler,
        options: {
            auth: 'jwt',
            description: 'Get post with id',
            validate: {
                params: Joi.object({
                    id: Joi.number().positive().required(),
                }),
            },
        },
    },
    {
        method: 'POST',
        path: '/post',
        handler: createPostHandler,
        options: {
            auth: 'jwt',
            description: 'Create a new post from payload',
            validate: {
                payload: Joi.object({
                    title: Joi.string().required(),
                    text: Joi.string().required(),
                }),
            },
        },
    },
    {
        method: 'PUT',
        path: '/post/{id}',
        handler: editPostHandler,
        options: {
            auth: 'jwt',
            description: 'Edit an existing post',
            validate: {
                payload: Joi.object({
                    title: Joi.string().required(),
                    text: Joi.string().required(),
                }),
                params: Joi.object({
                    id: Joi.number().positive().required(),
                }),
            },
        },
    },
    {
        method: 'DELETE',
        path: '/post/{id}',
        handler: deletePostHandler,
        options: {
            auth: 'jwt',
            description: 'Delete an existing post',
            validate: {
                params: Joi.object({
                    id: Joi.number().positive().required(),
                }),
            },
        },
    },
] as Hapi.ServerRoute[];
import { rule } from 'graphql-shield';

export const isAuthenticated = rule({ cache: 'contextual' })(async (_, __, ctx) => {
    console.log(ctx.userId);
    return ctx.userId !== null;
});

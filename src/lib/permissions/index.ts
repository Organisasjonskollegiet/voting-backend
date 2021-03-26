import { shield } from 'graphql-shield';
import { isAuthenticated } from './rules';

const permissions = shield({
    Query: {
        users: isAuthenticated,
        user: isAuthenticated,
    },
    Mutation: {
        users: isAuthenticated,
    },
});

export default permissions;

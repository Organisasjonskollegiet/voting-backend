import { shield } from 'graphql-shield';
import { isAuthenticated } from './rules';

const permissions = shield({
    Query: {
        users: isAuthenticated,
    },
});

export default permissions;

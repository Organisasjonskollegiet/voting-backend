import casual from 'casual';

const simpleMock = {
    User: () => ({
        id: () => casual.uuid,
        username: () => casual.username,
        email: () => casual.email,
    }),
    Meeting: () => ({
        id: () => casual.uuid,
        title: () => casual.title,
        startTime: () => casual.date('YYYY-MM-DD hh:mm:ss'),
        description: () => casual.text,
        owner: () => ({ __typename: 'User' }),
        votations: () => [],
        status: () => 'UPCOMING',
    }),
    Query: () => ({
        users: () => new Array(casual.integer(2, 6)).fill({ __typename: 'User' }),
        meetings: () => new Array(casual.integer(2, 6)).fill({ __typename: 'Meeting' }),
    }),
};

export default simple_mock;

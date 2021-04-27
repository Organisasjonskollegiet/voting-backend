import { createTestContext } from '../../../lib/tests/testContext';
import { gql } from 'graphql-request';
const ctx = createTestContext();

test('developer sanity test', () => {
    expect(2 + 2).toEqual(4);
});

it('Should return my user🤠', async () => {
    const user = await ctx.prisma.user.findUnique({ where: { id: ctx.userId } });
    if (!user) fail('No such user');
    const getUser = await ctx.client.request(
        gql`
            query {
                user {
                    __typename
                    ... on User {
                        email
                        emailVerified
                    }
                    ... on UserNotFoundError {
                        message
                    }
                }
            }
        `
    );

    expect(getUser).toMatchInlineSnapshot(`
        Object {
          "user": Object {
            "__typename": "User",
            "email": "${user.email}",
            "emailVerified": ${user.emailVerified},
          },
        }
    `);
});

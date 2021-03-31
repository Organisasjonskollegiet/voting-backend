import { createTestContext } from '../../../lib/tests/testContext';
import casual from 'casual';
import { gql } from 'graphql-request';
const ctx = createTestContext();

test('developer sanity test', () => {
    expect(2 + 2).toEqual(4);
});

it('should return something 🤣', async () => {
    const email = casual.email;
    const createUser = await ctx.client.request(
        gql`
            mutation CreateUserTest($email: String!, $password: String!) {
                createUser(user: { email: $email, password: $password }) {
                    email
                    emailVerified
                }
            }
        `,
        { email, password: casual.password }
    );
    expect(createUser).toMatchInlineSnapshot(`
        Object {
          "createUser": Object {
            "email": "${email}",
            "emailVerified": false,
          },
        }
    `);
});

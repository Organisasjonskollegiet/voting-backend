import { createTestContext } from '../../../lib/tests/testContext';
import casual from 'casual';
import { gql } from 'graphql-request';
const ctx = createTestContext();

test('developer sanity test', () => {
    expect(2 + 2).toEqual(4);
});

it('should return something 🤣', async () => {
    const email = casual.email;
    const username = casual.username;
    const createUser = await ctx.client.request(
        gql`
            mutation AddUserTest($username: String!, $email: String!) {
                addUser(user: { username: $username, email: $email }) {
                    username
                    email
                }
            }
        `,
        { email, username }
    );
    console.log(createUser);
    expect(createUser).toMatchInlineSnapshot(`
        Object {
          "addUser": Object {
            "email": "${email}",
            "username": "${username}",
          },
        }
    `);
});
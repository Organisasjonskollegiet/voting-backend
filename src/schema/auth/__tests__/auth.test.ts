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
            mutation AddUserTest($email: String!, $password: String!) {
                addUser(user: { email: $email, password: $password }) {
                    email
                }
            }
        `,
        { email, password: casual.password }
    );
    console.log(createUser);
    expect(createUser).toMatchInlineSnapshot(`
        Object {
          "addUser": Object {
            "email": "${email}",
          },
        }
    `);
});

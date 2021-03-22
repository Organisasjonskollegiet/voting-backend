import casual from "casual";

const simple_mock = {
  User: () => ({
    id: () => casual.uuid,
    username: () => casual.username,
    email: () => casual.email,
  }),
  Query: () => ({
    users: () => new Array(casual.integer(2, 6)).fill({ __typename: "User" }),
  }),
};

export default simple_mock;

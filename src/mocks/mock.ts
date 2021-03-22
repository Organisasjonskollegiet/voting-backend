import { IMocks, MockList } from "apollo-server";
import faker from "faker";
import casual from "casual";

const ApiMock: IMocks = {
  User: () => ({
    id: () => casual.integer(),
    username: () => casual.username,
    email: () => casual.email,
  }),
};

export default ApiMock;

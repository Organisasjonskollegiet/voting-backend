# Starting

To quickly start the server in mockmode run:

```
docker run -e MOCKING=true -p 4000:4000 voting-backend
```

This is a version of the API which uses `casual` for mocking. The data wont actually come from a database, but its nice for frontend developers to chill

To run up a postgres database in a docker container which can be used locally and is compatible with .env.local

```
docker run --name votingdb -p 5432:5432 -e POSTGRES_PASSWORD=votingsecret -e POSTGRES_DB=votingdb -d postgres
```

# Relevant scripts

### `yarn generate`

After making updates to the prisma schema, running this command will generate a migration.

### `npx migrate dev`

Migrate new updates of the prisma schema to the local database.

### `npx prisma studio`

Lets you see and edit the content of the database.

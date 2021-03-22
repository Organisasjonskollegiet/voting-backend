# Starting

To quickly start the server in mockmode run:

```
docker run -e MOCKING=true -p 4000:4000 voting-backend
```

This is a version of the API which uses `casual` for mocking. The data wont actually come from a database, but its nice for frontend developers to chill

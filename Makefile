startdb:
	@docker run --name votingdb -e POSTGRES_PASSWORD=votingsecret -d postgres

stopdb:
	@docker stop votingdb
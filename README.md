# Example CloudEvents subscriber

This is a simple subscriber for CloudEvents, written in Typescript to run as an Azure Function.
It exposes one endpoint, which accepts both OPTIONS and POST calls.
It is also stateless, so an existing subscriptions survives a redeploy.
Subsequent subscription initializations is also perfectly fine, as long as the expected header has the expected value.

## Auth

Authentication is done by validating the incoming JWT in code. 
This is to show how one can simply validate the incoming JWT, issued by Azure, to handle the authentication of incoming events.
Some of the claims in the token will be general to the sending service, while the aud claim will always be receiver specific.

## Links

For the CloudEvents specification, [visit this GitHub repository](https://github.com/cloudevents/spec).

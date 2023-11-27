# Example CloudEvents subscriber

This is a simple subscriber for CloudEvents, written in Typescript to run as an Azure Function.
It exposes one endpoint, which accepts both OPTIONS and POST calls.
It is also stateless, so an existing subscriptions survives a redeploy.
Subsequent subscription initializations is also perfectly fine, as long as the expected header has the expected value.

For the CloudEvents specification, [visit this GitHub repository](https://github.com/cloudevents/spec).

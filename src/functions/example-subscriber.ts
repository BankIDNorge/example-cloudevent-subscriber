import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  output,
} from "@azure/functions";

const initEventTypeNotation = "no.bankid.bass.audit.reissue.init.v1";
const successEventTypeNotation = "no.bankid.bass.audit.reissue.completed.v1";

const known_webhook_sender = "eventgrid.azure.net";

type InitEvent = {
  sessionId: string;
  authentication: "BIM";
  orderID: string;
  action: "REISSUE";
  status: "BEGIN";
};

type CompletedEvent = {
  sessionId: string;
  authentication: "BIM";
  orderID: string;
  time: string;
  action: "REISSUE";
  status: "SUCCESS" | "FAILED";
  additionalInfo?: string;
};

type CloudEvent = {
  id: string;
  source: "example";
  data: InitEvent | CompletedEvent;
  type: typeof initEventTypeNotation | typeof successEventTypeNotation;
  specversion: "1.0";
  datacontenttype: "application/json";
};

export async function exampleSubscriber(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  context.trace("method", request.method);
  context.trace("headers ", request.headers);

  if (
    !request.headers
      .get("content-type")
      .includes("application/cloudevents+json")
  ) {
    context.warn("Invalid content-type header");
    context.trace(`content-type: ${request.headers.get("content-type")}`);
    return { status: 500, body: "Invalid request" };
  }

  // Please note that you should do more validation than this in a real world scenario
  if (request.headers.get("authorization") == null) {
    context.warn("Missing authorization header");
    return { status: 403, body: "No access" };
  }

  if (request.method.toLowerCase() == "options") {
    return validateCloudEventSubscription(request, context);
  }

  if (request.body == null) {
    return { status: 500, body: "Invalid request" };
  }

  const requestBody = (await request.json()) as CloudEvent;

  context.trace("requestBody " + JSON.stringify(requestBody));

  switch (requestBody.type) {
    case initEventTypeNotation:
      context.log(`Got an init event`);
      const initEvent = requestBody.data as InitEvent;
      context.extraOutputs.set(storageQueueOutput, initEvent);
      return { status: 200 };
    case successEventTypeNotation:
      context.log(`Got a completed event`);
      const completedEvent = requestBody.data as CompletedEvent;
      context.extraOutputs.set(storageQueueOutput, completedEvent);
      return { status: 200 };
    default:
      context.log(`Got unknown event type: ${requestBody.type}`);
      return { status: 500, body: "Invalid request" };
  }
}

function validateCloudEventSubscription(
  request: HttpRequest,
  context: InvocationContext
): HttpResponseInit {
  const webhookRequestOrigin = request.headers.get("webhook-request-origin");

  if (
    webhookRequestOrigin == null ||
    webhookRequestOrigin != known_webhook_sender
  ) {
    context.log(
      "Invalid webhook-request-origin header value: " + webhookRequestOrigin
    );
    return { status: 500, body: "Invalid request" };
  }

  return {
    status: 200,
    headers: {
      "WebHook-Allowed-Origin": webhookRequestOrigin,
      "WebHook-Allowed-Rate": "100",
      Allow: "POST, OPTIONS",
    },
  };
}

const storageQueueOutput = output.storageQueue({
  connection: "AzureWebJobsStorage",
  queueName: "received-events",
});

app.http("example-subscriber", {
  methods: ["OPTIONS", "POST"],
  extraOutputs: [storageQueueOutput],
  handler: exampleSubscriber,
});

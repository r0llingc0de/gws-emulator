# Genesys Chat Mock Server

The following is an example server which can be used to emulate the capability of the HTCC e-Services chat server.  Chat threads are persisted to disk and therefore the server can be restarted without fear of losing data.

When a client initiates a chat thread with the server, an "agent" participant joins at a random interval shortly thereafter (< 5 seconds).  As each message is submitted from the client, another message is added from the "agent" to the thread using a non-scientific method of evaluating the last character from the client's message and attempting to respond with an appropriate string.

## Setup

```
$ npm install
```

## Run

You may specify an optional port by setting a `PORT` environment variable to the port you wish to listen on.

```
$ node server.js
```

Once started, two subdirectories will be created `logs` and `chats`.  In them you may find associated persisted data.

```
.
+-- README.md
+-- client/
+-- server/
  +-- log4js.json
  +-- manager.js
  +-- package.json
  +-- server.js
  +-- logs/
  +-- chats/
```


## RESTful API

Presently there is no authentication of any sort on any of the exposed endpoints (no API key, etc).

### RequestChat ##

#### Overview

This operation submits a new chat request for the website visitor / customer. After successfully sending this request to start the chat, you should begin checking for updated state and new messages periodically.

```
POST /api/v2/chats
```

**Parameters**

| Name | Type | Value |
|:-----|------|-------|
| operationName | string | `RequestChat` |
| nickname | string | Nickname of the customer requesting chat |
| subject | string | Subject of the chat request |

**Example**

```json
{
    "operationName": "RequestChat",
    "nickname": "James",
    "subject": "Question about relativity"
}
```

**Response**

`Status: 200 OK`
```json
{ 
  "id" : "652492d9-c2d9-44c9-b9ad-0ab7984114bb",
  "statusCode" : 0,
  "path" : "/api/v2/chats/652492d9-c2d9-44c9-b9ad-0ab7984114bb"
}
```

### SendStartTypingNotification ##

#### Overview

This operation notifies the chat that the customer has started typing.

```
POST /api/v2/chats/:id
```

**Parameters**

| Name | Type | Value |
|:-----|------|-------|
| operationName | string | `SendStartTypingNotification` |

**Example**

`POST /api/v2/chats/652492d9-c2d9-44c9-b9ad-0ab7984114bb`
```json
{
    "operationName": "SendStartTypingNotification"
}
```

**Response**

`Status: 200 OK`
```json
{ 
  "statusCode" : 0,
}
```

### SendStopTypingNotification ##

#### Overview

This operation notifies the chat that the customer has stopped typing.

```
POST /api/v2/chats/:id
```

**Parameters**

| Name | Type | Value |
|:-----|------|-------|
| operationName | string | `SendStopTypingNotification` |

**Example**

`POST /api/v2/chats/652492d9-c2d9-44c9-b9ad-0ab7984114bb`
```json
{
    "operationName": "SendStopTypingNotification"
}
```

**Response**

`Status: 200 OK`
```json
{ 
  "statusCode" : 0,
}
```

### SendMessage ##

#### Overview

This requests sends a new text message to the chat.

```
POST /api/v2/chats/:id
```

**Parameters**

| Name | Type | Value |
|:-----|------|-------|
| operationName | string | `SendMessage` |
| text | string | The text to be sent |

**Example**

`POST /api/v2/chats/652492d9-c2d9-44c9-b9ad-0ab7984114bb`
```json
{
    "operationName": "SendMessage",
    "text": "Are you there?"
}
```

**Response**

`Status: 200 OK`
```json
{ 
  "statusCode" : 0,
}
```

### Complete ##

#### Overview

This operation is used to complete the chat. After sending this request, no further requests should be sent for the chat.

```
POST /api/v2/chats/:id
```

**Parameters**

| Name | Type | Value |
|:-----|------|-------|
| operationName | string | `Complete` |

**Example**

`POST /api/v2/chats/652492d9-c2d9-44c9-b9ad-0ab7984114bb`
```json
{
    "operationName": "Complete"
}
```

**Response**

`Status: 200 OK`
```json
{ 
  "statusCode" : 0,
}
```

### GetChat ##

#### Overview

This request returns the specified chat resource. Send this request periodically to keep state up to date.

```
GET /api/v2/chats/:id
```

**Parameters**

| Name | Type | Value |
|:-----|------|-------|
| *N/A* | *N/A* | *N/A* |

**Example**

```
GET /api/v2/chats/652492d9-c2d9-44c9-b9ad-0ab7984114bb
```

**Response**

`Status: 200 OK`
```json
{
    "chat": {
        "capabilities": [
            "SendMessage",
            "SendStartTypingNotification",
            "SendStopTypingNotification",
            "Complete"
        ],
        "id": "652492d9-c2d9-44c9-b9ad-0ab7984114bb",
        "participants": [
            {
                "nickname": "Chris",
                "participantId": "1",
                "type": "Customer"
            }
        ],
        "state": "WaitingForAgent"
    },
    "statusCode": 0
}
```

### GetTranscript ##

#### Overview

Send this request periodically to retrieve new chat messages. By specifying the index parameter, previous messages can be recovered (ex. index=0 will return all messages).

```
GET /api/v2/chats/:id/messages
```

**Parameters**

| Name | Type | Value |
|:-----|------|-------|
| index | int | **Optional**. The index of the first entry to return. If not specified, will return messages that the client has not received yet. |

**Example**

```
GET /api/v2/chats/652492d9-c2d9-44c9-b9ad-0ab7984114bb/messages
```

**Response**

`Status: 200 OK`
```json
{
    "messages": [
        {
            "from": {
                "nickname": "Chris",
                "participantId": "1",
                "type": "Customer"
            },
            "index": 1,
            "type": "ParticipantJoined"
        },
        {
            "from": {
                "nickname": "Chris",
                "participantId": "1",
                "type": "Customer"
            },
            "index": 2,
            "text": "Hello?",
            "type": "Text"
        },
        {
            "from": {
                "nickname": "Kristi Sippola",
                "participantId": "2",
                "type": "Agent"
            },
            "index": 3,
            "type": "ParticipantJoined"
        }
    ],
    "statusCode": 0
}
```

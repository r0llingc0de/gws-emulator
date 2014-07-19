# Meta Chats

For chats with multiple agents or agents and supervisors it's handy to be able for them to chat with each other without the customer seeing it.
Agent also has ability to broadcast an emergency message to a supervisor.

## Node modules
npm install twilio
npm install urlencode

### SMS Messaging

If you want the app to send a text to your phone then update the Twilio object creation in server/broadcasters.js

### Running

node server.js (like normal)

from web browser go to:
	localhost:8888/client  (for customer role)
	localhost:8888/client-agent (for agent/supervisor role)


To send an emergency message type "#911 <message>"

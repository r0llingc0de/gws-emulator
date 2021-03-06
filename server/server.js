//
// server.js handles the incoming requests
//
var _ = require('underscore'),
    fs = require('fs'),
    express = require('express'),
    http = require('http'),
    log4js = require('log4js'),
    manager = require(__dirname + '/manager.js'),
    sprintf = require('sprintf').sprintf,
    broadcaster = require(__dirname + '/broadcasters.js');    

// create log directory if missing
if (!fs.existsSync(__dirname + '/logs')) {
    fs.mkdirSync(__dirname + '/logs');
}
// configure log4js
log4js.configure(__dirname + '/log4js.json');
var logger = log4js.getLogger('com.genesys.chat');

// catchall error logger
function logErrors(err, req, res, next) {
    logger.error(err.stack);
    next(err);
}

// catchall error handler
function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error', {
        error: err
    });
}

// attempts to convert a message payload into a JSON object
function messageToJSON(message) {
    var result = {};
    result.success = false;
    result.json = {};
    result.original = message;

    try {
        result.json = JSON.parse(message);
        result.success = true;
        logger.debug(sprintf('>> %s', JSON.stringify(result.json)));
    } catch (e) {
        logger.warn(sprintf('invalid message payload >> %s <<', message));
    }
    return result;
}

//
// initialize express
//
var app = express();
app.use(logErrors);
app.use(errorHandler);
app.use('/client', express.static(__dirname + '/../client'));
app.use('/client-agent', express.static(__dirname + '/../client-agent'));
app.use('/core-client', express.static(__dirname + '/../core-client'));
app.set('port', process.env.PORT || 8888);

app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Accept, ContactCenterId, Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});

// new chat thread request
app.post('/api/v2/chats', function(req, res) {

    var payload = '';
    req.on('data', function(chunk) {
        payload += chunk;
    });

    req.on('end', function() {
        var parsed = messageToJSON(payload);
        var msg = parsed.json;

        if (parsed.success && msg.operationName && 'RequestChat' === msg.operationName) {
            if (msg.nickname && (msg.subject || msg.chatId)) {
            	var chat = null;
            	var participantId = null;
            	if(msg.chatId){ //join chat
            		chat = manager.joinChat(msg.nickname, msg.chatId);
            		participantId = chat.participants[chat.participants.length-1].participantId;
            	}else { //init chat
	                chat = manager.initChat(msg.nickname, msg.subject);
            		participantId = chat.participants[0].participantId;
            	}
                logger.info(sprintf('success [id=%s, operation=%s, nickname=%s, subject=%s]', chat.id, msg.operationName, msg.nickname, msg.subject));
                
                var reply = {
                    'id': chat.id,
                    'statusCode': 0,
                    'path': '/api/v2/chats/' + chat.id,
                    'pid': participantId
                };
                res.status(200).json(reply);
                logger.debug(sprintf('<< %s', JSON.stringify(reply)));
                return;
            }
        }
        logger.info(sprintf('fail [id=%s, operation=%s]', id, msg.operationName));
        res.send(400);
    });

});

//GET chat list request
app.get('/api/v2/chats', function(req, res) {

	var chatList = manager.getChatList();
    var reply = {
        'chatList': chatList,
        'statusCode': 0              
    };
    res.status(200).json(reply);
    logger.debug(sprintf('<< {statusCode=%s}', reply.statusCode));
    return;
       
});

// all in-chat operations
app.post('/api/v2/chats/:id', function(req, res) {

    var payload = '';
    req.on('data', function(chunk) {
        payload += chunk;
    });

    req.on('end', function() {
        var parsed = messageToJSON(payload);
        var msg = parsed.json;
        var id = req.param('id');
        var participantId = msg.pid;
        if (parsed.success && msg.operationName && id) {
            var complete = false;
            switch (msg.operationName) {
                case 'SendMessage':
                    complete = manager.sendMessage(id, msg.text, participantId);
                    if (msg.text.indexOf("#911")==0) {
                    	broadcaster.sendMessage(msg.text.substring(5, msg.text.length));
                    }
                    break;
                case 'SendStartTypingNotification':
                    complete = manager.sendTypingStartNotification(id, participantId);
                    break;
                case 'SendStopTypingNotification':
                    complete = manager.sendTypingStopNotification(id, participantId);
                    break;
                case 'Complete':
                    complete = manager.completeChat(id, participantId);
                    break;
                default:
                    res.send(405);
                    return;
            }

            if (complete) {
                logger.info(sprintf('success [id=%s, operation=%s, pid=%s]', id, msg.operationName, participantId));
                var reply = {
                    'statusCode': 0
                };
                res.status(200).json(reply);
                logger.debug(sprintf('<< %s', JSON.stringify(reply)));
                return;
            }
        }
        logger.info(sprintf('fail [id=%s, operation=%s, pid=%s]', id, msg.operationName, participantId));
        res.send(400);
    });
});

// chat metadata request
app.get('/api/v2/chats/:id', function(req, res) {
    var id = req.param('id');
    logger.debug(sprintf('>> GET chat %s', id));
    var chat = manager.getChat(id);
    if (chat) {
        logger.info(sprintf('success [id=%s, operation=GetChat]', id));
        res.status(200).json(chat);
        logger.debug(sprintf('<< %s', JSON.stringify(chat)));
        return;
    }
    logger.warn(sprintf('fail [id=%s, operation=GetChat]', id));
    res.status(400).send('Chat not found ' + id);
});

// chat transcript request
app.get('/api/v2/chats/:id/messages', function(req, res) {
    var id = req.param('id');
    var index = req.query.index;
    logger.debug(sprintf('>> GET transcript %s, index=%s', id, index));
    var transcript = manager.getTranscript(id, index);
    if (transcript) {
        logger.info(sprintf('success [id=%s, operation=GetChatMessages, index=%s]', id, index));
        res.status(200).json(transcript);
        logger.debug(sprintf('<< %s', JSON.stringify(transcript)));
        return;
    }
    logger.warn(sprintf('fail [id=%s, operation=GetChatMessages, index=%s]', id, index));
    res.status(400).send('Chat not found ' + id);
});

// ...and run!
http.createServer(app).listen(app.get('port'), function() {
    logger.info('Chat server listening on port ' + app.get('port'));
});

// Twilio broadcaster
function Twilio(acctId, authToken, from, to) {
	// Twilio Credentials 
	this.accountSid = acctId; 
	this.authToken = authToken; 
	this.from = from;
	this.to = to;
	
	//require the Twilio module and create a REST client 
	this.client = require('twilio')(this.accountSid, this.authToken); 
}
Twilio.prototype.sendMessage = function(message) {
	this.client.messages.create({ 
		to: this.to, 
		from: this.from, 
		body: message,   
	}, function(err, message) { 
		console.log(message.sid); 
	});
};

// UBI broadcaster
function Ubi(host, path) {
	this.options = {
			hostname: host,
			path: path
	};
	this.callback = function(response) {
		  var str = '';

		  //another chunk of data has been recieved, so append it to `str`
		  response.on('data', function (chunk) {
			  str += chunk;
		  });

		  //the whole response has been recieved, so we just print it out here
		  response.on('end', function () {
			  console.log(str);
		  });
	};
	
	this.http = require('https');
	this.urlencode = require('urlencode');
};
Ubi.prototype.sendMessage = function(message) {
	this.options.path += '&msg='+this.urlencode(message);
	
	this.http.request(this.options, this.callback).end();
};

// list of broadcasters that will send out the urgent message
var broadcasters = [ 
      new Twilio('ACbe612d94353dcc173f239e5f0acec2d5', 'b8b9766377d7e4532b6926d8b8edc3f4', '+14378000503', '+16474572575'),
      new Ubi('portal.theubi.com', '/webapi/behaviour?access_token=4ad16bb1-27f3-4c7d-8fa4-9db618027b26')];

// send message to all known broadcasters
exports.sendMessage = function(message) {
	for (var i=0; i<broadcasters.length; i++) {
		broadcasters[i].sendMessage(message);
	}
};
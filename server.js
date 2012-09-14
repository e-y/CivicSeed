var ss = require('socketstream'),
express = require('express'),
app = module.exports = express(),
server,
environment,
service,
config,
control,
passportConfig;

console.log('\n\n < < < = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = > > > '.green);
console.log(' < < < = = = = = = = = = = = =   Starting the Civic Seed Game Engine   = = = = = = = = = = = = > > > '.green.inverse);
console.log(' < < < = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = > > > '.green);

// Configuration and environmental files, etc.
environment = require('./environment.js');
service = require('./service.js');

// Setup database services, based on the environment
service.init(environment, function(databases) {

	control = require('./controllers.js')(app, service, environment);
	config = require('./configuration.js')(app, express, ss, environment, service, databases.mongooseDb);
	//passportConfig = require('./passportconfig.js')(app, service);

	// Start web server
	server = app.listen(process.env['app_port'] || 3000, function() {
		var local = server.address();
		console.log("Express server listening @ http://%s:%d/ in %s mode", local.address, local.port, app.settings.env);
	});

	// Start SocketStream
	ss.start(server);

	// Append SocketStream middleware to the stack
	app.stack = app.stack.concat(ss.http.middleware.stack);

});
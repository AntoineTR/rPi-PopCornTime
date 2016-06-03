/**
 * Module dependencies.
 */

var express = require('express')
  , app = express()  
  , server = require('http').createServer(app)
  , path = require('path')
  , io = require('socket.io').listen(server)
  , spawn = require('child_process').spawn
  , omx = require('omxcontrol')
 , request = require("request");


// all environments
app.set('port', process.env.TEST_PORT || 8080);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(omx());

//Routes
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

app.get('/remote', function (req, res) {
  res.sendfile(__dirname + '/public/remote.html');
});

//Socket.io Congfig
io.set('log level', 1);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//Run and pipe shell script output 
function run_shell(cmd, args, cb, end) {
    var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        me = this;
    child.stdout.on('data', function (buffer) { cb(me, buffer) });
    child.stdout.on('end', end);
}

//Save the Screen Socket in this variable
var ss;
//Socket.io Server
io.sockets.on('connection', function (socket) {
socket.on('disconnect', function(){
    console.log('user disconnected');
  });
 socket.on("screen", function(data){
   socket.type = "screen";
   ss = socket;
   console.log("Screen ready...");
 });
 socket.on("remote", function(data){
   socket.type = "remote";
   console.log("Remote ready...");
 });

 socket.on("jsonAPI", function(data){
   socket.type = "jsonAPI";

	var url = "https://api-fetch.website/tv/movies/1"

	request({
	    url: url,
	    json: true
	}, function (error, response, body) {

	    if (!error && response.statusCode === 200) {
	        socket.emit("jsonAPIResponse", body);
	    }
	    else{
	    	console.log(error);
	    }
	})
 })
socket.on("movieAPI", function(data){
	var url = "https://api-fetch.website/tv/movie/" + data;
	request({
	    url: url,
	    json: true
	}, function (error, response, body) {
		console.log(body);
		var magnet = '"' + body.torrents['1080p'].url + '"';
		console.log(magnet);
		if (!error && response.statusCode === 200) {
	        //var runShell = new run_shell('peerflix',[magnet,' --vlc']);
		    var ls = spawn('peerflix', ['magnet', '--vlc']);    
      
	    }
	})
})

});
/**
 * Module dependencies.
 */

var express = require('express')
  , app = express()  
  , server = require('http').createServer(app)
  , path = require('path')
  , io = require('socket.io').listen(server)
  , spawn = require('child_process').spawn
  , omx = require('omxctrl')
 , request = require("request")
 , peerflix = require('peerflix');


// all environments
app.set('port', process.env.TEST_PORT || 8080);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(omx());

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
// First List 
 socket.on("jsonAPI", function(data){
   socket.type = "jsonAPI";

	var url = "https://api-fetch.website/tv/movies/1?Sort=Rating&order=-1"

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

//Search
socket.on("movieSearch", function(data){
   

	var url = "https://api-fetch.website/tv/movies/1?keywords=" + data;

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
var omxplayer;
var engine;
socket.on("movieAPI", function(data){
		var magnet = '"' + data + '"';
		console.log(magnet);
		engine = peerflix(magnet, {
			connections: 100,
		});
		engine.server.on('listening', function(){
			console.log('listening');
			console.log(engine.server.address().port);
			omx.play('http://raspberrypi.local:' + engine.server.address().port + '/', ['-b']);
			});
	   /* omxplayer = spawn('peerflix', [magnet, '--omx', '--', '-b'], {
			stdio: 'inherit'
	    })   
		omxplayer.on('error', (err) => {
			console.log(err)
			process.exit(0)
		})
		omxplayer.on('exit', (data) => {
			console.log('Exiting...')
			//process.exit(0);
		}) 
		var engine = torrentStream(magnet);
		engine.on('ready', function() {
			engine.files.forEach(function (file){
				console.log('filename:', file.name);
				var stream = file.createReadStream();
				console.log(stream);
				omx.start(file);
			});
		});
		*/
	    
	
})
socket.on("stopMovie", function(data){
		console.log('Stopping movie..');
		omx.stop();
	
})
socket.on("pauseMovie", function(data){
		console.log('Pausing movie..');
		omx.pause();
	
})
socket.on("forwardMovie", function(data){
		console.log('Pausing movie..');
		omx.seekFastFoward();
	
})
socket.on("backwardMovie", function(data){
		console.log('Pausing movie..');
		omx.seekFastBackward();
	
})

});

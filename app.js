

console.log("Chat Server v0.0.1.1");
var crypto = require('crypto');
var fs = require('fs');
var io = require('socket.io').listen(2998, {secure: true});
//require("util").print("\u001b[2J\u001b[0;0H");
io.configure(function(){
	io.enable('browser client minification');
	io.enable('browser client etag');
	io.enable('browser client gzip');
	io.set('log level', 1);
	io.set('transports', [
		'websocket',
		'flashsocket',
		'htmlfile',
		'xhr-polling',
		'jsonp-polling'
	]);
});

function hash(str,moresalt){
	return crypto
		.createHash('sha512')
		.update(
			"egassem+sdrawkcab_atlas"+str+"e_z"+moresalt+"_yay1337funtoo#toomuchsalt"+str.toUpperCase()+
			"http://img2.timeinc.net/health/images/slides/to-much-salt-400x400.jpg"//note: too, not to (is importnat)
		).digest('hex');
}

var mode = parseInt("770",8);
if(!fs.existsSync('db')){fs.mkdirSync('db',mode);}
if(!fs.existsSync('db/users')){fs.mkdirSync('db/users',mode);}

var online = {};

io.sockets.on('connection', function(socket) {
	// Keep track of the user associated with this socket
	var user = {
		socket: socket,
		logout: function(){
			if(this.uname){
				socket.broadcast.emit("logged-out",{
					uname: this.uname
				});
				delete online[this.uname];
			}
		},
		//(more stuff added on login)
		//uname: "username11",
		//name: "Full Name"?
	};
	
	socket.on('im', function(data){
		IM(data);
	});
});

function IM(data) {
	if(badArgs(data,{
		to: "username",
		message: "sup bro >:}",
	})) return;
	
	data.from = user.uname;
	data.time = +new Date();
	
	if(data.to==="@feedback"){
		fs.appendFile(
			"FEEDBACK",
			"<message from='"+data.from+"' at='"+data.time+"'>"+data.message.replace(/\u2029/g,'')+"</message>\n",
			function(err){
				if(err)console.error("feedback log error!?",err);
			}
		);
		if(online["1j01"]){
			data.from += "#feedback";
			online["1j01"].socket.emit('im', data);
		}
		//thxprops
		socket.emit("im",{from:"@feedback",message:"Thanks for your feedback probably!"});
	}else{
		// Pass it on.
		if(online[data.to]){
			online[data.to].socket.emit('im', data);
			//console.log(user.uname+' said "'+data.message+'" to '+data.to);
		}else{
			//console.log(user.uname+' tried to say "'+data.message+'" to '+data.to+', but '+data.to+" isn't online and logs aren't implemented. :(");
		}
		// Add the message to the log(s).
		fs.exists('db/users/'+data.to,function(exists){
			if(!exists){
				console.log("user does not exist:",data.to);
			}else{
				fs.appendFile(
					'db/users/'+data.to+"/"+data.from+".chat",
					"\u2029[:"+data.from+"@"+data.time+":]\n"+data.message.replace(/\u2029/g,'')+"\n",
					function(err){
						if(err)console.error("log error!",err);
					}
				);
			}
		});
	}
}
function createAccount(data, success, fail) {
	if(badArgs(data,{
		uname: "username",
		pash: "3ncryp73d_p4ssw0rd",
	})) return fail("Data fail.");
	
	if(!data.uname){
		return fail('Username required.');
	}
	if(data.uname.length<4){
		return fail('Username is too short. The minimum is 4 characters.');
	}
	if(data.uname.match(/[\[\/\\{<"'#@(*)>}\]]/gim)){
		return fail('Username cannot contain any of \\ / [ { < " \' # @ ( ) * > } ]');
	}
	for(var i in online){
		var u = online[i];
		if(u.socket == socket){
			return fail("You're already logged in."+u+","+socket);
		}
	}
	var fs = require('fs');
	fs.exists('db/users/'+data.uname,function(exists){
		if(exists){
			return fail('That username already exists.');
		}else{
			fs.mkdir('db/users/'+data.uname,mode,function(){
				user.uname = data.uname;
				data.pash = hash(data.pash,data.uname);
				user.timeAccountCreated = data.timeAccountCreated = 
					user.timeLastLoggedIn = data.timeLastLoggedIn = +new Date();
				
				fs.writeFile('db/users/'+data.uname+'/user.json', JSON.stringify(data), function(err,fd){
					if(err){
						console.warn("writeFile "+'db/users/'+data.uname+'/user.json failed!');
						return fail('Filesystem error!');
					}
					//just "to be safe", don't broadcast the password to every freaking person yh k
					delete data.pash;
					//yay
					return success(data);
				});
			});
		}
	});
}
function login(data, success, fail) {
	if(badArgs(data,{
		uname: "username",
		pash: "encrypted password"
	})) return fail("Data fail.");
	
	//console.log(data.uname+' is attempting to log in...');
	// When logs in, dump logs? or use REST?
	if(online[data.uname]){
		return fail(data.uname+" is already logged in.");
	}
	for(var i in online){
		var u = online[i];
		if(u.socket == socket){
			return fail("You're already logged in as "+u.uname);
		}
	}
	if(!data.uname){
		return fail('Username required.');
	}
	if(data.uname.length<4){
		return fail('Username is too short. The minimum is 4 characters.');
	}
	if(data.uname.match(/[\[\/\\{<"'#@(*)>}\]]/gim)){
		return fail('Username cannot contain any of \\ / [ { < " \' # @ ( ) * > } ]');
	}
	var fs = require('fs');
	fs.exists('db/users/'+data.uname,function(exists){
		if(!exists){
			return fail('User doesn\'t exist.');
		}else{
			fs.readFile('db/users/'+data.uname+"/user.json",function(err,json){
				if(err){
					console.warn("readFile "+'db/users/'+data.uname+'/user.json failed');
					return fail('Filesystem error!!!!!');
				}
				try{
					var jso = JSON.parse(json);
					if(jso.pash == hash(data.pash,data.uname)){
						
						user.uname = data.uname;
						online[user.uname] = user;
						//user.firstName = data.firstName = jso.firstName;
						//user.lastName = data.lastName = jso.lastName;
						user.timeLastLoggedIn = data.timeLastLoggedIn = +new Date();
						//console.log(data.uname+' logged in.');
						//console.log('logging in', user.uname);
						//data.timeStamp = new Date();
						
						// make doubly sure not to broadcast the password
						delete data.pash;
						// Broadcast that client has logged in
						// (this should only go to friends)
						return success(data);
					}else{
						//console.log("incorrect password");
						return fail('Incorrect password.');
					}
				}catch(e){
					console.error("parse "+'db/users/'+data.uname+'/user.json failed...',e.message);
					return fail('User data corrupted!');
				}
			});
		}
	});
}
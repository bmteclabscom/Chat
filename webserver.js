
//var fs = require('fs');
var walk = require('walk');
var express = require('express');
var directory = require('connect-directory');
var extensionless = require('extensionless');

var public = __dirname + '/public';

var ip = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "127.0.0.1"
var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080


module.exports = function(){
	var ex = express();
	ex.use(extensionless(public, ["html","png","svg","gif"]));
	ex.use(express.static(public));
	ex.get('/emotes-list', function(req, res){
		var walker = walk.walk('./public/res/emotes');
		var emotes = [];
		walker.on('file', function(dir, stat, next){
			res.write(dir.replace("./public","")+"/"+stat.name+'\n');
			next();
		});
		walker.on('end', function(){
			res.end([
				"http://i3.kym-cdn.com/photos/images/original/000/150/330/omnomnomnom.gif",
				"http://31.media.tumblr.com/tumblr_lgyexi5xvo1qhofrso1_500.gif"
			].join("\n"));
		});
	});
	//ex.use(directory(public));
	ex.use(express.errorHandler());
	ex.listen(port, ip);
	console.log('WebServer started at '+ip+':'+port);
};
var fs = require('fs');
//var logger = require('log4js').getLogger('MAIN');
var Beam = require('./');
var Password = require('./lib/providers/password');
var ChatService = require('./lib/services/chat');
var beam = new Beam();
beam.setUrl('http://localhost:1337/api/v1');
logger.info('EVA core initilazing! Beggining chat join sequence!');

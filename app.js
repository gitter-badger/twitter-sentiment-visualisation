
/* Include necessary node modules */
var express       = require('express');
var path          = require('path');
var favicon       = require('serve-favicon');
var logger        = require('morgan');
var cookieParser  = require('cookie-parser');
var bodyParser    = require('body-parser');
var mongoose      = require('mongoose');
var http          = require('http');
var mdirect = require('mobile-redirect');
var streamTweets  = require('stream-tweets');
var config        = require('./config/app-config');
var streamHandler = require('./utils/stream-handler');


/* Create Express server and configure socket.io */
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(config.server.port, function(){
    console.log('Express server listening on port ' + config.server.port);
});


/* view engine setup */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


/* Set up other Express bits and bobs */
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use(mdirect({redirectPath: '/mobile' }));

/* Connect to MongoDB */
mongoose.connect(config.db.URL);


/* Specify which route files to use */
app.use('/',            require('./routes/index'));
app.use('/search',      require('./routes/search'));
app.use('/map',         require('./routes/map'));
app.use('/region-map',  require('./routes/region-map'));
app.use('/globe',       require('./routes/globe'));
app.use('/timeline',    require('./routes/timeline'));
app.use('/about',       require('./routes/about'));
app.use('/text-tweets', require('./routes/text-tweets'));
app.use('/break-down',  require('./routes/break-down'));
app.use('/hexagons',    require('./routes/hexagons'));
app.use('/comparer',    require('./routes/comparer'));
app.use('/word-cloud',  require('./routes/word-cloud'));
app.use('/trending',    require('./routes/trending'));
app.use('/tone-analyzer',       require('./routes/tone-analyzer'));
app.use('/sa-comparison',       require('./routes/sa-comparison'));
app.use('/word-scatter-plot',   require('./routes/word-plot'));
app.use('/entity-extraction',   require('./routes/entity-extraction'));
//app.use('/real-time-dashboard', require('./routes/real-time'));
app.use('/api/tone',    require('./routes/tone-api'));
app.use('/api/entity',  require('./routes/entity-api'));
app.use('/api/db',      require('./routes/db-api'));
app.use('/api/trending',require('./routes/trending-api'));


mobileRoute  = express.Router();
mobileRoute.get('/', function(req, res, next) {
  return res.render('error', {
    message: 'Not compatible with your device :\'(',
    error: {}
  });
});

app.use('/mobile', mobileRoute);


/* Set a stream listener for tweets matching tracking keywords */
var credentials = require('./config/keys').twitter;
var twit = new streamTweets(credentials);
var world = [-180,-90,180,90];
stream =twit.stream({ locations: world}, function(stream){ streamHandler(stream,io); });

/* catch 404 and forward to error handler */
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


/*-- error handlers -- */

/* development error handler (will print stacktrace) */
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

/* production error handler (no stacktraces leaked to user) */
app.use(function(err, req, res) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;

var http     = require('http');
var express  = require('express');
var app      = express();
var getDb    = require('mongo-getdb');
var ObjectID = require('mongodb').ObjectID;
var db;

getDb('mongodb://localhost/mymdocs', function (_db) {
  db = _db;
});

app.configure(function (){
  this.set("view engine", "jade");
  this.set("views", __dirname + "/views");
  this.use(express.static(__dirname + '/public'));
  this.use(express.bodyParser());
});

app.get('/', function (req, res) {
  db.collection('documents')
    .find({
      content: {
        $regex:   req.query.search,
        $options: 'i'
      }
    }, { limit: 10 })
    .toArray(function (err, docs) {
      res.render('home', {docs: docs});
    });
});

//create a new document and redirect to the edit page.  
app.get('/new', function (req, res) {
  db.collection('documents').insert({
    content: 'NEW DOCUMENT'
  }, function (err, inserted) {
    if (err) return res.send(500, err);
    var doc = inserted[0];
    res.redirect('/doc/' + doc._id.toString());
  });
});

//render the document
app.get('/doc/:id', function (req, res) {
  db.collection('documents').findOne({_id: new ObjectID(req.params.id)}, function (err, doc) {
    if (err) return  res.send(500);
    if (!doc) return res.send(404);
    res.render('doc', doc);
  });
});

//save the document content
app.patch('/doc/:id', function (req, res) {
  var change = {};

  if (req.body.content){
    change.content = req.body.content; 
  }

  if (req.body.title) {
    change.title = req.body.title;
  }

  db.collection('documents').update({
    _id: new ObjectID(req.params.id)
  }, {
    $set: change
  }, function (err, count) {
    if (err) return res.send(500);
    if (count === 0) return res.send(404);
    res.send(200);
  });
});


http.createServer(app)
    .listen(8080, function () {
      console.log('listening on http://localhost:8080');
    });
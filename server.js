'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');

const cors = require('cors');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI);

const urlSchema = new mongoose.Schema({
  url: String,
  number: Number
});

const Url = mongoose.model('Url', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
const bodyParser = require('body-parser');

const dns = require('dns');

app.use('/public', express.static(process.cwd() + '/public'));

const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new", urlencodedParser, function (req, res) {
  try {
    const u=new URL(req.body.url);
    dns.lookup(u.hostname, (err, address, family)=>{
      if (err===null){
        Url.find().sort({number:-1}).limit(1).exec(function(err, doc){
          if (err) return console.error(err);
          const maxNumber = doc[0].number;
          console.log(maxNumber);
          const newUrl=new Url({ url: req.body.url, number: maxNumber+1 });
          newUrl.save(function (err, newUrl) {
          if (err) return console.error(err);
          });
          res.json({"original_url": req.body.url, "short_url": maxNumber+1 });
        });
      } else{
        res.json({"error": "invalid URL"});
      }
    });
  }
  catch(e) {
    res.json({"error": "invalid URL"});
  }

});

app.get("/api/shorturl/:number/", function (req, res) {
  Url.find({number:req.params.number},(err, doc)=>{
    if (err) return console.error(err);
    if (doc[0]!==undefined){
      res.redirect(doc[0].url);
    } else{
      res.redirect('/');
    }
  })
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
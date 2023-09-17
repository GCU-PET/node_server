const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;

var db;
MongoClient.connect('mongodb+srv://admin:aYLjvr74yzBVTbyl@cluster0.xli1los.mongodb.net/?retryWrites=true&w=majority', function(에러, client){
    if (에러) return console.log(에러);
    
    db = client.db('PETapp');
    var 저장할데이터 = { ID : 'test', PW : 'test' };
    db.collection('login').insertOne(저장할데이터, function(err, res) {
        console.log('저장완료');
    });
    app.listen(8080, function() {
        console.log('listening on 8080');
    });
});

app.get('/api/login', function(res, req) {
    req.send({ ID : 'test', PW : 'test' });
});
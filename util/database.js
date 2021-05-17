const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;
// 6jONMPxrSKLXwiKW
const mongoConnect = callback => {
    MongoClient.connect('mongodb+srv://weston:test1234@cluster0.yqxnp.mongodb.net/shop?retryWrites=true&w=majority')
    .then(client => {
        console.log('Connected');
        _db = client.db();
        callback();
    })
    .catch(err => {
        console.log(err);
        throw err;
    });
};

const getDb = () =>{
    if(_db){
        return _db;
    }
    throw 'No database found';
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

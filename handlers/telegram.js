const axios = require('axios')
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb+srv://tdd-userflow:x4AhR7r7dbK23Kzh@cloud-storage-mongo-atlas-p431u.gcp.mongodb.net/chat?authSource=admin&replicaSet=cloud-storage-mongo-atlas-shard-0&readPreference=primary&ssl=true";
var database = null

MongoClient.connect(url, {
    useUnifiedTopology: true
}, function(err, db) {
  if (err) throw err;
  database = db
});

const handler = {
    baseUrl: '/telegram/',
    baseRemote: (apikey, method)=>{return 'https://api.telegram.org/'+'bot'+apikey+(method ? '/' + method : '')},
}

handler.request = function(apikey, method, payload) {
    return new Promise((resolve, reject)=>{
        axios.post(handler.baseRemote(apikey, method))
            .then((response) => {
                if(!response.data) return res.send({status:500, error:"Empty response from Telegram"})
                if(response.data.ok) {
                    resolve(response.data.result)
                } else {
                    reject("Request did not return OK")
                }
            })
            .catch((error) => {
                reject("Telegram server rejected the request")
            })
    })
}

handler.failure = function(req,res,error){res.send({status:400,error:error || 'That didn\'t work'})}

handler.endpoints = [
    {
        type: 'post',
        url: 'checkIn',
        handler: function(apikey, req, res) {
            handler.request(apikey, 'getMe')
                .then((result)=>{
                    database.collection("bots").update( {
                        botid: result.id,
                        apikey: apikey
                    }, {
                        $set: {
                            botid: result.id,
                            apikey: apikey,
                            'cached.getMe': result
                        }
                    }, function(err, resul) {
                        if(!err) {
                            res.send({
                                status: 200,
                                bot: result
                            })
                        } else {
                            handler.failure(req, res, 'Failed to connect to internal database')
                        }
                    })
                })
                .catch((error)=>{
                    handler.failure(req, res, 'Fatal error')
                })
        }
    }
]

handler.start = function(app) {
    for(let i in handler.endpoints) {
        let endpoint = handler.endpoints[i]
        app[endpoint.type](handler.baseUrl+endpoint.url, function(req, res) {
            if(!req.header('X-API-KEY')) return res.send({status:403,error:'Please specify API key in X-API-KEY'})
            endpoint.handler(req.header('X-API-KEY'), req, res)
        }.bind({endpoint:endpoint}))
    }
    app.post('/telegram/webhook/:uid/:botid', (req, res)=>{
        if(!req.params.uid || !req.params.botid) return res.send('200')
    })
}

module.exports = handler.start
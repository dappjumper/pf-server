const axios = require('axios')

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
                    res.send({
                        status: 200,
                        bot: result,
                    })
                })
                .catch((error)=>{
                    handler.failure(req, res, error)
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
}

module.exports = handler.start
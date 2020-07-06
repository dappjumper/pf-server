const express = require('express')
const axios = require('axios')
const app = express()
const port = 8000
const bodyParser = require('body-parser')
const cors = require('cors')
app.use(cors())
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


const telegramDomain = 'https://api.telegram.org/'

const telegramEndpoint = function(apikey, method) {
    let finalUrl = telegramDomain+'bot'+apikey+(method ? '/' + method : '')
    return finalUrl
}

app.post('/telegram/checkIn', function (req, res) {
    if(!req.body.apikey) return res.send({
        error: "Please provide an API Key"
    })
    axios.post(telegramEndpoint(req.body.apikey, 'getMe'))
        .then((response) => {
            if(!response.data) return res.send({error:"Fatal error"})
            if(response.data.ok) {
                res.send({
                    platform: 'Telegram',
                    id: response.data.result.id,
                    username: response.data.result.username
                })
            } else {
                res.send({
                    error: 'Telegram bot not found'
                })
            }
        })
        .catch((error) => {
            res.send({
                error: "Telegram reports invalid API Key"
            })
        })
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
const express = require('express')

const app = express()
const port = process.env.PORT || 8000
const bodyParser = require('body-parser')
const cors = require('cors')
app.use(cors())
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

const telegramHandler = require('./handlers/telegram')(app)

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
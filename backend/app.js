const express = require('express')
const mqtt = require('mqtt')
const app = express()
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text());
/* app.use(express.json()) */

let value = {
    energy:''
}
const host = 'broker.emqx.io'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `mqtt://${host}:${port}`
const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'emqx',
  password: 'public',
  reconnectPeriod: 1000,
})

const topic = '4gi/electronique'
client.on('connect', () => {
  console.log('Connected')
  client.subscribe([topic], () => {
    console.log(`Subscribe to topic '${topic}'`)
  })

  /* client.publish(topic, 'nodejs mqtt test', { qos: 0, retain: false }, (error) => {
    if (error) {
      console.error(error)
    }
  }) */
})

client.on('message', (topic, payload) => {
  console.log('Received Message:', topic, payload.toString())
  value = JSON.parse(payload.toString())
  console.log(value)
})

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('content-type', 'application/json')
    next();
  });

app.get('/api',(req, res, next) => {
    res.status(200).json(value); 
 });

app.post('/api', (req, res)=>{
    console.log(req.body)
    //let mes = JSON.parse(req.body)
    client.publish("inTopic", req.body , { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      })
      
      res.status(201).json({
        message: 'Objet créés !'
      });
})
module.exports = app;

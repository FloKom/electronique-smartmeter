const express = require('express')
const mqtt = require('mqtt')
const Energy =  require('./models/energy')
const User =  require('./models/user')
var nodemailer = require('nodemailer');
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const app = express()
let present = true
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
/* app.use(express.json()) */

mongoose.connect('mongodb+srv://florian:florian22@cluster0.xp1cc.mongodb.net/smartMeter?retryWrites=true&w=majority',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'enspygi2023@gmail.com',
    pass: 'promogi_2023'
  }
});
let energies
let emailScheduler = {}
let value = {
    energy:''
}
let users
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

  Energy.find().then(
    (energies) => {
      for(let measure of energies){
        if( ( ((new Date(measure.date)).getMonth()) == ((new Date(Date.now())).getMonth())) && ( ((new Date(measure.date)).getDate()) === ((new Date(Date.now())).getDate()) ) && ( ((new Date(measure.date)).getFullYear()) === ((new Date(Date.now())).getFullYear()) )){
          present = false
          const energy = new Energy({
            _id: measure._id,
            energy: value.finalEnergyValue,
            date: measure.date
          });
          Energy.updateOne({_id: measure._id}, energy).then(
            () => {
              console.log('enregistrer avec success')
            }
          ).catch(
            (error) => {
              console.log(error)
            }
          );
        }
      }
      if(present){
        const energy = new Energy({
          energy: value.finalEnergyValue,
          date: Date.now()
        });
        energy.save().then(
          console.log("save successfull !")
        ).catch(
          (error) => {
            console.log(error)
          }
        );
      }
    }
  ).catch(
    (error) => {
     console.log(error)
    }
  );
 
  

})

User.find().then(
  (users) => {
    for(let i = 0; i<users.length; i++){
      emailScheduler[users[i].email] = setInterval(() => {
        console.log("hello")
        var mailOptions = {
          from: 'enspygi2023@gmail.com',
          to: users[i].email,
          subject: 'votre consommation d\'energie',
          text: 'Bonjour, votre consommation d\'energie est de: ' + value.finalEnergyValue + 'qui correspond a un cout de: '
        };
        
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
    
      }, users[i].periode);    
    }
  }
).catch(
  (error) => {
   console.log(error)
  }
);


console.log(users)



app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('content-type', 'application/json')
    next();
  });

app.get('/api',(req, res) => {
    res.status(200).json(value); 
 });
//console.log(emailScheduler)
app.post('/api/signUp', (req, res)=>{
    bcrypt.hash(req.body.password, 10)
    .then(hash => {
        const user = new User({
            email: req.body.email,
            password: hash,
            periode:2*60*1000
        });
        emailScheduler[user.email] = setInterval(() => {
          console.log("hello")
          var mailOptions = {
            from: 'enspygi2023@gmail.com',
            to: user.email,
            subject: 'votre consommation d\'energie',
            text: 'Bonjour, votre consommation d\'energie est de: ' + value.finalEnergyValue + 'qui correspond a un cout de: '
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
      
        }, user.periode);
        user.save()
            .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
            .catch(error => res.status(400).json({ error }));
          })
          .catch(error => res.status(500).json({ error }));      
});

app.post('/api/signIn', (req,res)=>{
  User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Utilisateur non trouvé !' });
      }
      bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) {
            return res.status(401).json({ error: 'Mot de passe incorrect !' });
          }
          res.status(200).json({
            userId: user._id,
            email: req.body.email,
            periode: user.periode,
            password: user.password
            
          });
        })
        .catch(error => res.status(500).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
})

app.put('/api/periode', (req, res)=>{
  
  clearInterval(emailScheduler[req.body.email])
  
  const user = new User({
    _id:req.body.userId,
    email: req.body.email,
    periode:req.body.periode,
    password:req.body.password
  });
  User.updateOne({_id: req.body.userId}, user).then(
    () => {
      emailScheduler[user.email] = setInterval(() => {
        console.log("hello")
        var mailOptions = {
          from: 'enspygi2023@gmail.com',
          to: user.email,
          subject: 'votre consommation d\'energie',
          text: 'Bonjour, votre consommation d\'energie est de: ' + value.finalEnergyValue + 'qui correspond a un cout de: '
        };
        
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
    
      }, user.periode);
      res.status(201).json({
        message: 'Thing updated successfully!'
      });
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
  
});

app.put('/api/changePassword',(req, res)=>{
  
  bcrypt.hash(req.body.password, 10)
        .then(hash => {
        const user = new User({
            _id:req.body.userId,
            email: req.body.email,
            password: hash,
            periode: req.body.periode
        });
        User.updateOne({_id: req.body.userId}, user).then(
          () => {
            res.status(201).json({
              message: 'Thing updated successfully!'
            });
          }
        ).catch(
          (error) => {
            res.status(400).json({
              error: error
            });
          }
        );
        
      })
    })
  
app.post('/api', (req, res)=>{       
    console.log(req.body)
    //let mes = JSON.parse(req.body)
    client.publish("inTopic", req.body.etat , { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      })
      
      res.status(201).json({
        message: 'Objet créés !'
      });
})
module.exports = app;

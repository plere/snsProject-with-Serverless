const awsServerlessExpress = require('aws-serverless-express');
const express = require('express');
const path = require('path');
var cookieParser = require('cookie-parser');
const ApiError = require('./utils/error');
const v1 = require('./v1');

const passport = require('passport');
const kakaoStrategy = require('passport-kakao').Strategy;
const JWTStrategy = require('passport-jwt').Strategy;

const models = require('../models');

const app = express();

const homeDir = __dirname.substring(0, __dirname.lastIndexOf('\\'));

app.set('views', path.join(homeDir, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(homeDir, 'public')));

app.use('/v1', v1);

app.use((err, req, res, next) => {
    console.error(err);
    const error = {
        code: 500,
        name: 'internal-server-error',
        message: err.message
    };
    if(err instanceof ApiError) {
        error.code = err.code;
        error.name = err.name;
    }
    res.status(error.code).send({error});
});

passport.use('kakao', new kakaoStrategy({
    clientID: '2ea6703381c48fb89db940c6f765c7d9',
    callbackURL: 'http://localhost:3000/v1/users/kakao/oauth'
  },
    function(accessToken, refreshToken, profile, done) {        
      let newId = profile.id;
  
      models.User.findOne({
        where: {
          user_id: newId
        }
      }).then(loginUser => {
        if(loginUser != null)
        {        
          return done(null, loginUser);
        }
        else {
          models.User.create({
            user_id: newId,          
          }).then(user => {          
            return done(null, user);
          });
        }
      });    
    }
));

let JWTExtractor = function(req) {
    let token = null;
    if(req && req.cookies)
      token = req.cookies['jwt'];
    return token;
};

passport.use(new JWTStrategy({
    jwtFromRequest : JWTExtractor,
    secretOrKey: 'secret_key' //temp  
  },
    function(jwtPayload, done) {
      return models.User.findOne({
        where: {
          user_id: jwtPayload.user_id
        }
      }).then(user => {
        return done(null, user);
      }).catch(err => {
        return done(err);
      });
    }
));

const server = awsServerlessExpress.createServer(app, null, ["image/png"]);

exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context);
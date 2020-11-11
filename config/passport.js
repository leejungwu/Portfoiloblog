var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy; 
var User = require('../models/User');

// serialize & deserialize User
passport.serializeUser(function(user, done) { // login시에 DB에서 발견한 user를 어떻게 session에 저장할지를 정하는 부분
  done(null, user.id);
});
passport.deserializeUser(function(id, done) { // request시에 session에서 어떻게 user object를 만들지를 정하는 부분
  User.findOne({_id:id}, function(err, user) {
    done(err, user);
  });
});

// local strategy 
passport.use('local-login',
  new LocalStrategy({
      usernameField : 'username', 
      passwordField : 'password', 
      passReqToCallback : true
    },
    function(req, username, password, done) { // 로그인시 호출
      User.findOne({username:username}) // DB에서 해당 user를 찾고
        .select({password:1})
        .exec(function(err, user) {
          if (err) return done(err);

          if (user && user.authenticate(password)){ // 입력받은 password와 저장된 password hash를 비교해서 값이 일치하면 해당 user를 done에 담아서 return
            return done(null, user);
          }
          else { // username flash와 에러 flash를 생성한 후 done에 false를 담아 return
            req.flash('username', username);
            req.flash('errors', {login:'The username or password is incorrect.'});
            return done(null, false);
          }
        });
    }
  )
);

module.exports = passport;

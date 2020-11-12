var express = require('express');
var router = express.Router();
var passport = require('../config/passport');
var Post = require('../models/Post');
var Second = require('../models/Second');
var Third = require('../models/Third');
var Project = require('../models/Project');


// Home
router.get('/', async function(req, res){
  Promise.all([
    Post.find({}),
    Second.find({}),
    Third.find({}),
    Project.find({})
  ])
  .then(([posts,seconds,thirds,projects]) => {
    res.render('home/welcome', {
      posts:posts,
      seconds:seconds, 
      thirds:thirds,
      projects:projects,
    });
  })
  .catch((err) => {
    console.log('err: ', err);
    return res.json(err);
  });
});

// router.get('/', function(req, res){
//   Post.find({})                  // 1
//   .sort('-createdAt')            // 1
//   .exec(function(err, posts){    // 1
//     if(err) return res.json(err);
//     res.render('posts/index', {posts:posts});
//   });
// });

// Post.find(function (err,posts){
//   if(err) return res.json(err);
//   Second.find(function (err,seconds){
//       if(err) return res.json(err);
//       Third.find({})
//       .sort('-createdAt')
//       .exec(function(err, thirds){
//       if(err) return res.json(err);
//       res.render('home/welcome', {posts:posts, seconds:seconds, thirds:thirds});
//       });
//   });
// });


router.get('/about', function(req, res){
  res.render('home/about');
});

// Login
router.get('/login', function (req,res) { // login view를 보여주는 route
  var username = req.flash('username')[0];
  var errors = req.flash('errors')[0] || {};
  res.render('home/login', {
    username:username,
    errors:errors
  });
});

// Post Login 
router.post('/login', 
  function(req,res,next){ // 보내진 form의 validation을 위한 것으로 에러가 있으면 flash를 만들고 login view로 redirect
    var errors = {};
    var isValid = true;

    if(!req.body.username){
      isValid = false;
      errors.username = 'Username is required!';
    }
    if(!req.body.password){
      isValid = false;
      errors.password = 'Password is required!';
    }

    if(isValid){
      next();
    }
    else {
      req.flash('errors',errors);
      res.redirect('/login');
    }
  },
  passport.authenticate('local-login', { // passport local strategy를 호출해서 authentication(로그인)을 진행
    successRedirect : '/posts',
    failureRedirect : '/login'
  }
));

// Logout
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;

var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('./config/passport'); // passport는 와 passport-local package는 index.js에 require되지 않고 config의 passport.js에서 require
var app = express();
var util = require('./util'); 

// DB setting
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGO_DB_BLOG);
var db = mongoose.connection;
db.once('open', function(){
  console.log('DB connected');
});
db.on('error', function(err){
  console.log('DB ERROR : ', err);
});

// Other settings
app.set('view engine', 'ejs');
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(flash()); // flash초기화 req.flash(문자열, 저장할_값) 의 형태로 저장할_값(숫자, 문자열, 오브젝트등 어떠한 값이라도 가능)을 해당 문자열에 저장
app.use(session({secret:'MySecret', resave:true, saveUninitialized:true})); // session은 서버에서 접속자를 구분시키는 역할

// Passport
app.use(passport.initialize()); 
app.use(passport.session()); //  passport를 session과 연결

// Custom Middlewares
app.use(function(req,res,next){
  res.locals.isAuthenticated = req.isAuthenticated(); // 현재 로그인이 되어있는지 아닌지
  res.locals.currentUser = req.user; // req.user - 로그인이 되면 session으로 부터 user를 deserialize하여 생성(로그인 된 유저의 정보)
  next();
});

// Routes
app.use('/', require('./routes/home'));
app.use('/menu/posts', util.getPostQueryString, require('./routes/posts')); //1
app.use('/users', require('./routes/users'));
app.use('/menu/seconds', util.getPostQueryString, require('./routes/seconds'));
app.use('/menu/thirds', util.getPostQueryString, require('./routes/thirds'));
app.use('/projects', util.getPostQueryString, require('./routes/projects'));

// Port setting
var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log('server on! http://localhost:'+port);
});

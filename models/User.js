var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// schema
// regex(Regular Expression, 정규표현식)
var userSchema = mongoose.Schema({
  is_admin: {type: String},
  username:{
    type:String,
    required:[true,'Username is required!'],
    match:[/^.{4,12}$/,'Should be 4-12 characters!'], // 전체 길이가 4이상 12자리 이하의 문자열이라면 이 regex를 통과
    trim:true, // trim은 문자열 앞뒤에 빈칸이 있는 경우 빈칸을 제거
    unique:true
  },
  password:{
    type:String,
    required:[true,'Password is required!'],
    select:false
  },
  name:{
    type:String,
    required:[true,'Name is required!'],
    match:[/^.{4,12}$/,'Should be 4-12 characters!'],
    trim:true
  },
  email:{
    type:String,
    match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,'Should be a vaild email address!'], // 이메일의 형식을 위한 regex
    trim:true
  }
},{
  toObject:{virtuals:true}
});

// DB에 저장될 필요는 없지만, model에서 사용하고 싶은 항목들은 virtual로 생성
userSchema.virtual('passwordConfirmation')
  .get(function(){ return this._passwordConfirmation; })
  .set(function(value){ this._passwordConfirmation=value; });

userSchema.virtual('originalPassword')
  .get(function(){ return this._originalPassword; })
  .set(function(value){ this._originalPassword=value; });

userSchema.virtual('currentPassword')
  .get(function(){ return this._currentPassword; })
  .set(function(value){ this._currentPassword=value; });

userSchema.virtual('newPassword')
  .get(function(){ return this._newPassword; })
  .set(function(value){ this._newPassword=value; });


var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/; // 8-16자리 문자열 중에 숫자랑 영문자가 반드시 하나 이상 존재
var passwordRegexErrorMessage = 'Should be minimum 8 characters of alphabet and number combination!';

// password를 DB에 생성, 수정하기 전에 값이 유효(valid)한지 확인(validate) 
userSchema.path('password').validate(function(v) { 
  var user = this; 

  // create user 
  if(user.isNew){ //해당 모델이 생성되는 경우에는 true
    if(!user.passwordConfirmation){ //password confirmation값이 없는 경우
      user.invalidate('passwordConfirmation', 'Password Confirmation is required.');
    }

    if(!passwordRegex.test(user.password)){ // 정규표현식.test(문자열) 함수는 문자열에 정규표현식을 통과하는 부분이 있다면 true
      user.invalidate('password', passwordRegexErrorMessage); 
    }
    else if(user.password !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
    }
  }

  // update user 
  if(!user.isNew){
    if(!user.currentPassword){ // current password값이 없는 경우
      user.invalidate('currentPassword', 'Current Password is required!');
    }
    else if(!bcrypt.compareSync(user.currentPassword, user.originalPassword)){ // (입력받은 text값, user의 password hash값)
      user.invalidate('currentPassword', 'Current Password is invalid!');
    }

    if(user.newPassword && !passwordRegex.test(user.newPassword)){ // 정규표현식.test(문자열) 함수는 문자열에 정규표현식을 통과하는 부분이 있다면 true
      user.invalidate("newPassword", passwordRegexErrorMessage); 
    }
    else if(user.newPassword !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
    }
  }
});

// hash password 
// Schema.pre함수는 첫번째 파라미터로 설정된 event가 일어나기 전(pre)에 먼저 callback 함수를 실행
// "save" event는 Model.create, model.save 함수 실행시 발생하는 event
userSchema.pre('save', function (next){
  var user = this;
  if(!user.isModified('password')){ // isModified함수는 해당 값이 db에 기록된 값과 비교해서 변경된 경우 true
    return next();
  }
  else { // 비밀번호가 변경 됐을 경우
    user.password = bcrypt.hashSync(user.password); // user.password의 변경
    return next();
  }
});

// (model methods) password hash와 입력받은 password text를 비교
userSchema.methods.authenticate = function (password) {
  var user = this;
  return bcrypt.compareSync(password,user.password);
};

// model & export

var User = mongoose.model('user',userSchema);

module.exports = User;

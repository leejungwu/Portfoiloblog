var util = {};

util.parseError = function(errors){ // 에러의 형태를 { 항목이름: { message: "에러메세지" } 로 통일
  var parsed = {};
  if(errors.name == 'ValidationError'){
    for(var name in errors.errors){
      var validationError = errors.errors[name];
      parsed[name] = { message:validationError.message };
    }
  }
  else if(errors.code == '11000' && errors.errmsg.indexOf('username') > 0) {
    parsed.username = { message:'This username already exists!' };
  }
  else {
    parsed.unhandled = JSON.stringify(errors);
  }
  return parsed;
}

util.isLoggedin = function(req, res, next){
  if(req.isAuthenticated()){
    next();
  } 
  else {
    req.flash('errors', {login:'Please login first'});
    res.redirect('/login');
  }
}

util.noPermission = function(req, res){
  req.flash('errors', {login:"You don't have permission"});
  req.logout();
  res.redirect('/login');
}

// res.locals에 getPostQueryString함수를 추가하는 middleware
// req.query로 전달 받은 query에서 page, limit을 추출하여 다시 한줄의 문자열로 만들어 반환
util.getPostQueryString = function(req, res, next){
  // 생성할 query string이 기존의 query string에 추가되는(appended) query인지 아닌지를 boolean으로 받는 파라미터
  // req.query의 page나 limit을 overwrite하는 파라미터
  res.locals.getPostQueryString = function(isAppended=false, overwrites={}){    
    var queryString = '';
    var queryArray = [];
    var page = overwrites.page?overwrites.page:(req.query.page?req.query.page:'');
    var limit = overwrites.limit?overwrites.limit:(req.query.limit?req.query.limit:'');

    if(page) queryArray.push('page='+page);
    if(limit) queryArray.push('limit='+limit);

    // 추가되는 query라면 '&'로 시작하고, 아니라면 '?'로 시작하는 query string 생성
    if(queryArray.length>0) queryString = (isAppended?'&':'?') + queryArray.join('&'); // &넣어줌

    return queryString;
  }
  next();
}

module.exports = util;
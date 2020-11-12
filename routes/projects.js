var express  = require('express');
var router = express.Router();
var Project = require('../models/Project');
var util = require('../util');

// Index
router.get('/', async function(req, res){ 
  var page = Math.max(1, parseInt(req.query.page)); // Query string으로 전달받은 page, limit을 req.query를 통해 읽어온다
  var limit = Math.max(1, parseInt(req.query.limit)); 
  page = !isNaN(page)?page:1;                         // 정수로 변환될 수 없는 값이 page, limit에 오는 경우 기본값을 설정
  limit = !isNaN(limit)?limit:10;                     

  var skip = (page-1)*limit;  // 무시할 게시물의 수를 담는 변수 
  var count = await Project.countDocuments({});  // ({} == 조건이 없음, 즉 모든) post의 수를 DB에서 읽어 온 후 count변수에 담는다
  var maxPage = Math.ceil(count/limit); // 전체 페이지 수
  var projects = await Project.find({}) // await를 사용하여 검색된 posts를 변수에 담는다
    .populate('author')
    .sort('-createdAt')
    .skip(skip) // 일정한 수만큼 검색된 결과를 무시
    .limit(limit) // 일정한 수만큼만 검색된 결과를 보여주는 함수
    .exec();

  res.render('projects/index', {
    projects:projects,
    currentPage:page, // 현재 페이지 번호
    maxPage:maxPage,  // 마지막 페이지번호
    limit:limit       // 페이지당 보여줄 게시물 수
  });
});

// New
router.get('/new', util.isLoggedin, function(req, res){
  var project = req.flash('project')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('projects/new', { project:project, errors:errors });
});

// create
router.post('/', util.isLoggedin, function(req, res){
  req.body.author = req.user._id;
  Project.create(req.body, function(err, project){
    if(err){
      req.flash('project', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/projects/new'+res.locals.getPostQueryString());
    }
    res.redirect('/projects'+res.locals.getPostQueryString(false, {page:1}));
  });
});

// show
router.get('/:id', function(req, res){
  Project.findOne({_id:req.params.id})
    .populate('author')
    .exec(function(err, project){
      if(err) return res.json(err);
      res.render('projects/show', {project:project});
    });
});

// edit
router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res){
  var project = req.flash('project')[0];
  var errors = req.flash('errors')[0] || {};
  if(!project){ // 에러가 없다면
    Project.findOne({_id:req.params.id}, function(err, project){
        if(err) return res.json(err);
        res.render('projects/edit', { project:project, errors:errors });
      });
  }
  else { // 에러가 있다면
    project._id = req.params.id;
    res.render('projects/edit', { project:project, errors:errors });
  }
});

// update
router.put('/:id', util.isLoggedin, checkPermission, function(req, res){
  req.body.updatedAt = Date.now();
  Project.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, project){
    if(err){
      req.flash('project', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/projects/'+req.params.id+'/edit'+res.locals.getPostQueryString());
    }
    res.redirect('/projects/'+req.params.id+res.locals.getPostQueryString());
  });
});

// destroy
router.delete('/:id', util.isLoggedin, checkPermission, function(req, res){
  Project.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/projects'+res.locals.getPostQueryString());
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next){
  Project.findOne({_id:req.params.id}, function(err, project){
    if(err) return res.json(err);
    if(project.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}
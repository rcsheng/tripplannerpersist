var router = require('express').Router();
var Day = require('../models/day');
var Meal = require('../models/meal');
var Restaurant = require('../models/restaurant');
var Place = require('../models/place');
var Stay = require('../models/stay');
var Hotel = require('../models/hotel');
var Promise = require('bluebird');
module.exports = router;

router.get('/', function(req, res, next){
  var meals = {
    model: Meal,
    include: [ { 
      model: Restaurant,
      include: [ Place ]
    } ]
  };

  var stays = {
    model: Stay,
    include: [ { 
      model: Hotel,
      include: [ Place ]
    } ]
  };

  Day.findAll({ include: [ meals, stays ]})
    .then(function(days){
      return days.map(function(day){
        var obj = {};
        obj.id = day.id;
        obj.restaurants = day.meals.map(function(meal){ 
          return meal.restaurant;
        });
        obj.hotels = day.stays.map(function(stay){ 
          return stay.hotel;
        });;
        console.log("hotels: ",obj.hotels);
        obj.activities = [];
        return obj;
      });
    })
    .then(function(days){
      res.send(days);
    })
    .catch(next);
});

router.post('/', function(req,res,next){
  Day.create()
  .then(function(day){
    var obj = {id: day.id};
    obj.restaurants = [];
    obj.activities = [];
    obj.hotels = [];
    res.send(obj);
  })
  .catch(next);
});

router.delete('/:id', function(req,res,next){
  console.log('trying to destroy', req.params.id);
  Day.destroy({where: {
    id: req.params.id*1
  }})
  .then(function(){
    
    res.end();
  })
  .catch(next);
});

router.post('/:dayid/hotel/:hotelid',function(req,res,next){
  console.log('calling router with ',req.params.dayid,' and ', req.params.hotelid);
  var stays = {
    model: Stay,
    include: [ { 
      model: Hotel,
      include: [ Place ]
    } ]
  };

  Promise.all([  
    Day.findById((req.params.dayid*1)+1),
    Hotel.findById(req.params.hotelid*1)])
  .spread(function(day,hotel){
    return Stay.create({ dayId: day.id, hotelId: hotel.id });
  })
  .then(function(stay){
    return Stay.findById(stay.id,{include: [ { 
        model: Hotel,
        include: [ Place ]
      } ]
    });
  })
  .then(function(stay){
    var item = stay.hotel.get();
    console.log('item: ',item);
    res.send(item);
    //console.log('completed adding stay', stay);
  })
  .catch(next);
});

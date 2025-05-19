const express=require('express');
const tourController=require('./../Controller/tourController');
const authController=require('./../Controller/authController');
//const reviewController=require('./../Controller/reviewController');
const reviewRouter=require('./../routes/reviewRoutes');

const tourrouter= express.Router();

tourrouter.use('/:tourId/reviews',reviewRouter);

//tourrouter.param('id',tourController.checkid); to declare middleware functions
tourrouter.route('/top-5-cheap').get(tourController.aliasTopTours,tourController.getalltour);

tourrouter.route('/stats').get(tourController.TourStats);



tourrouter.route('/monthly-plan/:year').get(authController.protect,
    authController.restrictTo('admin','lead-guide','guide'),
    tourController.getMonthlyPlan);


tourrouter.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

tourrouter.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

tourrouter
 .route('/')
 .get(tourController.getalltour)
 .post(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.createtour);


 tourrouter
 .route('/:id')
 .get(tourController.getatour)
 .patch(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.uploadTourImages,tourController.resizeTourImages,tourController.updatetour)
 .delete(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.deletetour);



 module.exports =tourrouter;
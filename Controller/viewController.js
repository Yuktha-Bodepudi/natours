const Tour= require('../models/tourModel');
const catchAsync=require('../utils/catchAsync');
const AppError=require('./../utils/appError');
const User=require('./../models/userModel');
const Booking=require('./../models/bookingModel');

exports.getOverview= catchAsync(async (req,res,next)=>{
     
    const tours=await Tour.find();

    res.status(200).render('overview',{
        title:'All Tours',
        tours
    });
});

exports.getTour= catchAsync(async (req,res,next)=>{
     const tour=await Tour.findOne({slug:req.params.slug}).populate({
        path :'reviews',
        fields :'review rating user'
     });
    console.log('🔍 tour.description:', tour.description);

    
if(!tour){
    return next(new AppError('There is No app with that name',404));
}

    res.status(200).render('tour',{
        title:`${tour.name} Tour`,
        tour
    });
});

exports.getMyTours=catchAsync(async(req,res,next)=>{

    const bookings=await Booking.find({user: req.user.id});

    const tourIDs=bookings.map(el=>el.tour);
    const tours=await Tour.find({_id:{$in :tourIDs}});

    res.status(200).render('overview',{
        title:'My Tours',
        tours
});
});

exports.getLoginForm=(req,res)=>{
    res.status(200).render('login',{
        title :'log into your account'
    });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};

exports.updateUserData=  catchAsync(async (req,res,next)=>{
   const updatedUser=await User.findByIdAndUpdate(req.user.id,
    {
        name:req.body.name,
        email:req.body.email
    },
    {
        new:true,
        runValidators:true
    }
   );
   res.status(200).render('account', {
    title: 'Your account',
    user:updatedUser
  });
});
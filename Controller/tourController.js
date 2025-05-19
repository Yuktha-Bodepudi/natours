/* eslint-disable prettier/prettier */
const fs=require('fs');
const sharp=require('sharp');
const multer=require('multer');
const Tour=require('../models/tourModel');
const { queryObjects } = require('v8');
//const APIFeatures =require('./../utils/apiFeatures');
const catchAsync=require('./../utils/catchAsync');
const AppError=require('./../utils/appError');
const factory=require('./handlerFactory');

const multerStorage=multer.memoryStorage();

const multerFilter =(req,file,cb)=>{
    if(file.mimetype.startsWith('image')){
        cb(null,true);
    }else{
        cb(new AppError('not an image , please upload only images',400),false);
    }
}
const upload=multer({
   storage :multerStorage,
   fileFilter : multerFilter
});

exports.uploadTourImages=upload.fields([ 
   {name :'imageCover',maxCount:1},
  {name :'images',maxCount:3}
]);

exports.resizeTourImages = catchAsync(async(req,res,next)=>{
  console.log(req.files);
   if(!req.files.imageCover || !req.files.images ){
    return next();}
   
    //processing the coverimage
   req.body.imageCover=`tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
            .resize(2000,1333)
            .toFormat('jpeg')
            .jpeg({quality:90})
            .toFile(`public/img/tours/${req.body.imageCover}`);

  req.body.images=[];
  await Promise.all(req.files.images.map(async(file,i)=>{
    const filename=`tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;
    await sharp(file.buffer)
            .resize(2000,1333)
            .toFormat('jpeg')
            .jpeg({quality:90})
            .toFile(`public/img/tours/${filename}`);
    req.body.images.push(filename);
  })
);
  next();
});

exports.aliasTopTours =(req,res,next) =>{
  req.query.limit='5';
  req.query.fields='name, price,difficulty';
  req.query.sort='-ratingsAverage,price';
  next();
};


exports.getatour = factory.getOne(Tour,{path :'reviews'});

// exports.getatour = catchAsync(async(req,res,next) =>{ 
//      const tours =   await Tour.findById(req.params.id).populate('reviews');
//      if(!tours){
//      return next(new AppError('no tour found',500));
//      }
//      res.status(200).json({
//       status:'success',
//       // results :tours.length,
//        data :{
//            tours
//        }
//    }
//    );
//   });

exports.getalltour=factory.getAll(Tour);

///exports.getalltour= catchAsync(async (req,res,next) =>{
  
    // //building the query 
    // const queryObj ={ ...req.query }; //creating a shallow object
    // const excludedFields= ['page','sort','limit','fields'];
    // excludedFields.forEach(el => delete queryObj[el]);

    // let queryString= JSON.stringify(queryObj);
    // queryString=queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    // console.log(req.query,queryObj);

    // let query=Tour.find(JSON.parse(queryString));

    //sorting the query
    // if(req.query.sort){
    //   const sortby=req.query.sort.split(',').join(' ');
    //    query =query.sort(sortby);
    // }else{
    //   query=query.sort('-createdAt');
    // }

    //field limiting
    // if(req.query.fields){
    //   const fields = req.query.fields.split(',').join(' ');
    //   query = query.select(fields);
    // }else{
    //   query=query.sort('-__v');
    // }
    
    //pagination
    //here in the  query the number is taken as a string multiply it with one to convert to an int and the || is used to define a default value
    // const page=req.query.page*1 || 1; 
    // const limit=req.query.limit*1 || 100;
    // const skip=(page-1)*limit;
    // query=query.skip(skip).limit(limit);
    
    // if(req.query.skip){
    //   const numTours=await Tour.countDocuments();
    //   if(skip >= numTours){
    //     throw new Error('this page does not xist');
    //   }
    // }

    // //executing the query
  //   const features =new APIFeatures(Tour.find(),req.query)
  //     .filter()
  //     .sort()
  //     .limitFields()
  //     .pagination();
  //   const tours= await features.query;
  //   res.status(200).json({
  //      status:'success',
  //       data :{
  //          tours
  //       }
  //   }
  //   );
  
  //  });

   
exports.createtour= factory.createOne(Tour);

 exports.updatetour=  factory.updateOne(Tour);

exports.deletetour=factory.deleteOne(Tour);

//   exports.deletetour= catchAsync(async (req,res,next)=>{
//      const tours=await Tour.findByIdAndDelete(req.params.id);
//      if(!tours){
//       return next(new AppError('no tour found',404));
//       }
//       res.status(204).json({
//         status:'success',
//         data :null
//     })
// });

exports.TourStats= catchAsync(async(req,res,next) =>{

    const stats = await Tour.aggregate([
      {$match : { ratingsAverage :{$gte :4.5}}
    },
    {
      $group :{
        _id:'$difficulty',
        numTours:{$sum:1},
        numRatings:{$sum:'$ratingsQuantity'},
        avgRating:{$avg : '$ratingsAverage'},
        avgPrice :{$avg :'$price'},
        minPrice:{$min:'$price'},
        maxPrice:{$max:'$price'}

      }},
      {
        $sort :{avgPrice:1
      }
    }
 
    ]);
    res.status(200).json({
      status:'success',
      data :stats
         
  });
});

//getting the busiest month 
exports.getMonthlyPlan = catchAsync(async (req,res,next) =>{
         const year = req.params.year*1;
         const plan= await Tour.aggregate([
          {
            $unwind : '$startDates'
          },
          {
            $match : {
              startDates:{ // you want the plan to be greater than jan 1st and less than dec 1st
                $gte : new Date(`${year}-01-01`),
                $lte : new Date(`${year}-12-31`)
              }
            }
          },
          {
            $group: {
            _id: {$month : '$startDates'},
            numTourStarts : { $sum :1},
            tours :{$push :'$name'}
          }
        },
        {
          $addFields :{ month : '$_id'}
        },
        {// to hide the id
          $project :{
            _id :0
          }
        },
        {
          $sort :{
            numTourStarts :-1 //-1 for descending and 1 for ascending
          }
        },
        {
          $limit :12
        }

          
         ]);

         res.status(200).json({
          status:'success',
          data :plan
             
      });
});

exports.getToursWithin = catchAsync(async (req,res,next) =>{
  const{distance,latlng,unit} =req.params;
  const[lat,lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance/3963.2 :distance / 6378.1;

  if(!lat || !lng){
    next(new AppError['please provide a latitude and a longitude', 400]);
  }

  console.log(distance,lat,lng,unit);

  const tours=await Tour.find({startLocation :{ $geoWithin :{ $centerSphere :[[lng,lat],radius]}}});

  res.status(200).json({
    status :' success',
    results :tours.length,
    data:{
      data:tours
    }
  });
});

exports.getDistances = catchAsync (async (req,res,next) =>{
      const{latlng,unit} =req.params;
  const[lat,lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if(!lat || !lng){
    next(new AppError('please provide a latitude and a longitude', 400));
  }

  const distances =await Tour.aggregate([
    {
      $geoNear : {
        near :{
           type :'Point',
           coordinates : [lng *1,lat*1]
        },
        distanceField : 'distance',
      distanceMultiplier : multiplier
      }
    },
    {
      $project :{
        distance :1,
        name :1
      }
    }
  ]);
   res.status(200).json({
    status :' success',
    data:{
      data: distances
    }
  });
});
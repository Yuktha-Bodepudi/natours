/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator =require('validator');
const User=require('./userModel');
const tourrouter = require("../routes/tourRoutes.js");

const tourSchema= new mongoose.Schema({
    name:{
      type: String,
      unique:true,
      required: [true,'a tour name is required'],
      trim :true,
      maxLength :[40,'A tour must have less than 40 characters'],
      minLength :[10,'A tour must have greater han 40 characters'],
      //validate: validator.isAlpha

    },
    duration:{
       type:Number,
       required: [true,'a tour must have a duration ']
    },
    maxGroupSize:{
      type: Number,
      required: [true,'a tour must have a group sixe ']
    },
    difficulty:{
      type: String,
      required: [true,'a tour must have a group sixe '],
      enum:{
        values:['easy','medium','hard'],
       message : 'difficulty only has three valued easy , medium , hard'}
    },  
    ratingsQuantity:{
      type: Number,
      default :0
    },
    ratingsAverage:{
      type: Number,
      default :4.5,
      min:[1,'a rating must be above 1.0'],
      max:[5,'a rating must be below 5.0'],
      set :val => Math.round(val*10)/10
    },
    price :{
        type: Number,
        required:[true,'a tour requiresa price']
    },
    priceDiscount: {
      type:Number,
      validate :{
        validator :function(val){
          return val<this.price;
         },
        message :'discount price shud be less than the regular price '
      }},
    summary :{
      type:String,
      trim :true,
      required:[true,'a tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover:{
      type :String,
      required :[true,'A tour must have an image name']
    },
    images :[String],
    createdAt:{
      type :Date,
      default :Date.now(),
      select :false
    },
    slug:String,
    startDates : [Date],
    secretTour:{
      type:Boolean,
      default:false
    },
    startLocation:{
       type:{
        type :String,
        default:'Point',
        enum:['Point']
       },
       coordinates:[Number],
       address: String,
       description :String,
    },
    locations :[{
      type:{
        type :String,
        default:'Point',
        enum:['Point']
       },
       coordinates:[Number],
       address: String,
       description :String,
       day:Number
    }],// create a document
    guides:[{
      type:mongoose.Schema.ObjectId,
      ref:'User'
    }
    ]
  },{
    toJSON :{virtuals:true},
    toObject :{virtuals:true}
  });
  

  tourSchema.index({price : 1 , ratingsAverage :-1});
  tourSchema.index({slug: 1});
  tourSchema.index({startLocation : '2dsphere'});

  //virtual properties
  tourSchema.virtual('duartionWeeks').get(function() {
     return this.duration/7;
  });

  tourSchema.virtual('reviews',{
    ref:'Review',
    foreignField:'tour',
    localField:'_id'
  })

  //mongoose document middle ware , this middleware is going to run before an event  ,nly going to run for the save and create mongoose methods
  tourSchema.pre('save',function(next){
    this.slug =slugify(this.name,{lower:true});
    console.log('Slug generated:', this.slug);
    next();
  });

  // tourSchema.pre('save',async function(next){
  //   const guidesPromises= this.guides.map(async id => await User.findById(id));
  //   this.guides=await Promise.all(guidesPromises);
  //   next();
  // }); // by embedding
  
  // tourSchema.pre('save',function(next){
  //   console.log('document will be saved')
  //   next();
  // });

  // tourSchema.post('save',function(doc,next){
  //   console.log(doc);
  //   next();
  // });
    
  //query middleware
  tourSchema.pre(/^find/,function(next){
    this.find({secretTour :{$ne:true}});
    this.start=Date.now();
    next();
  });
  
  tourSchema.pre(/^find/,function(next){
        this.populate({ 
      path:'guides',
     select :'-_v -passwordChangedAt'});
     next();
  });

  tourSchema.post(/^find/,function(docs,next){
    console.log(`query executed ${Date.now()- this.start}`);
    console.log(docs);
        next();
  });
   
  //Aggregation middleware
  // tourSchema.pre('aggregate',function(next){
  //   this.pipeline.unshift({ $match: {secretTour : { $ne :true} }}); // removing from the documenst that have all the outputs set to tru
  //   console.log(this);
  //   next();
  // });
  const Tour=mongoose.model('Tour',tourSchema);//to declare a model in mongoose

  module.exports =Tour;
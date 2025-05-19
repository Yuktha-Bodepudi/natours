// code to load the json data from file to the mongodb database
const fs = require('fs');

const mongoose = require('mongoose');

const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');
const { argv } = require('process');

const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

mongoose
.connect(DB,{
  useNewUrlParser : true,
  useCreateIndex :true,
  useFindAndModify : false
})
.then(() =>{
  //console.log(con.connections);
  console.log('db connection is satisfied');
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8')); // reading the json file
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8')); // reading the json file
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8')); // reading the json file

//importing the data from the json file to the database
const importData= async ()=>{
    try{
     await Tour.create(tours);
     await User.create(users , {validateBeforeSave :false});
     await Review.create(reviews);
     console.log('data loaded');
    }catch(err){
        console.log(err);
    }
    process.exit();
};

//delete all the previously loaded data in the database
const deleteData= async ()=>{
    try{
     await Tour.deleteMany();
     await User.deleteMany();
     await Review.deleteMany();
     console.log('data deleted');
    }catch(err){
        console.log(err);
    }
    process.exit();
};

if(process.argv[2] === '--import'){
     importData();
    
}
if(process.argv[2] === '--delete'){
     deleteData();
    
}
//console.log(process.argv);
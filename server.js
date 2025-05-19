/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const dotenv = require('dotenv');


process.on('uncaughtException',err =>{
  console.log('uncaught exception');
  console.log(err.name,err.message);
    process.exit(1);
 
});
dotenv.config({ path: './config.env' });

const app = require('./app');

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


const port = process.env.PORT || 3000;

const server =app.listen(port, () => {
  console.log(`app is running at ${port}`);
});

process.on('unhandledRejection',err =>{
  console.log(err.name,err.message);
  console.log('unhandled rejection');
  server.close(()=>{
    process.exit(1);
  });
});


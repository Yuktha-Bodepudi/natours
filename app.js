const path=require('path');
const express=require('express');
const fs=require('fs');
const morgan=require('morgan');
const hpp=require('hpp');
const compression=require('compression');
const tourrouter = require('./routes/tourRoutes');
const userrouter = require('./routes/userRoutes');
const appError=require('./utils/appError');
const errorcontroller=require('./Controller/errorController');
const rateLimit=require('express-rate-limit');
const helmet=require('helmet');
const mongoSanitize=require('express-mongo-sanitize');
const xss=require('xss-clean');
const cookieParser=require('cookie-parser');
const reviewRouter=require('./routes/reviewRoutes');
const viewRouter=require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app=express();

app.use(
  helmet({
    contentSecurityPolicy: false, // turn off the default
  })
);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      frameSrc: [
        "'self'",
        "https://js.stripe.com",          // allow Stripe Elements iframes
        "https://hooks.stripe.com",       // if you use Webhooks testing UI
        "https://checkout.stripe.com"     // if you use hosted Checkout
      ],

      // allow Mapbox scripts *and* blob: (for the workers)
      scriptSrc: [
        "'self'",
        "https://api.mapbox.com",
        "https://cdnjs.cloudflare.com",
        "https://js.stripe.com",
        "blob:",
      ],
      scriptSrcElem: [
        "'self'",
        "https://api.mapbox.com",
        "https://cdnjs.cloudflare.com",
        "https://js.stripe.com" ,
        "blob:",
      ],

      // allow Mapbox & Google Fonts CSS
      styleSrc: [
        "'self'",
        "https://api.mapbox.com",
        "https://fonts.googleapis.com",
      ],
      styleSrcElem: [
        "'self'",
        "https://api.mapbox.com",
        "https://fonts.googleapis.com",
      ],

      // allow the worker creation from blob:
      workerSrc: [
        "'self'",
        "blob:",
      ],

      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: [
        "'self'",
        "https://api.mapbox.com",
        "https://*.tiles.mapbox.com",
        "https://events.mapbox.com",
        "ws://127.0.0.1:*"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://api.mapbox.com",
        "https://*.tiles.mapbox.com",
      ],
    },
  })
);

app.set('view engine','pug');
app.set('views', path.join(__dirname,'views'));

// to call all the static files
app.use(express.static(path.join(__dirname,'public')));

//app.use(helmet());

if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    max:100,
    windowMs:60*60*100,
    message:'Too Many Requests from this IP, try again after 3 hrs'
});
app.use('/api',limiter);

app.use(express.json({limit :'10KB'}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Data sanitization for NO-SQL injections
app.use(mongoSanitize());

app.use(xss());

app.use(hpp({
   whitelist:[
    'ratingsQuantity',
    'ratingsAverage',
    'duration',
    'maxGroupSize',
    'difficulty',
    'price'
   ]
}));


app.use(compression());
// app.use((req,res,next)=>{
//     console.log('hello from the middleware');
//     next();
// }
// );

app.use((req,res,next)=>{
    req.requestTime= new Date().toISOString();
    //console.log(req.cookies);
    next();

}
);

//rendering webpages


app.use('/',viewRouter);
app.use('/api/v1/tours',tourrouter);
app.use('/api/v1/users',userrouter);
app.use('/api/v1/reviews',reviewRouter);
app.use('/api/v1/bookings',bookingRouter);

app.all('*', (req,res,next)=>{
//    res.status(404).json({
//        status :'fail',
//        message :`we do not have ${req.originalUrl} on the server`
//    });

// const err= new Error(`we do not have ${req.originalUrl} on the server`);
// err.status='fail';
// err.statusCode=404;
// next(err);

next( new appError(`we do not have ${req.originalUrl} on the server`,404));
});

//middleware function to handle operational errors
app.use(errorcontroller);

module.exports = app;

/* eslint-disable prettier/prettier */
const {promisify}=require('util');
const crypto=require('crypto');
const User=require('./../models/userModel');
const catchAsync=require('./../utils/catchAsync');
const jwt=require('jsonwebtoken');
const AppError=require('./../utils/appError');
const Email=require('./../utils/email');
const COOKIE_EXPIRES_DAYS = parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10);


const signToken= id =>{ return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn :process.env.JWT_EXPIRES_IN
    });
}

const createSendToken=(user,statusCode,res)=>{
    const token=signToken(user._id);
    const CookieOptions={
        expires :new Date(
            Date.now() + COOKIE_EXPIRES_DAYS*24*60*60*1000
        ),
        httpOnly :true
    };

    if(process.env.NODE_ENV === 'production'){
        CookieOptions.secure=true;
    }

    res.cookie('jwt',token,CookieOptions);

    user.password=undefined;//remove the password from the output
    
    res.status(statusCode).json({
        status :'success',
        token,
        data :{
            user
        }
    });
}

exports.signup=catchAsync(async(req,res,next)=>{
    const newUser= await User.create({
        name:req.body.name,
        email:req.body.email,
        password : req.body.password,
        passwordConfirm :req.body.passwordConfirm
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
    createSendToken(newUser,201,res);
});


exports.login =catchAsync(async(req,res,next) =>{
    const {email,password} =req.body;

    if(!email ||!password){
       return  next(new AppError('please provide email and password',400));
    }

    const user= await User.findOne({email}).select('+password');
    
    if(!user || !( await user.correctPassword(password,user.password))){
        return  next(new AppError('Incorrect email or password',400));
    }
    createSendToken(user,200,res);
});

exports.logout= (req,res) =>{
    res.cookie('jwt','loggedout',{
        expires: new Date(Date.now() + 10*1000),
        httpOnly:true
    });
    res.status(200).json({status :'success'});
}

exports.protect = catchAsync(async(req,res,next )=>{
     //getting a token and checking if it exists
     let token;
     if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
         token = req.headers.authorization.split(' ')[1];
     }else if(req.cookies.jwt){
        token=req.cookies.jwt;
     }

     if(!token){
        return next(new AppError('you are not logged in , please login to get access',401));
     }
     
     //verification of the token 
     const decoded= await promisify(jwt.verify)(token ,process.env.JWT_SECRET);

     //check if the user still exists
     const freshUser=await User.findById(decoded.id);
     if(!freshUser){
        return next(new AppError('the  user belonging to this token does not exist',401));
     }

     if(freshUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('password was changed recebtly',401));
     }
     req.user=freshUser;
     res.locals.user=freshUser;
    next();
});

exports.isLoggedIn = async(req,res,next )=>{
    try{
     //getting a token and checking if it exists
      if(req.cookies.jwt){
     //verification of the token 
     const decoded= await promisify(jwt.verify)(req.cookies.jwt ,process.env.JWT_SECRET);

     //check if the user still exists
     const freshUser=await User.findById(decoded.id);
     if(!freshUser){
        return next();
     }

     if(freshUser.changedPasswordAfter(decoded.iat)){
        return next();
     }
     res.locals.user=freshUser;
     return next();
}}catch(err){
    return next();
}
next()};

exports.restrictTo=(...roles) => {
    return (req,res,next) =>{
        if(!roles.includes(req.user.role)){
            return next(new AppError('you do not have permisiion to supoort this action',403));
        }
        next();
    } ;
};

exports.forgotPassword=catchAsync(async (req,res,next)=>{
    // to get the user by their email id 
 const user=await User.findOne({email:req.body.email});
 if(!user){
    return next(new AppError('there is no user with that email address',401));
 }
 
      const resetToken= user.createPasswordResetToken();
      await user.save({validateBeforeSave:false});
      try{
          const resetUrl=`${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
          await new Email(user, resetUrl).sendPasswordReset();
          res.status(200).json({
            status :'success',
            message:'token sebt to mail'
          });
      }catch(err){
          user.passwordResetToken=undefined;
          user.passwordResetExpires=undefined;
          await user.save({validateBeforeSave:false});

          return next(new AppError('there was an error sending a mail',500));
      }
      
});


exports.resetPassword= catchAsync(async(req,res,next)=>{

 const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
 const user = await User.findOne({
    passwordResetToken:hashedToken,
    passwordResetExpires:{$gt:Date.now()}});
 
if(!user){
   return  next(new AppError('token has expired',400));
}
user.password=req.body.password;
user.passwordConfirm =req.body.passwordConfirm;
user.passwordResetToken= undefined;
user.passwordResetExpires=undefined;
await user.save();

createSendToken(user,200,res);

});

exports.updatePassword=catchAsync(async(req,res,next) =>{
    // get user from the collection

    const user= await User.findById(req.user.id).select('+password');

    //check if the posted current password is the correct password
    if(!(await user.correctPassword(req.body.passwordCurrent,user.password))){
        return next(new AppError('your current password is wrong ',401)); 
    }
    
    //if it is true , update the password
    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;
    await user.save();

    createSendToken(user,200,res);

});
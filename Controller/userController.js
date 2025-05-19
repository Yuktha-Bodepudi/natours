const User=require('./../models/userModel');
const sharp=require('sharp');
const multer=require('multer');
const catchAsync=require('./../utils/catchAsync');
const AppError=require('./../utils/appError');
const factory=require('./handlerFactory');

// const multerStorage=multer.diskStorage({
//     destination : (req,file,cb) =>{
//         cb(null,'public/img/users');
//     },
//     filename :(req,file,cb) =>{
//         const ext=file.mimetype.split('/')[1];
//         cb(null,`user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });

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

exports.resizeUserPhoto=catchAsync(async (req,res,next)=>{
      if(!req.file){
        return next();
      }
      req.file.name= `user-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer).resize(500,500).toFormat('jpeg').jpeg({quality:90}).toFile(`public/img/users/${req.file.name}`);
  next();

});

exports.uploadUserPhoto=upload.single('photo');

const filterObj= (obj, ...allowedFields) =>{
    const newObj={};
    Object.keys(obj).forEach(el =>{
        if(allowedFields.includes(el)){
            newObj[el]=obj[el];
        }
    });
    return newObj;
}
exports.getallusers = factory.getAll(User);

exports.getMe = (req,res,next) =>{
    req.params.id =req.user.id;
    next();
};

exports.updateMe= catchAsync(async(req,res,next)=>{
   //returns an aerror of the user tries to update the password here
   if(req.body.password || req.body.passwordConfirm){
      return next(new AppError('this route is not for passwordupdates',400));
   }
   const filteredbody=filterObj(req.body,'name','email');
   if(req.file){
    filteredbody.photo=req.file.filename;
   }
   const updatedUser=await User.findByIdAndUpdate(req.user.id,filteredbody,{
    new :true,
    runValidators:true
   });
   res.status(200).json({
    status:'success',
    data:{
        user:updatedUser
    }
   })
});

exports.deleteMe =catchAsync(async(req,res,next)=>{
  
    await User.findByIdAndUpdate(req.user.id,{active:false});
    res.status(204).json({
        status:'success',
        data:null
    });

});


exports.createusers = (req,res) =>{
    res.status(500).json({
        status :'success',
        message:'not yet created'
    })
};

exports.getuser = factory.getOne(User);

exports.updateuser = factory.updateOne(User);

exports.deleteuser = factory.deleteOne(User);
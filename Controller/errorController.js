const AppError=require('./../utils/appError');


const handleJWTError= () => new AppError('invalid token , please login again ',401);

const handleJWTExpiredError= () => new AppError('your token has expired',401);

const handleCastErrorDB =err=>{
    const message= `invalid ${err.path} :${err.value}.`;
    return new AppError(message,400);
};

const handleDuplicateFields =err=>{
    //const value=err.errmsg;
    const message='duplicate value';
    return new AppError(message,400);
}

const handleValidationErrorDB =err=>{
    const errors=Object.values(err.errors).map(el=>el.message);
    const message=`inavlid data ${errors.join('.' )}`;
    return new AppError(message,400);

}

const sendErrorDev = (err,req,res) => {
   if(req.originalUrl.startsWith('/api')){
      res.status(err.statusCode).json({
            status :err.status,
            error:err,
            message :err.message,
            stack:err.stack,
        });
   }else{
    res.status(err.statusCode).render('error',{
        title:'something went wrong',
        msg:err.message
    });
   }
};
const sendErrorProd=(err,req,res)=>{
    if(req.originalUrl.startsWith('/api')){
          if(err.isOperational){
       return res.status(err.statusCode).json({
            status :err.status,
            message :err.message
    });
    }else{
       return res.status(500).json({
            status :'error',
            message : 'somethong went very wrong'
        });
    }
    }
 
        if(err.isOperational){
       return res.status(err.statusCode).render('error',{
        title:'something went wrong',
        msg:err.message
    });
    }
        return res.status(err.statusCode).render('error',{
        title:'something went wrong',
        msg:'please try again later'
        })  
    
};

module.exports=(err,req ,res,next) =>{
    err.statusCode=err.statusCode || 500;
    err.status=err.status || 'error';
    
    if(process.env.NODE_ENV ==='development'){
       sendErrorDev(err,req,res);
    }else if(process.env.NODE_ENV ==='production'){

        let error = Object.create(err);
        error.message=err.message
        if(error.name === 'CastError'){
            error=handleCastErrorDB(error);
        }
        if(error.code === 11000){
            error= handleDuplicateFields(error);
        }
        if(error.name === 'ValidationError'){
            error=handleValidationErrorDB(error);
        }
        if(error.name === 'JsonWebTokenError'){
            error =handleJWTError();
        }
        if(error.name === 'TokenExpiredError'){
            error=handleJWTExpiredError();
        }
       sendErrorProd(error,req,res);
    
}};
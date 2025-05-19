const express=require('express');
const userController=require('./../Controller/userController');
const authController=require('./../Controller/authController');


const userrouter=express.Router();

userrouter.post('/signup',authController.signup);
userrouter.post('/login',authController.login);
userrouter.get('/logout',authController.logout);


userrouter.post('/forgotPassword',authController.forgotPassword);
userrouter.patch('/resetPassword/:token',authController.resetPassword);

userrouter.use(authController.protect);
userrouter.patch('/updateMyPassword',authController.updatePassword);

userrouter.get('/me',userController.getMe,userController.getuser);
userrouter.patch('/updateMe',userController.uploadUserPhoto,userController.resizeUserPhoto,userController.updateMe);
userrouter.delete('/deleteMe',userController.deleteMe);

userrouter.use(authController.restrictTo('admin'));

userrouter
.route('/')
.get(userController.getallusers)
.post(userController.createusers);

userrouter
.route('/:id')
.get(userController.getuser)
.patch(userController.updateuser)
.delete(userController.deleteuser);



module.exports=userrouter;
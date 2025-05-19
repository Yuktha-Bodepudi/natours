//for listening after we click on the submit button in the login form 
import axios from 'axios';
import {showAlert} from './alerts'

export const login =async(email,password) =>{
    try{
         const res= await  axios({
        method :'POST',
        url:'/api/v1/users/login',
        data:{
            email,
            password
        }
    });
    console.log('🔵 login() response.data:', res.data);
        if(res.data.status === 'success'){
          console.log('succes');
           showAlert('success','logged in')
            window.setTimeout(() =>{
                location.assign('/')
            },1500);
        }
     
    }catch(err){
        showAlert('error',err.response.data.message);
    }
   
};

export const logout= async() =>{
    try{
       const res=await axios({
        method:'GET',
        url: '/api/v1/users/logout'
       });
        if((res.data.status === 'success')){location.reload(true);}
    }catch(err){
       
    showAlert('error','Error logging out!');
    }
};



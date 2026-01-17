const {Schema, default: mongoose}= require('mongoose');
const addressesSchema=new Schema({
    street:String,
    city:String,
    state:String,
    zip:String,
    country:String
});
const UserSchema=new Schema({
username:{
    type:String,
    required:true,
    unique:true
},
email:{
    type:String,
    required:true,
    unique:true

},
password:{
    type:String,
    select:false,
},
fullName:{
    firstName:{type:String,required:true},
    lastName:{type:String,required:true},
},
role:{
    type:String,
    enum:['user','seller','admin'],
    default:'user'
},
addresses:[
    addressesSchema
]

})


const userModel=mongoose.model('user',UserSchema);

module.exports=userModel;
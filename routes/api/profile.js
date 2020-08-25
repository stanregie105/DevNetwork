const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { body, validationResult} = require('express-validator');



//@route Get api/profile/me
//@desc  Get current user profile
//@access Private
router.get('/me',auth, async (req,res)=>{
    try{
    // user for profile obtained from authenticated user in auth
     const profile = await Profile.findOne({  user: req.user.id}).populate('user',['name','avatar']);
    // if profile does not exist
     if(!profile){
         return res.status(400)
         .json({ msg: 'There is no profile for this user'});
     }
     //if profile exists
     res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500)
        .send('Serever Error');
    }
});

//@route Post api/profile
//@desc  Create or update user profile
//@access Private

router.post('/',[auth,
[
    body('status', 'status is required')
    .not()
    .isEmpty(),

    body('skills','skills is required')
    .not()
    .isEmpty()
]
],
async (req, res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
      return res.status(400)
      .json({ errors: errors.array() })
  }

   const {
      company,
      location,
      website,
      bio,
      skills,
      status,
      githubusername,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook
    } = req.body;
    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills){
        profileFields.skills = skills.split(',').map(skill=>skill.trim());
    }
// Build social object

profileFields.social ={};
if(youtube) profileFields.social.youtube = youtube;
if(twitter) profileFields.social.twitter = twitter;
if(facebook) profileFields.social.facebook = facebook;
if(linkedin) profileFields.social.linkedin = linkedin;
if(instagram) profileFields.social.instagram = instagram;

   try{
     let profile = await Profile.findOne({ user: req.user.id});
     if(profile){
         //update if a profile is found
         profile = await Profile.findOneAndUpdate(
         { user: req.user.id}, 
         {$set: profileFields}
         ,{ new: true});
         return res.json(profile);
     }
     //create a new profile if not found and save, then return profile
     profile = new Profile(profileFields); 
     await profile.save();
     res.json(profile);

   }catch(err){
       console.error(err.message);
       res.status(400).send('Server Error');
   }

});

//@route Get api/profile
//@desc  Get all profiles
//@access Public

router.get('/', async (req, res)=>{
  try{
      // Gets the entire profiles
      const profiles = await Profile.find().populate('user',['name','avatar']);
      res.json(profiles);

  }catch(err){
      console.error(err.message);
      res.status(500).send('Server Error');
  }
});

//@route Get api/profile/user/:user_id
//@desc  Get profiles by userId
//@access Public

router.get('/user/:user_id', async (req, res)=>{
  try{
      // Gets the profile with specific user_id
      const profile = await Profile.findOne({ user: req.params.user_id}).populate('user',['name','avatar']);
      if(!profile) return res.status(400).json({ msg:' Profile not found'});
      res.json(profile);

  }catch(err){
      console.error(err.message);
      if(err.kind=='ObjectId'){
       return res.status(400).json({ msg:'Profile not found'});        
      }
      res.status(500).send('Server Error');
  }
})

//@route Delete api/profile
//@desc  delete profile, user
//@access Private

router.delete('/',auth, async (req, res)=>{
  try{
      //@todo remove user's post

      //Remove profile
      await Profile.findOneAndRemove({ user: req.user.id});
      await User.findOneAndRemove({ _id: req.user.id});

      res.json({ msg: 'User deleted'});

  }catch(err){
      console.error(err.message);
      res.status(500).send('Server Error');
  }
});

//@route Put api/profile/experience
//@desc  add profile experience
//@access Private

router.put('/experience',[auth,[
    body('title','Title is required')
    .not()
    .isEmpty(),
    body('company','Company is required')
    .not()
    .isEmpty(),
    body('from','From date is required')
    .not()
    .isEmpty()
]], async (req,res)=>{
   const errors = validationResult(req);
   if(!errors.isEmpty()){
       return res.status(400)
       .json({ errors: errors.array()});
   }
   const {
       title,
       company,
       location,
       from,
       to,
       current,
       description
   } = req.body;

   const newExp ={
       title,
       company,
       location,
       from,
       to,
       current,
       description
   }

   try{
     const profile = await Profile.findOne({ user: req.user.id});
  
     // so the most recent experience will be added to the top
     profile.experience.unshift(newExp);
     await profile.save();
     return res.json({profile});
   }catch(err){
       console.error(err.message);
       res.status(500)
       .send('Server Error');
   }
})


//@route DELETE api/profile/experience/exp_id
//@desc  Delete experience from profile
//@access Private

router.delete('/experience/:exp_id', auth, async (req,res)=>{
   try{
       //obtain the profile with spacific user_id
     const profile = await Profile.findOne({ user: req.user.id});
     // Get index to remove
     const removeIndex = profile.experience.map(item=>item.id)
     .indexOf(req.params.exp_id);
     // removes on experience with exp_id from profile experience
     profile.experience.splice(removeIndex, 1);
     await profile.save();
     res.json( profile);

   }catch(err){
       console.error(err.message);
       res.status(500)
       .send('Server Error');
   }
})


//@route Put api/profile/education
//@desc  add profile education
//@access Private

router.put('/education',[auth,[
    body('school','School is required')
    .not()
    .isEmpty(),
    body('degree','Degree is required')
    .not()
    .isEmpty(),
     body('fieldofstudy','Field of study is required')
    .not()
    .isEmpty(),
    body('from','From date is required')
    .not()
    .isEmpty()
]], async (req,res)=>{
   const errors = validationResult(req);
   if(!errors.isEmpty()){
       return res.status(400)
       .json({ errors: errors.array()});
   }
   const {
       school,
       degree,
       fieldofstudy,
       from,
       to,
       current,
       description
   } = req.body;

   const newEdu ={
       school,
       degree,
       fieldofstudy,
       from,
       to,
       current,
       description
   }

   try{
     const profile = await Profile.findOne({ user: req.user.id});
  
     // so the most recent experience will be added to the top
     profile.education.unshift(newEdu);
     await profile.save();
     return res.json({profile});
   }catch(err){
       console.error(err.message);
       res.status(500)
       .send('Server Error');
   }
})


//@route DELETE api/profile/education/edu_id
//@desc  Delete education from profile
//@access Private

router.delete('/education/:edu_id', auth, async (req,res)=>{
   try{
       //obtain the profile with spacific user_id
     const profile = await Profile.findOne({ user: req.user.id});
     // Get index to remove
     const removeIndex = profile.education.map(item=>item.id)
     .indexOf(req.params.edu_id);
     // removes on education with exp_id from profile education
     profile.education.splice(removeIndex, 1);
     await profile.save();
     res.json( profile);

   }catch(err){
       console.error(err.message);
       res.status(500)
       .send('Server Error');
   }
})


//@route GET api/profile/github/:username
//@desc  Get user repos from github
//@access Public

router.get('/github/:username',(req, res)=>{
    try{
     const options ={
         uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&
         sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
         method: 'GET',
         headers:{ 'user-agent':'node.js'}
     }

     request(options,(error, response, body)=>{
        if(error) console.error(error);
        if(response.statusCode!==200){
           return res.status(404).json({msg: 'No github profile found'});
        }
        res.json(JSON.parse(body));
     });
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})


module.exports = router;
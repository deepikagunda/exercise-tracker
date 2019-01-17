const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')
const mongo = require('mongodb').MongoClient;
const mongoose = require('mongoose')
//mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

mongo.connect(process.env.MLAB_URI, function(err, client) {
            let db = client.db("fcc");


           

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


  
  
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})
  
//lets get the exercise log of the user
app.get('/api/exercise/add',function(req,res){
  //get the id for which log is needed.
  let id = req.query.userId;
  let from = req.query.from;
  if(from)
  {
    //if from date was provided .format it .
    let d = new Date(from);
    d.setHours(0,0,0,0);
    from = d;
  }
  let to = req.query.to;
  if(to)
  {
    let d = new Date(to);
    d.setHours(0,0,0,0);
    to = d;
  }
  let limit = req.query.limit;
  if(id)
  {
    //find the exercise log if the user is valid.
    db.collection('exerciseusers').find({_id:id}).count().toArray( function(err,cnt){
    if(cnt[0]==1)
    {
      //for this user ,get the exercise log.
      let query={userId:id};
      //if from ,to dates were provided.
      if(from){
      query.$gte={date:from};
      }
      if(to)
      {
       
        query.$lte={date:to};
      }
      db.collection('exerciselog').find(query).toArray(function(err,docs){
      
      if(limit)
      { limit = parseInt(limit);
        let cnt = docs.count;
        limit = ( cnt < limit ?cnt:limit);
       //copying docs to different array as mongo doesnt allow changing docs..I think so .with my experience in mongppse. 
       let changeddocs = docs;
        changeddocs.splice(0,cnt-limit);
        console.log('changeddocs'+changeddocs);
        res.send({user:{userId:id,log:changeddocs,count:changeddocs.length}});
      }
        else
        {
          res.send({user:{userId:id,log:docs,count:docs.length}});
        }
        
      
      });//end of exercise log query
                                 
     
      
    }
    });//end of user find.
    
  }
  else
  {
    //id was not provided.
    res.json({'error': 'provide userId'});
  }
  
});//end of get 
app.post('/api/exercise/add',function(req,res){
  //we need to add exercise to a valid user.
 //take the userid and search for that person in exerciseusers collection.
  let id = req.body.userId;
  db.collection('exerciseusers').find({_id:id}).count().toArray( function(err,cnt){
    if(cnt[0]==1)
    {
      //now that we have a user,lets add an entry to the exerciselog collection.
      let date = new Date();
      //var d = new Date();
      date.setHours(0,0,0,0);
      if(req.body.date)
      {
        //take the date and create a date object.
        let d = new Date(req.body.date);
        //we do not want time to entered ..so setting it to 0.
        d.setHours(0,0,0,0);
        //assign the date received to the variable.
        date = d;
      }
      
      let toInsert ={"userId":id,"date":date,"description":req.body.description,"duration":req.body.duration};
      db.collection('exerciselog').insertOne(toInsert ,function(err,doc){
      //once we insert an individual exercise log entry. return the response.
        res.send(doc);
      
      });
    }
    else
    { //user is not existing and hence cannot add exercise
      res.json({'error':'user is not existing.' });
    }
  
  });//end of find of user in exerciseusers.
});//end of post.
app.post('/api/exercise/new-user',function(req,res){
//lets create a new user.
//read the username 
let username = req.body.username;
//insert into collection exeriseusers if not already present.
  //try to find if already present ,if not insert.
   db.collection('exerciseusers').find({username:username}).count().toArray( function(err,cnt){
   if(cnt[0]==1)
   {
     //it meams the user already exists in database .return error to user
     res.json({'error':'user already exists'});
   }
  else
  {
    //insert into database and return _id and username as a result.
    db.collection('exerciseusers').insertOne({
                    username:username
                }, function(err, doc1) {
                    if (err) {
                        console.log('error while inserting into urls collection');
                    } else {
                     //return success to the user. 
                       res.json({
                            id:doc1._id,
                            username:doc1.username
                        });
                      
                    }
    });
   
    
  }
   
   
   } );                
                    

});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

});
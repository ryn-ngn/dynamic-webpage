const mongoose = require ('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema ({
    "userName": {
        "type": String,
        "unique": true
    },
    "password": String,
    "email": String
});

let loginDetailSchema = new Schema({
    "dateTime": Date,
    "userAgent": String
});

userSchema.add( {loginHistory: [ loginDetailSchema ]});

let User;
 
exports.initialize =  () => {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://ryan:8808@senecaweb.r3mta.mongodb.net/web322a6?retryWrites=true&w=majority");

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};

exports.registerUser =  (userData) => {
    return new Promise( (resolve, reject) => {
        if (userData.password != userData.password2){
            reject('Passwords do not match');
        } else {
            bcrypt
            .genSalt(10) 
            .then(salt => bcrypt.hash(userData.password, salt)) 
            .then( hash => {
                userData.password = hash;
                let newUser = new User(userData);
                newUser.save( err => {
                    if (err) {
                        if (err.code === 11000) reject ('User Name already taken');
                        else reject (`There was an error creating the user: ${err}`);
                    } else resolve();
                });
            })
            .catch((err) => {
              console.log(err); // Show any errors that occurred during the process
            });
        }
    });
};

exports.checkUser = (userData) => {
  return new Promise((resolve, reject) => {
    User.find({ userName: userData.userName })
      .exec()
      .then( users => {
        if (users.length == 0)
          reject(`Unable to find user: ${userData.userName}`);
        bcrypt.compare(userData.password, users[0].password).then( result => {
          if (result) {
            let logHistory = {
              dateTime: new Date().toString(),
              userAgent: userData.userAgent,
            };
            users[0].loginHistory.push(logHistory);
            User.update(
              { userName: users[0].userName },
              { $set: { loginHistory: users[0].loginHistory } }
            )
              .exec()
              .then(() => resolve(users[0]))
              .catch((err) =>
                reject(`There was an error verifying the user: ${err}`)
              );
          } else reject(`Incorrect Password for user: ${userData.userName}`);
        });
      })
      .catch((err) => reject(`Unable to find user: ${userData.userName}`));
  });
};


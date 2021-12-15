/*
  dependencies
*/

  const express = require('express')
  const admin = require('firebase-admin')
  let inspect = require('util').inspect
  let Busboy = require('busboy');
  let path = require('path')
  let os = require('os')
  let fs = require('fs')
  let UUID = require('uuid-v4')
  let webpush = require('web-push')

/*
  config - express
*/

  const app = express()

/*
  config - firebase
*/

  const serviceAccount = require('./serviceAccountKey.json');
    
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "quasagram-bff85.appspot.com"
  });

  const db = admin.firestore();
  let bucket = admin.storage().bucket();

/*
  config - webpush
*/

webpush.setVapidDetails(
  'mailto:test@TEST.com',
  //Public key
  'BL-pUp3zfUD304XEdbe7yonORryM3B7pj_n2mY-qBMeiH9FinS6Ny6aaRFZX1uHYVw03V_fDkRVfrr0h29JAx9E',
  //Private Key
  '9yF24idH0xI28iiruOOyWFqmpSeqC6d7A2APmBu_YHg'
);


/*
  endpoint - posts
*/

  app.get('/posts', (request, response) => {
    response.set('Access-Control-Allow-Origin', '*')

    let posts = []
    db.collection('posts').orderBy('date', 'desc').get().then(snapshot => {
      snapshot.forEach((doc) => {
        posts.push(doc.data())
      });
      response.send(posts)
    })
  })

/*
  endpoint - createPost
*/

  app.post('/createPost', (request, response) => {
    response.set('Access-Control-Allow-Origin', '*')

    let uuid = UUID()

    var busboy = new Busboy({ headers: request.headers });

    let fields = {}
    let fileData = {}

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
      // /tmp/4564564-234234.png
      let filepath = path.join(os.tmpdir(), filename)
      file.pipe(fs.createWriteStream(filepath))
      fileData = { filepath, mimetype }
    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      fields[fieldname] = val
    });

    busboy.on('finish', function() {
      
      bucket.upload(
        fileData.filepath,
        {
          uploadType: 'media',
          metadata: {
            metadata: {
              contentType: fileData.mimetype,
              firebaseStorageDownloadTokens: uuid
            }
          }
        },
        (err, uploadedFile) => {
          if (!err) {
            createDocument(uploadedFile)
          }
        }
      )

      function createDocument(uploadedFile) {
        db.collection('posts').doc(fields.id).set({
          id: fields.id,
          caption: fields.caption,
          location: fields.location,
          date: parseInt(fields.date),
          imageUrl: `https://firebasestorage.googleapis.com/v0/b/${ bucket.name }/o/${ uploadedFile.name }?alt=media&token=${ uuid }`
        }).then(() => {
          sendPushNotifications()
          response.send('Post added: ' + fields.id)
        })
      }

      function sendPushNotifications() {
        let subscriptions = []
        db.collection('subscriptions').get().then(snapshot => {
          snapshot.forEach((doc) => {
            subscriptions.push(doc.data())
          });
          return subscriptions
        }).then(subscriptions => {
          subscriptions.forEach(subscription => {
            const pushSubscription = {
              endpoint: subscription.endpoint,
              keys: {
                auth: subscription.keys.auth,
                p256dh: subscription.keys.p256dh
              }
            };
            let pushContent = {
              title: 'new Quasagram Post',
              body: 'new Post Added check it out',
              openUrl: '/#/'
            }
            let pushContentStringified = JSON.stringify(pushContent)
            webpush.sendNotification(pushSubscription, pushContentStringified);
          }) 
        })
      }
    });

    request.pipe(busboy)
  })

/*
  endpoint - createSubscription
*/
  app.post('/createSubscription', (request, response) => {
    response.set('Access-Control-Allow-Origin', '*')
    db.collection('subscriptions').add(request.query).then(docRef => {
      response.send({
        message: 'Subscriptions Added',
        postData: request.query
      })
    })
  })

/*
  listen
*/

  app.listen(process.env.PORT || 3000)
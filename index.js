const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Firestore = require('@google-cloud/firestore');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const express = require('express');
const app = express();
app.use(express.static('../public'));


// app.get('/', (request,response) => {
//     response.status(200).sendFile('/index.html');
// });

app.get('/hello', (request,response) => {
    response.status(200).send('hello!')
});

app.post('/submitForm', (request,response) => {
    try {
        admin.initializeApp(functions.config().firebase);
    }catch(e) {
        console.log("app is already initialaized");
        
    }
    const firestore = new Firestore();
    const settings = { timestampsInSnapshots: true };
    firestore.settings(settings);
    const db = admin.firestore();

    const tempFilePath = path.join(os.tmpdir(), "output.csv");
    let start = request.body.start;
    let end = request.body.end;
    let j = {};
    let csv = ""
    let pods = [];

    db.collection('test').where("time",">=",start).where("time","<=",end).get().then( (q) => {
        q.forEach(doc => {
            // json[doc.id.toDate()] = doc.data;
            if (!doc.location in pods) {
                csv = doc.location + ',' + csv;
                pods.push(doc.location);
            }
            csv += '\n' + doc.time + ',' +doc.temp;
        });

        fs.outputFile(tempFilePath,csv)
        .then( () => {
            console.log(os.tmpdir());
            //response.status(200).download(tempFilePath);
            response.status(200).send(csv);
        }).catch(e => {
            throw e;
        });
    }).catch(e => {
        throw e;
    });
});

app.get('/submitForm', (request,response) => {
    response.status(200).send("found ya");
});
exports.main = functions.https.onRequest(app);

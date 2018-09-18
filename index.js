const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Firestore = require('@google-cloud/firestore');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const express = require('express');
const app = express();
app.use(express.static('../public'));

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
    start = new Date(start).valueOf();
    end = new Date(end).valueOf();
    let j = {};
    let csv = ""
    let pods = [];
    db.collection('test').where("epoch",">=",start).where("epoch","<=",end).get().then( (q) => {
    //db.collection('test').where("location","==","Home").get().then( (q) => {
        q.forEach(doc => {
            // json[doc.id.toDate()] = doc.data;
            let data = doc.data();
            if (!( isIn(data.location,pods) )) {
                csv = data.location + ',' + csv;
                pods.push(data.location);
            }
            csv += '\n' + data.time + ',' +data.temp + ',';
        });

        fs.outputFile(tempFilePath,csv)
        .then( () => {
            console.log(os.tmpdir());
            response.status(200).download(tempFilePath);
            // response.status(200).send(csv);
        }).catch(e => {
            throw e;
        });
    }).catch(e => {
        throw e;
    });
});

function isIn(pod,pods) {
    return pods.some(function(el) {
      return el === pod;
    }); 
  }

exports.main = functions.https.onRequest(app);


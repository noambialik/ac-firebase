const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Firestore = require('@google-cloud/firestore');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const express = require('express');
const app = express();
const favicon = require('serve-favicon');
app.use(express.static('../public'));
// app.use(favicon('../public/icon.ico'));
app.use('/icon.ico', express.static('../public/icon.ico'));

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
    let startReq = request.body.start;
    let endReq = request.body.end;
    start = new Date(startReq).valueOf();
    end = new Date(endReq)//.valueOf();
    end.setDate(end.getDate() + 1);
    console.log(end);
    end = end.valueOf();
    let j = {};
    let csv = " ,"
    let pods = [];
    
    db.collection('AcStats').where("epoch",">=",start).where("epoch","<=",end).get().then( (q) => {
    // db.collection('AcStats').get().then( (q) => {
        console.log("0");
        
        q.forEach(doc => {
            // json[doc.id.toDate()] = doc.data;
            console.log("1");
            
            let data = doc.data();
            console.log(data);
            
            if (!( isIn(data.location,pods) )) {
                csv = data.location + ',' + csv;
                pods.push(data.location);
            }
            csv += '\n' + formatTime(data.time) + ',' +data.temp + ',';
        });
        console.log("2");
        
        fs.outputFile(tempFilePath,csv)
        .then( () => {
            console.log('created temp file at' + os.tmpdir());
            if (csv == " ,") {
                response.status(404).send('no such data')
            } else {
                response.status(200).download(tempFilePath);
                //response.send('hi');
            }
            
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

  function formatTime(d) {
      let dateType = new Date(d);
      let iso = dateType.toISOString();
      let a = iso.split('T');
      let date = a[0];
      let time = a[1];
      let dateArray = date.split('-');
      return dateArray[1] + '-' + dateArray[2] + '-' + dateArray[0] + ' ' + time.substr(0,4);
  }

exports.main = functions.https.onRequest(app);
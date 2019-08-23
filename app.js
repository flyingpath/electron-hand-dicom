"use strict";

var zerorpc = require("zerorpc");

var $ = require('jquery');

var para = {
  pack: {
    allWork: 0,
    completedCount: 0,
    uncompletedCount: 0,
    errList: []
  },
  download: {
    allWork: 0,
    completedCount: 0,
    uncompletedCount: 0,
    errList: []
  }
};
$(document).ready(function () {});

var pickFileDirectory = function pickFileDirectory(e) {
  $('#download-directory').text(e);
};

var decodeString = function decodeString(str) {
  var strList = str.split(",");
  strList = strList.map(function (d) {
    return d.trim();
  });
  return strList;
};

var returnStr = function returnStr(status) {
  var statusDis = {
    'pack': '檔案抓取中... ',
    'download': '檔案下載中... '
  };

  if (para[status].allWork > 0) {
    return "".concat(statusDis[status]).concat((para[status].completedCount + para[status].uncompletedCount).toString(), " / ").concat(para[status].allWork);
  } else {
    return '';
  }
};

var updateErrorMsg = function updateErrorMsg(content) {
  $('#err-message').text(content + '\n' + $('#err-message').text());
};

var clearErrorMsg = function clearErrorMsg(content) {
  $('#err-message').text('');
};

var deleteRemoteFile = function deleteRemoteFile(list) {
  var client = new zerorpc.Client({
    timeout: 6000000,
    heartbeatInterval: 6000000
  });
  client.connect("tcp://172.16.253.46:4242");
  client.on("error", function (error) {
    console.error("RPC client error:", error);
  });
  list.forEach(function (eachStudyid) {
    client.invoke("delete", eachStudyid, function (error, res) {
      if (error) {
        updateErrorMsg(eachStudyid + ' delete err: ' + error.toString());
      } else {}
    });
  });
};

var downloadFileBySCP = function downloadFileBySCP(list) {
  var scpClient = require('scp2');

  $('#result-message').text(returnStr('pack') + '\n' + returnStr('download'));
  list.forEach(function (eachStudyid) {
    scpClient.scp({
      host: '172.16.253.46',
      username: 'syscc',
      password: 'syscctop',
      path: "/home/syscc/docker/ge_receiver_hand/code/received_files/".concat(eachStudyid, "/newdcm/").concat(eachStudyid, ".7z")
    }, $('#download-directory').text() + '/', function (err) {
      if (err === null) {
        para.download.completedCount += 1;
      } else {
        para.download.uncompletedCount += 1;
        para.pack.errList.push(eachStudyid);
        updateErrorMsg(eachStudyid + ' download err: ' + err);
      }

      $('#result-message').text(returnStr('pack') + '\n' + returnStr('download'));

      if (para.download.completedCount + para.download.uncompletedCount === para.download.allWork) {
        deleteRemoteFile(list);
      }
    });
  });
};

var downloadFile = function downloadFile() {
  if ($('#download-directory').text().trim() === '' || !$('#download-directory').text()) {
    alert('Download directory is null !');
    return false;
  }

  clearErrorMsg();
  para = {
    pack: {
      allWork: 0,
      completedCount: 0,
      uncompletedCount: 0,
      errList: []
    },
    download: {
      allWork: 0,
      completedCount: 0,
      uncompletedCount: 0,
      errList: []
    }
  };
  var client = new zerorpc.Client({
    timeout: 60000,
    heartbeatInterval: 60000
  });
  client.connect("tcp://172.16.253.46:4242");
  client.on("error", function (error) {
    console.error("RPC client error:", error);
  });
  var listStr = $('#studyid-input').val();
  var list = decodeString(listStr);
  para.pack.allWork = list.length;
  para.download.allWork = list.length;
  $('#result-message').text(returnStr('pack'));
  list.forEach(function (eachStudyid) {
    client.invoke("move", eachStudyid, function (error, res) {
      if (error) {
        para.pack.uncompletedCount += 1;
        para.pack.errList.push(eachStudyid);
        updateErrorMsg(eachStudyid + ' move err ' + +error.toString());
      } else {
        para.pack.completedCount += 1;
      }

      $('#result-message').text(returnStr('pack'));

      if (para.pack.completedCount + para.pack.uncompletedCount === para.pack.allWork) {
        downloadFileBySCP(list);
      }
    });
  });
}; // ls.stderr.on('data', (data) => {
//   console.log(`stderr: ${data}`);
// });
// ls.on('close', (code) => {
//   console.log(`child process exited with code ${code}`);
// });

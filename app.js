"use strict"

require("@babel/register");
const zerorpc = require("zerorpc");
const path = require("path");


const $ = require('jquery');
const { spawn } = require('child_process');


let para = {
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
}

$(document).ready(() => {
});

const pickFileDirectory = (e) => {
    $('#download-directory').text(e)
};

const decodeString = (str) =>{
    
    let strList = str.split(",");
    strList = strList.map( d => d.trim() );
    
    return strList
};

const returnStr = (status) => {
    const statusDis = {
        'pack': '檔案抓取中... ',
        'download': '檔案下載中... '
    }
    if (para[status].allWork > 0){
        return `${statusDis[status]}${ (para[status].completedCount + para[status].uncompletedCount).toString() } / ${para[status].allWork}`
    } else {
        return ''
    }
}

const updateErrorMsg = (content) => {
    $('#err-message').text( content + '\n' + $('#err-message').text() )
}

const clearErrorMsg = (content) => {
    $('#err-message').text( '' )
}

const deleteRemoteFile = (list) => {

    const client = new zerorpc.Client({
        timeout: 6000000,
        heartbeatInterval:6000000
    })
    client.connect("tcp://172.16.253.46:4242")
    client.on("error", function(error) {
        console.error("RPC client error:", error)
    })

    list.forEach( eachStudyid => {
        client.invoke("delete", eachStudyid, (error, res) => {
            if (error) {
                updateErrorMsg( eachStudyid + ' delete err: ' + error.toString() )
            } else {
            }
        })
    })
}

const downloadFileBySCP = (list) => {
    const scpClient = require('scp2');

    $('#result-message').text( returnStr('pack') + '\n' + returnStr('download') )

    list.forEach( eachStudyid => {

        scpClient.scp( 
            {
                host: '172.16.253.46',
                username: 'syscc',
                password: 'syscctop',
                path: `/home/syscc/docker/ge_receiver_hand/code/received_files/${eachStudyid}/newdcm/${eachStudyid}.7z`
            }, 
            $('#download-directory').text() + path.sep,
            function ( err ) {
                if ( err === null ) {
                    para.download.completedCount += 1
                } else {
                    para.download.uncompletedCount += 1
                    para.pack.errList.push(eachStudyid)
                    updateErrorMsg( eachStudyid + ' download err: ' + err )
                }

                $('#result-message').text( returnStr('pack') + '\n' + returnStr('download') )

                if ( (para.download.completedCount + para.download.uncompletedCount) === para.download.allWork ) {
                    deleteRemoteFile( list )
                }
            }
        )
    })
}

const downloadFile = () => {

    if ( $('#download-directory').text().trim() === '' || !$('#download-directory').text() ){
        alert('Download directory is null !')
        return false
    }

    clearErrorMsg()

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
    }

    const client = new zerorpc.Client({
        timeout: 60000,
        heartbeatInterval:60000
    })
    client.connect("tcp://172.16.253.46:4242")
    client.on("error", function(error) {
        console.error("RPC client error:", error)
    })

    const listStr = $( '#studyid-input' ).val()
    const list = decodeString( listStr )

    para.pack.allWork     = list.length
    para.download.allWork = list.length
    
    $('#result-message').text( returnStr('pack') )

    list.forEach( eachStudyid => {
        client.invoke("move", eachStudyid, (error, res) => {
            if (error) {
                para.pack.uncompletedCount += 1
                para.pack.errList.push(eachStudyid)
                updateErrorMsg( eachStudyid + ' move err ' +  + error.toString() )
            } else {
                para.pack.completedCount += 1
            }

            $('#result-message').text( returnStr('pack') )

            if ( (para.pack.completedCount + para.pack.uncompletedCount) === para.pack.allWork ) {
                downloadFileBySCP( list )
            }
        })
    })
}








// ls.stderr.on('data', (data) => {
//   console.log(`stderr: ${data}`);
// });

// ls.on('close', (code) => {
//   console.log(`child process exited with code ${code}`);
// });

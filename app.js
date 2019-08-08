"use strict"

require("@babel/register");

const $ = require('jquery');
const { spawn } = require('child_process');

const ls = spawn('ls', ['/home']);
ls.stdout.on('data', (data) => {
  console.log( data.toString() );
});

$( document ).ready( ()=>{
    console.log(2)
} )

const clickButton = () => {
    $(  )
}






// ls.stderr.on('data', (data) => {
//   console.log(`stderr: ${data}`);
// });

// ls.on('close', (code) => {
//   console.log(`child process exited with code ${code}`);
// });

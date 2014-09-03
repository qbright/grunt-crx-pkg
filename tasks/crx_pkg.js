/*
 * grunt-crx-pkg
 * https://github.com/qbright/grunt-crx-pkg
 *
 * Copyright (c) 2014 zqbright
 * Licensed under the MIT license.
 */

'use strict';

var crypto = require("crypto"),
	fs = require("fs"),
	path = require("path"),
	child = require("child_process");

var defaultPem = "key.pem";
require("node-zip");


module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('crx_pkg', 'use to package chrome extension', function() {
  	var done = this.async();
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options();

    if(!options.srcFolder && !options.destFolder){
    	grunt.fail.fatal("openssl wasn't installed,please install first");
    }
    try{
  		opensslCheck();
  	}catch(e){
  		grunt.fail.fatal("openssl wasn't installed,please install first");

  	}

  	if(!fs.existsSync(options.srcFolder) || 
  	   !fs.statSync(options.srcFolder).isDirectory()){
  		grunt.fail.fatal("the extension folder wasn't exist, please check the option");
  	}


  	var pkg = function(done){
  		generalCrx(options.pem,options.srcFolder,options.destFolder,done);
   			
  	}
   	if(!options.pem){
   		if(fs.existsSync(defaultPem) &&
   		   fs.statSync(defaultPem).isFile() ){
   			grunt.log.warn("the pem file is no find,will use the default one : key.pem");
   			options.pem = "key.pem";
   			pkg(done);
   		}else{
   			grunt.log.warn("the pem file is empty , will general a new one");

			generalPrivateKey(function(){
				options.pem = "key.pem";
				pkg(done);
			}.bind(this));

   		}
   	}else{
   			pkg(done);
   	}

  		
  	

  });

  function generalCrx(pemPath,extPath,buildPath,done){
  	try{
  		var pem = fs.readFileSync(pemPath),
  			zip_ = new JSZip();
  		zipRecursion(extPath,zip_);	
  		var zipData = new Buffer(zip_.generate({base64:false,compression:"DEFLATE"}),"binary"),
  			signature = new Buffer(crypto.createSign("sha1").update(zipData).sign(pem),"binary");

  			generalPublicKey(pem,function(publicKey){
  				var keyLength = publicKey.length,
  				    signLength = signature.length,
  				    zipLength = zipData.length,
  				    crxLength = 16 + keyLength + signLength + zipLength,
  				    crx = new Buffer(crxLength);
  				crx.write("Cr24" + Array(13).join("\x00"),"binary");
  				crx[4] = 2;
  				crx[8] = keyLength;
  				crx[12] = signLength;

  				publicKey.copy(crx,16);
  				signature.copy(crx,16 + keyLength);
  				zipData.copy(crx,16 + keyLength + signLength);
  				fs.writeFileSync(buildPath,crx);
          grunt.log.ok("the extension pkg is general to : " + buildPath);
  				done();
  			});


  	}catch(e){
  		grunt.fail.fatal("fail to general the crx",e);
  	}


  }


  function zipRecursion(folderPath,zip,rootPath,rootPathLength){
     var dirList = fs.readdirSync(folderPath),
        rootPath = rootPath || folderPath;
    if(!rootPathLength){
        rootPathLength = rootPath.length + 1;
    }

    dirList.forEach(function(item){
        var tempPath = path.join(folderPath,item),
            subPath = tempPath.substr(rootPathLength);

        if(fs.statSync(tempPath).isDirectory()){
            zip.folder(subPath);
            zipRecursion(tempPath,zip,rootPath,rootPathLength);
        }else{
            var input = fs.readFileSync(path.join(rootPath,subPath),"binary");


            zip.file(subPath,input,{
                binary:true
            });
        }
    })

}

 function generalPublicKey(privateKey,cb){
 	var rsa = child.spawn("openssl",["rsa","-pubout","-outform","DER"]);
 		rsa.stdout.on("data",function(data){
 			cb && cb(data);
 		});
 		rsa.stdin.end(privateKey);
 }

  function generalPrivateKey(cb){
  		var errorG = function(){
  			grunt.fail.fatal("fail to general PrivateKey");
  		}

  		
  		var pk = child.spawn("openssl",["genrsa","-out","tem.pem","1024"]);

  			pk.on("close",function(code){
  				if(!code){
  					 var pkcs8 = child.spawn("openssl",["pkcs8","-topk8","-inform",
                                                "PEM","-outform","PEM",
                                                "-nocrypt","-in","tem.pem","-out",defaultPem]);
  					pkcs8.on("close",function(code){
  						if(!code){
  							cb && cb();
  						}else{
  							errorG();
  						}

  					}.bind(this));
  				}else{
  					errorG();
  				}
  		}.bind(this));
  }



  function opensslCheck(){
  	var  rsa = child.spawn("openssl", ["rsa", "-pubout", "-outform", "DER"]);
    	rsa.stdin.end("privateKey");
  }

};

/* Created by tommyZZM on 2016/1/7. */
"use strict"
var path = require("path")
var gfes = require("../index.js");
var through = require("through2")

var chai = require('chai');
chai.use(require('chai-string'));

var should = chai.should;
var expect = chai.expect;
var assert = chai.assert

//todo:usual,
//测试包装后browserify的日常使用是否正常
describe('gfes.browserify', function() {
    this.slow(100);

    it('browserify single bundle', function(done) {
        let b = gfes.browserify("./test/resource/js/module1.js")
        b.bundle("app.js")
            .pipe(through.obj((f,env,next)=>{
                expect(path.basename(f.path)).to.equal("app.js")
                next(null,f)
            }))
            .on("finish",function(){
                done()
            })
    });
});

//测试resolve参数
describe('gfes.browserify:resolvify', function() {
    //todo:resolve
    it('resolve global', function(done) {
        let b = gfes.browserify("./test/resource/js/module-require-react.js",{
            resolve:{
                react:"global:React"
            }
        })
        b.bundle("app.js")
            .pipe(through.obj((f,env,next)=>{
                assert.include(f.contents.toString(),"module.exports = global.React")
                next(null,f)
            }))
            .on("finish",done)
    });

    //todo:resolve:redirect
    it('resolve redirect', function(done) {
        let b = gfes.browserify("./test/resource/js/module-redirect-module3.js",{
            resolve:{
                module3:"./test/resource/js/module3.js"
            }
        })
        b.bundle("app.js")
            .pipe(through.obj((f,env,next)=>{expect('abcdef').to.be.singleLine();
                assert.include(f.contents.toString(),"require('./test/resource/js/module3.js')")
                next(null,f)
            }))
            .on("finish",done)
    });
})

//todo:querify
describe.skip('gfes.browserify:querify', function() {
    //todo:resolve
    it('queryloader', function(done) {
        let b = gfes.browserify("./test/resource/js/module-require-json.js")
        b.bundle("app.js")
            .pipe(through.obj((f,env,next)=>{expect('abcdef').to.be.singleLine();
                assert.include(f.contents.toString(),"require('./test/resource/js/module3.js')")
                next(null,f)
            }))
            .on("finish",done)

        done()
    })
})

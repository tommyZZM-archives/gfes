/* Created by tommyZZM on 2016/2/18. */
"use strict"
const cwd = process.cwd();
const path = require("path");
const through = require("through2")
const browserify = require("../lib/tools/browserify")
const watchify = require("watchify");
const fs = require("fs")

const expect = require("chai").expect

describe('browserify', function() {
    this.slow(160);

    it('base', function (done) {
        let b = browserify("./test/resource/js/module1.js")
        b.source("app.js")
            .pipe(through.obj((file, env, next)=> {
                expect(path.basename(file.path)).to.equal("app.js")
                next(null, file)
            }))
            .on("finish", function () {
                done()
            })
    });

    it('base:redirect', function (done) {
        let b = browserify("./test/resource/js/module-redirect-module3.js",{
            resolve:{
                module3:"./test/resource/js/module3.js"
            }
        })
        b.source("app.js")
            .pipe(through.obj((file, env, next)=> {
                expect(file.contents.toString()).to.include("exports.name = \"module3\"")
                next(null, file)
            }))
            .on("finish", function () {
                done()
            })
    });

    it('base:redirect:global', function (done) {
        let b = browserify("./test/resource/js/module-redirect-react.js",{
            resolve:{
                react:"global.React"
            }
        })
        b.source("app.js")
            .pipe(through.obj((file, env, next)=> {
                //console.log(file.contents.toString())
                expect(file.contents.toString()).to.include("global.React")
                next(null, file)
            }))
            .on("finish", function () {
                done()
            })
    });

    it('processify:inline', function (done) {
        let b = browserify("./test/resource/js/module-processify-inline.js")
        b.processor(function (accept, file) {
            return accept(test=>test === "abc")
                .then(_=> {
                    return {}
                })
        }).source("app.js")
            .pipe(through.obj((file, env, next)=> {
                console.log(file.contents.toString())
                expect(file.contents.toString()).to.include("version = \"0.0.1\"")
                next(null, file)
            }))
            .on("finish", function () {
                done()
            })
    });

    it('processify:custom', function (done) {
        let b = browserify("./test/resource/js/module-processify-custom.js")

        b.processor(function (accept, file) {
                return accept((imagepath)=>path.extname(imagepath) === ".png")
                    .then(imagepath=> {
                        this.inline(false);
                        return path.relative(cwd, path.join(file, imagepath))
                    })
            })
            .processor(function (accept, file) {
                return accept(test=>test === "abc")
                    .then(_=> {
                        return {}
                    })
            })

        b.source("app.js")
            .pipe(through.obj((file, env, next)=> {
                //console.log(file.contents.toString())
                expect(file.contents.toString()).to.include("module.exports = \""+"test\\\\resource\\\\js\\\\assets\\\\a.png"+"\"")
                next(null, file)
            }))
            .on("finish", function () {
                done()
            })
    });

    it('processify:invaild', function (done) {
        let b = browserify("./test/resource/js/module-processify-custom.js")

        b.source("app.js")
            .pipe(through.obj((file, env, next)=> {
                //console.log(file.contents.toString())
                //expect(file.contents.toString()).to.include("module.exports = \""+"test\\\\resource\\\\js\\\\assets\\\\a.png"+"\"")
                next(null, file)
            }))
            .on("finish", function () {
                done()
            })
    })

    it.skip('processify:es7', function (done) {
        let b = browserify("./test/resource/js/module-processify-es7.js")

        b.source("app.js")
            .pipe(through.obj((file, env, next)=> {
                //console.log(file.contents.toString())
                //expect(file.contents.toString()).to.include("module.exports = \""+"test\\\\resource\\\\js\\\\assets\\\\a.png"+"\"")
                next(null, file)
            }))
            .on("finish", function () {
                done()
            })
    })
})

describe("watchify",function(){
    this.slow(180)
    it('base', function (done) {
        let targetfile = "./test/resource/js/module1-change.js"
        let b = watchify(browserify(targetfile))
        let updateDate = new Date();
        b.on("update",function(){
            this.source("app.js")
                .on("data",file=>expect(file.contents.toString()).to.include(updateDate))
                .on("finish", done)
        })
        b.source("app.js")
            .on("finish", function () {
                let contents = fs.readFileSync(targetfile).toString();
                contents = contents.replace(/(time:)\((.+)\)/gi, function (matched, title) {
                    return title + "(" + updateDate + ")"
                })
                fs.writeFileSync(targetfile, new Buffer(contents))
            })
    });

    it('base:redirect', function (done) {
        let targetfile = "./test/resource/js/module-redirect-module3-change.js"
        let b = watchify(browserify(targetfile,{
            resolve:{
                module3:"./test/resource/js/module3.js"
            }
        }))
        let updateDate = new Date();
        b.on("update",function(){
            this.source("app.js")
                .on("data",file=>expect(file.contents.toString()).to.include(updateDate))
                .on("finish", done)
        })
        b.source("app.js")
            .on("finish", function () {
                let contents = fs.readFileSync(targetfile).toString();
                contents = contents.replace(/(time:)\((.+)\)/gi, function (matched, title) {
                    return title + "(" + updateDate + ")"
                })
                fs.writeFileSync(targetfile, new Buffer(contents))
            })
    });

    it('processify:inline', function (done) {
        let targetfile = "./test/resource/js/module1-change.js"
        let b = watchify(browserify("./test/resource/js/module-processify-inline.js"));

        let updateDate = new Date();
        b.on("update",function(){
            this.source("app.js")
                .on("data",file=>expect(file.contents.toString()).to.include(updateDate))
                .on("finish", done)
        })

        b.transform("babelify", {
            presets: ["es2015"]
            , plugins: ["transform-decorators-legacy"]
        }).source("app.js")
            .pipe(through.obj((file, env, next)=> {
                console.log(file.contents.toString())
                expect(file.contents.toString()).to.include("version = \"0.0.1\"")
                next(null, file)
            }))
            .on("finish", function () {
                let contents = fs.readFileSync(targetfile).toString();
                contents = contents.replace(/(time:)\((.+)\)/gi, function (matched, title) {
                    return title + "(" + updateDate + ")"
                })
                fs.writeFileSync(targetfile, new Buffer(contents))
            })
    });
})
////////////////////////////////////////////////////////////////////////////////////
//                                                                                                      
//                [][][]  [][][]  []  []  [][][]  [][][][]
//                  []    []  []  [] []   []      []    []
//                  []    [][][]  [][]    [][]    [][][][]
//                  []    []      [] []   []      []  []
//                [][][]  []      []  []  [][][]  []    []
//
//    DESCRIPTION :     iPker is an alternative free for TexturePacker,
//                      it make packages png files for all yours sprites 
//                      to optimise your game, it also give you
//                      the json information to unpack the images in game.
//
//    DEPENDENCY :      Node.js, you cant use ipker without node.js
//
//    USAGE :           cmd line > node ipker.js [folderContainingImage]
//                      
//    PARAMETERS :      You can change some behavior of spriteSheet generation
//                      To edits parameters : put inside your images folder 
//                      a json file named "iPker_conf.json"
//                      
//                      "iPker_conf.json" example:
/*                      _______________________________________________________________________________________________
                               {
                                "outName" : "NameOfYourOutputsFiles",
                                "outPath" : "./outputPath",               ( relative from the cmd line location )
                                "sizeMax": { "w" : 2500, "h" : 2500},     ( the maximum pixel size for each spriteSheets generated )
                                "writeFolderName" : false                 ( sprite keys in json should contain the root folder name ? )
                                "margin" : 2                              (  margin between sprites in pixel)
                                "compress" : true,                        (compress or not the output spritesheet)
                                "compressLevel" : 30,                     ( level of compression min [0 - 100] max)
                                "assetFileMaker" :{                       ( iPker write an assetFile containing all sprite keys, usefull for devellopers )
                                        "outName" : "ASSETS.ts",
                                        "outPath" : "./",
                                        "language" : "ts",                 ( language id, you can add yours by editing assetFileMaker.js )
                                        "data" : {                         ( data object is send for specific language options )
                                            "module" : "GAME",             ( if undefined, the file generate class outside any modules )
                                            "className" :"ASSETS"          ( the class name )
                                         }
                                }
                        ____________________________________________________________________________________________________
*/
//                      all parameter fields are optional.
//
//    EXAMPLE           example_myImages is an example of folder containing all sprites and the iPker_fonf.jon
//
//    AUTHOR :          badfuret@gmail.com
//
///////////////////////////////////////////////////////////////////////////////////

fs = require('fs');
jimp = require('jimp');
Path = require('path');
assetFileMaker = require('./assetFileMaker.js');
var version = "0.0.1";

var outPutName = '';
var folderName = false;
var size = { w: 2000, h: 2000 };
var outPath = './';
var folderPath = '';
var folder_Name = '';
var assetFileConf = null;
var compress = false;
var compressLevel = 50;
var marge = 3;

var cError = (text) => {
    console.log("\x1b[31m[ERROR]" + text + '\x1b[0m');
}

var cObject = (obj, deploy) => {
    if (!obj)
        console.log(undefined);
    else {
        for (var key in obj)
            console.log(key);
        console.log(obj[key]);
    }
}

var getAllImages = (path, tab) => {
    if (tab === null)
        tab = [];
    let files = fs.readdirSync(path);
    for (var i = 0; i < files.length; i++) {
        let name = files[i];
        let pathFile = path + name;
        if (fs.statSync(pathFile).isDirectory())
            getAllImages(pathFile + '/', tab);
        else if (isImage(pathFile))
            tab.push(pathFile);
    }
    return tab;
}

var isImage = (path) => {
    let tab = path.split('.');
    let exten = tab[tab.length - 1];
    return (exten == 'png' || exten == 'jpg' || exten == 'bmp')
}

var makeSpriteSheet = (images) => {
    let imageTab = [];
    let totalImage = images.length;
    for (var i = 0; i < images.length; i++)
        processImage(imageTab, images[i], totalImage);
}

var processImage = (imageTab, path, totalImage) => {
    jimp.read(path, (err, image) => {
        if (err) throw err;
        imageTab.push(getImageObj(image, path));
        if (imageTab.length == totalImage)
            processSheet(imageTab, 0);
    });
}

var isOverloaping = (image, imagesPut) => {
    for (var i = 0; i < imagesPut.length; i++) {
        let cmpImage = imagesPut[i];
        setIntersector(image, cmpImage);
        if (
            (isInsideImage(rect_c.tl.x, rect_c.tl.y, image) && isInsideImage(rect_c.tl.x, rect_c.tl.y, cmpImage))
            || (isInsideImage(rect_c.br.x, rect_c.tl.y, image) && isInsideImage(rect_c.br.x, rect_c.tl.y, cmpImage))
            || (isInsideImage(rect_c.br.x, rect_c.br.y, image) && isInsideImage(rect_c.br.x, rect_c.br.y, cmpImage))
            || (isInsideImage(rect_c.tl.x, rect_c.br.y, image) && isInsideImage(rect_c.tl.x, rect_c.br.y, cmpImage))
        )
            return cmpImage;
    }
    return null;
}

var rect_c = { tl: { x: 0, y: 0 }, br: { x: 0, y: 0 } };

var setIntersector = (imageA, imageB) => {
    rect_c.tl.x = (imageA.x > imageB.x) ? imageA.x : imageB.x;
    rect_c.tl.y = (imageA.y > imageB.y) ? imageA.y : imageB.y;
    rect_c.br.x = (imageA.x < imageB.x) ? imageA.x + imageA.width : (imageB.x + imageB.width);
    rect_c.br.y = (imageA.y < imageB.y) ? imageA.y + imageA.height : (imageB.y + imageB.height);
    return rect_c;
}

var isInsideImage = (x, y, image) => {
    return ((x >= image.x && x < image.x + image.width) && (y >= image.y && y < image.y + image.height));
}

let spritePngOk = false;
let spriteJsonOk = false;

var processSheet = (imageTab, id) => {
    imageTab.sort((a, b) => {
        return -(a.width * a.height - b.width * b.height);
    });
    let imageDone = [];
    let next = false;
    var i = 0;
    let wMax = 0;
    let hMax = 0;
    while (i < imageTab.length) {
        let image = imageTab[i++];
        if (image.done)
            continue;
        image.x = 0;
        image.y = 0;
        let processing = true;
        let moveY = false;
        while (processing) {
            let overImage = isOverloaping(image, imageDone);
            let sWMax = image.x + image.width;
            let sHMax = image.y + image.height;
            if (overImage === null) {
                imageDone.push(image);
                wMax = Math.max(image.x + image.width, wMax);
                hMax = Math.max(image.y + image.height, hMax);
                processing = false;
                image.done = true;
            } else {
                if (moveY) {
                    image.y = Math.min(overImage.y + overImage.height, image.y + image.height) + 1;
                    sHMax = image.y + image.height;
                    moveY = false;
                } else {
                    image.x = Math.min(overImage.x + overImage.width, image.x + image.width) + 1;
                    sWMax = image.x + image.width;
                }
                if (sWMax > wMax) {
                    image.x = 0;
                    moveY = true;
                }
                if (sHMax > hMax) {
                    let newSW = wMax + 1 + image.width;
                    let newSH = hMax + 1 + image.height;
                    if (newSW <= newSH && newSW < size.w) {
                        image.x = wMax + 1;
                        image.y = 0;
                    } else if (newSH < size.h) {
                        image.x = 0;
                        image.y = hMax + 1;
                    } else {
                        next = true;
                        break;
                    }
                    image.done = true;
                    imageDone.push(image);
                    wMax = Math.max(image.x + image.width, wMax);
                    hMax = Math.max(image.y + image.height, hMax);
                    moveY = false;
                    processing = false;
                }
            }
        }
    }
    spritePngOk = false;
    spriteJsonOk = false;
    let resolve = () => {
        if (spriteJsonOk && spritePngOk) {
            if (next)
                processSheet(imageTab, id + 1);
            else
                console.log('\n\x1b[32mComplete !\x1b[0m');
        }
    }
    console.log('\nGenerate files : ' + outPath + outPutName + '-' + id + '  ' + wMax + '*' + hMax);

    let imageName = outPutName + '-' + id + '.png';
    let sheetPng = new jimp(wMax, hMax, 0x00000000, (err, sheet) => {
        if (err) {
            cError('writing SpriteSheet impossible');
            throw err;
        }

        for (var i = 0; i < imageDone.length; i++) {
            let image = imageDone[i];
            sheet.composite(image.image, image.x, image.y);
        }

        sheet.write(outPath + imageName, () => {

            if (compress) {
                let oldSize = fs.statSync(outPath + imageName).size;
                process.stdout.write('compress ' + compressLevel + '% : \x1b[33m' + getSizeText(oldSize) + '\x1b[0m -> ');
            }
            compressImg(sheet, compress != true);

            sheet.write(outPath + imageName, () => {
                if (compress) {
                    let size = fs.statSync(outPath + imageName).size;
                    process.stdout.write('\x1b[32m' + getSizeText(size) + '\x1b[0m\n');
                }

                spritePngOk = true;
                resolve();
            });
        });


    });

    let jsonObj = {
        frames: {},
        meta: {
            app: "iPker",
            version: version,
            image: imageName,
            format: "RGBA8888",
            size: { w: wMax, h: hMax },
            scale: "1",
        }
    }

    for (var i = 0; i < imageDone.length; i++) {
        let image = imageDone[i];
        let imageObj = {
            frame: { x: image.x, y: image.y, w: image.width - marge, h: image.height - marge },
            rotated: false,
            trimmed: (image.trimX || image.trimY) ? true : false,
            spriteSourceSize: { x: image.trimX, y: image.trimY, w: image.width - marge, h: image.height - marge },
            sourceSize: { w: image.originalWidth, h: image.originalHeight },
            pivot: { x: 0.5, y: 0.5 }
        }
        jsonObj.frames[getKey(image.path)] = imageObj;
    }

    fs.writeFile(outPath + outPutName + '-' + id + '.json', JSON.stringify(jsonObj, null, 4), 'utf8', (err) => {
        if (err) {
            cError('Writing json impossible');
            throw err;
        }
        spriteJsonOk = true;
        resolve();
    });
}

var getSizeText = (size) => {
    if (size > 1000000)
        return Math.floor((size / 1000000) * 100) / 100 + ' Mo';
    else
        return Math.floor(size / 1000) + ' Ko';
}


var compressImg = (image, avoidCompressing) => {
    let alpha;
    var signed = false;
    let cl = Math.max(1, 25 * Math.min(100, (compressLevel / 100)));
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        alpha = image.bitmap.data[idx + 3];
        if (alpha == 0) {
            image.bitmap.data[idx + 0] = 0;
            image.bitmap.data[idx + 1] = 0;
            image.bitmap.data[idx + 2] = 0;
            image.bitmap.data[idx + 3] = 0;
        } else if (!avoidCompressing) {
            image.bitmap.data[idx + 0] = Math.floor(image.bitmap.data[idx + 0] / cl) * cl;
            image.bitmap.data[idx + 1] = Math.floor(image.bitmap.data[idx + 1] / cl) * cl;
            image.bitmap.data[idx + 2] = Math.floor(image.bitmap.data[idx + 2] / cl) * cl;
            image.bitmap.data[idx + 3] = Math.floor(image.bitmap.data[idx + 3] / cl) * cl;
        }
    });
}

var getKey = (filePath) => {
    let key = filePath.substr(folderPath.length, filePath.length - folderPath.length);
    if (folderName)
        key = folder_Name + '/' + key;
    return key;
}

var getImageObj = (image, path) => {
    let obj = {
        path: path,
        image: null,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        trimX: 0,
        trimY: 0,
        originalWidth: image.bitmap.width,
        originalHeight: image.bitmap.height,
        done: false
    }

    rect_c.tl.x = image.bitmap.width;
    rect_c.tl.y = image.bitmap.height;
    rect_c.br.x = 1;
    rect_c.br.y = 1;
    let foundPixel = false;
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        var alpha = image.bitmap.data[idx + 3];
        if (alpha !== 0) {
            foundPixel = true;
            rect_c.tl.x = Math.min(x, rect_c.tl.x);
            rect_c.tl.y = Math.min(y, rect_c.tl.y);
            rect_c.br.x = Math.max(x + 1, rect_c.br.x);
            rect_c.br.y = Math.max(y + 1, rect_c.br.y);
        }
    });

    if (foundPixel != true) {
        rect_c.tl.x = 0;
        rect_c.tl.y = 0;
        rect_c.br.x = 1;
        rect_c.br.y = 1;
    }

    obj.width = rect_c.br.x - rect_c.tl.x + marge;
    obj.height = rect_c.br.y - rect_c.tl.y + marge;

    let trimed = new jimp(obj.width, obj.height, 0x00000000);
    // trimed.scan(rect_c.tl.x, rect_c.tl.y, obj.width, obj.height, (x, y, idx) => {
    //     let idI = image.getPixelIndex(rect_c.tl.x + x, rect_c.tl.y + y);
    //     trimed.bitmap.data[idx] = image.bitmap.data[idI];
    //     trimed.bitmap.data[idx + 1] = image.bitmap.data[idI + 1];
    //     trimed.bitmap.data[idx + 2] = image.bitmap.data[idI + 2];
    //     trimed.bitmap.data[idx + 3] = image.bitmap.data[idI + 3];
    // });
    trimed.composite(image, -rect_c.tl.x, -rect_c.tl.y);

    obj.image = trimed;
    obj.trimX = rect_c.tl.x;
    obj.trimY = rect_c.tl.y;

    return obj;
}

var setupConf = (path) => {
    let confFile = path + '/iPker_conf.json';
    folderName = false;
    outPutName = 'sprite_sheet';
    outPath = './';
    size.w = 2500;
    size.h = 2500;
    makeAsstesConf = null;
    compress = false;
    compressLevel = 50;
    marge = 0;

    if (fs.existsSync(confFile)) {
        console.log('[SETUP] use configuration file');
        let data = fs.readFileSync(confFile);
        try {
            var obj = JSON.parse(data);
        } catch (error) {
            cError('bad formated json');
            process.exit(0);
        }

        if (!obj) {
            cError('bad formated json');
            return;
        }
        if (obj.outName)
            outPutName = obj.outName;
        if (obj.outPath) {
            outPath = obj.outPath;
            if (outPath.charAt(outPath.length - 1) != '/')
                outPath += '/';
        }
        if (obj.sizeMax) {
            if (obj.sizeMax.w)
                size.w = obj.sizeMax.w;
            if (obj.sizeMax.h)
                size.h = obj.sizeMax.h;
        }
        if (obj.margin)
            marge = obj.margin;
        compress = true;
        if (obj.compress)
            compress = true;
        if (obj.compressLevel)
            compressLevel = obj.compressLevel;
        if (obj.assetFileMaker)
            assetFileConf = obj.assetFileMaker;
        folderName = obj.writeFolderName ? true : false;
    }
}

var makeAssetFile = (images, conf) => {
    process.stdout.write('\nWriting AssetFile :');
    if (!conf.language) {
        cError('language parameter not defined');
        return;
    }

    for (var i = 0; i < images.length; i++)
        images[i] = getKey(images[i]);

    let fileContent = assetFileMaker.getFileContent(images, conf.language, conf.data);

    let name = conf.outName ? conf.outName : 'ASSETS.ts';
    let path = conf.outPath ? conf.outPath : outPath;
    if (path.charAt(path.length - 1) != '/')
        path += '/';
    process.stdout.write(path + name + '\n');
    fs.writeFile(path + name, fileContent, 'utf8', (err) => {
        if (err) {
            cError('Writing assetFile impossible');
            throw err;
        }
    });

}

var main = () => {
    let files = process.argv;
    if (files.length !== 3) {
        console.log('usage : node iPacker.js [ImagesFolderPath]');
        return;
    }
    let path = files[2];
    if (path.charAt(path.length - 1) != '/')
        path += '/';
    folderPath = path;
    folder_Name = Path.basename(path);

    process.stdout.write('\n\x1b[32miPker v' + version + '\x1b[0m\n');

    if (fs.existsSync(path)) {
        if (fs.statSync(path).isDirectory()) {
            setupConf(path);
            let images = getAllImages(path, null);
            console.log('found sprites : ' + images.length);
            makeSpriteSheet(images);
            if (assetFileConf)
                makeAssetFile(images, assetFileConf);


        } else
            cError('PATH MUST BE A DIRECTORY');
    }
    else cError('PATH INVALID');
}

main();
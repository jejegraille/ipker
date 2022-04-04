var getFileContent = (images, language, data) => {
    if (language == 'ts')
        return tsAssetFileMaker(images, data);

    /// ADD YOUR LANGUAGE HERE
    // if (type == 'YouIdForLanguage')
    //     return yourFunction(images);


    return (
        'ERROR language not supported.\n' +
        '° check the parameter "assetFileLanguage" in iPker_conf.json\n' +
        '° You can add your language by editing the file assetFileMaker.js\n'
    );
}

let availableChar = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789';
let charNumbers = '0123456789';

var strChr = (str, char) => {
    let i = 0;
    while (i < str.length) {
        if (str.charAt(i) == char)
            return true;
        i++;
    }
    return false;
}

var getKey = (imagePath) => {
    let i = 0;
    let key = '';
    while (i < imagePath.length - 4) {
        let char = (imagePath[i]).toUpperCase();
        if (i == 0 && strChr(charNumbers, char))
            char = '_' + char;
        else if (strChr(availableChar, char) != true)
            char = '_';
        key += char;
        i++;
    }
    return key;
}

var getGoodPath = (imagePath) => {
    let goodPath = '';
    let i = 0;
    while (i < imagePath.length) {
        let char = imagePath[i++];
        if (char == '\\')
            char = '/';
        goodPath += char;
    }
    return goodPath;
}

var tsAssetFileMaker = (images, data) => {
    var fileContent = '';

    let mod = (data && data.module) ? data.module : null;
    let className = (data && data.className) ? data.className : 'ASSETS';
    //ADD HEADER
    fileContent += '/* GENERATED FROM IPKER */\n';
    if (mod) {
        fileContent += 'module ' + mod + ' {\n';
        fileContent += '\t\texport  ';
    }
    fileContent += 'class ' + className + ' {\n\n';

    // ADD KEYS VARIABLE
    for (var i = 0; i < images.length; i++) {
        let imagePath = images[i];
        let key = getKey(imagePath);

        if (data.module)
            fileContent += '\t\t';

        fileContent += "\t\tstatic " + key + ' : string = "' + getGoodPath(imagePath) + '";\n'
    }

    //ADD FOOTER
    if (mod)
        fileContent += '\t\t';
    fileContent += '}';
    if (mod)
        fileContent += '\n}';

    return fileContent;
}

/*   WRITE THE ASSET FILE MAKER FUNCTION FOR YOUR LANGUAGE ACCORDING TO THIS EXAMPLE

    var myLanguageFunction = (images)=>{

        var fileContent = '';

        //ADD HEADER
        fileContent += '';

        // ADD KEYS VARIABLE
        for (var i = 0; i < images.length; i++){
            let imagePath = images[i];
            let key = yourKey;

            fileContent += "\n" + "var " + key + '="' + imagePath + '";'
        }

        //ADD FOOTER
        fileContent += '';

        return fileContent;
    }

*/

exports.getFileContent = getFileContent;
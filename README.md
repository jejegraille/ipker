# iPker

Alternative to TexturePacker (https://www.codeandweb.com/texturepacker)

iPker node module make packages png files from yours multiple sprites to optimise your game, it also give you the json information to unpack the images in game.

# Get started :
```
npm install ipker

node node_modules/ipker/ipker.js ./path/assets/images
```

# Personalisation
To change some parameters you can add a configuration file named "iPker_conf.json"

### Example
```
{
    "outName" : "game",
    "writeFolderName" : false,
    "outPath" : "./game/assets/images",
    "assetFileMaker" :{
        "outName" : "ASSETS.ts",
        "outPath" : "./game/src/generated",
        "language" : "ts",
        "data" : {
            "module" : "GAME",
            "className" :"ASSETS"
         }
}
```
All fields are facultative
#### outName
change the default generated files name "sprite_sheet"
#### writeFolderName
change the images keys names by adding or not the repository name
#### outPath
change the output path for generated files
#### assetFileMaker
If you use typescript, ou can generate an extra file containing keys definitions as static constant
```
/* GENERATED FROM IPKER */
module GAME {
		export  class ASSETS {

				static BAR_EMPTY : string = "bar/empty.png";
				static BAR_FULL : string = "bar/full.png";
				static BAR_LIFE_ICONE : string = "bar/life_icone.png";
        }
}
```

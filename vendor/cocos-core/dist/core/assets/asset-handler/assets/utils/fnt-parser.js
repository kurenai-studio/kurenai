"use strict";
// 类型定义
Object.defineProperty(exports, "__esModule", { value: true });
class FntLoader {
    INFO_EXP = /info .*?(?=\/>)|info .*/gi;
    COMMON_EXP = /common .*?(?=\/>)|common .*/gi;
    PAGE_EXP = /page .*?(?=\/>)|page .*/gi;
    CHAR_EXP = /char .*?(?=\/>)|char .*/gi;
    KERNING_EXP = /kerning .*?(?=\/>)|kerning .*/gi;
    ITEM_EXP = /\w+=[^ \r\n]+/gi;
    NUM_EXP = /^-?\d+(?:\.\d+)?$/;
    _parseStrToObj(str) {
        const arr = str.match(this.ITEM_EXP);
        const obj = {};
        if (arr) {
            for (let i = 0, li = arr.length; i < li; i++) {
                const tempStr = arr[i];
                const index = tempStr.indexOf('=');
                const key = tempStr.substring(0, index);
                let value = tempStr.substring(index + 1);
                if (value[0] === '"') {
                    value = value.substring(1, value.length - 1);
                    if (value.match(this.NUM_EXP)) {
                        value = parseFloat(value);
                    }
                }
                else if (value.match(this.NUM_EXP)) {
                    value = parseFloat(value);
                }
                obj[key] = value;
            }
        }
        return obj;
    }
    /**
     * Parse Fnt string.
     * @param fntStr - FNT file content string
     * @returns Parsed font data
     */
    parseFnt(fntStr) {
        const fnt = {};
        // padding
        const infoResult = fntStr.match(this.INFO_EXP);
        if (!infoResult) {
            return fnt;
        }
        const infoObj = this._parseStrToObj(infoResult[0]);
        // var paddingArr = infoObj["padding"].split(",");
        // var padding = {
        //     left: parseInt(paddingArr[0]),
        //     top: parseInt(paddingArr[1]),
        //     right: parseInt(paddingArr[2]),
        //     bottom: parseInt(paddingArr[3])
        // };
        // common
        const commonMatch = fntStr.match(this.COMMON_EXP);
        if (!commonMatch) {
            return fnt;
        }
        const commonObj = this._parseStrToObj(commonMatch[0]);
        fnt.commonHeight = commonObj['lineHeight'];
        fnt.fontSize = parseInt(infoObj['size']);
        if (cc.game.renderType === cc.game.RENDER_TYPE_WEBGL) {
            const texSize = cc.configuration.getMaxTextureSize();
            if (commonObj['scaleW'] > texSize.width || commonObj['scaleH'] > texSize.height) {
                console.log('cc.LabelBMFont._parseCommonArguments(): page can\'t be larger than supported');
            }
        }
        if (commonObj['pages'] !== 1) {
            console.log('cc.LabelBMFont._parseCommonArguments(): only supports 1 page');
        }
        // page
        const pageMatch = fntStr.match(this.PAGE_EXP);
        if (!pageMatch) {
            return fnt;
        }
        const pageObj = this._parseStrToObj(pageMatch[0]);
        if (pageObj['id'] !== 0) {
            console.log('cc.LabelBMFont._parseImageFileName() : file could not be found');
        }
        fnt.atlasName = pageObj['file'];
        // char
        const charLines = fntStr.match(this.CHAR_EXP);
        if (!charLines) {
            return fnt;
        }
        const fontDefDictionary = {};
        fnt.fontDefDictionary = fontDefDictionary;
        for (let i = 0, li = charLines.length; i < li; i++) {
            const charObj = this._parseStrToObj(charLines[i]);
            const charId = charObj['id'];
            fontDefDictionary[charId] = {
                rect: {
                    x: charObj['x'],
                    y: charObj['y'],
                    width: charObj['width'],
                    height: charObj['height']
                },
                xOffset: charObj['xoffset'],
                yOffset: charObj['yoffset'],
                xAdvance: charObj['xadvance'],
            };
        }
        // kerning
        const kerningDict = {};
        fnt.kerningDict = kerningDict;
        const kerningLines = fntStr.match(this.KERNING_EXP);
        if (kerningLines) {
            for (let i = 0, li = kerningLines.length; i < li; i++) {
                const kerningObj = this._parseStrToObj(kerningLines[i]);
                kerningDict[kerningObj['first'] << 16 | kerningObj['second'] & 0xffff] = kerningObj['amount'];
            }
        }
        return fnt;
    }
}
exports.default = new FntLoader();

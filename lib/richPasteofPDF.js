/**
 * 工作端 - Atom - 富粘帖pdf操作模块
 * @author Tevin
 */

 const {File} = require('atom');
 const fs = require('fs');
 const clipboard = require('clipboard');
 const crypto = require('crypto');
 const mngFolder = require('../build/manageFolder');
 
 const richPasteofPDF = (function () {
     return {
         /**
          * 编辑器实例
          * @private
          */
         _editPath: null,
         /**
          * 富粘贴
          * @param {Object} editor - 当前文档编辑器的引用
          * @param {String} editPath - 当前文档的路径
          * @public
          */
         paste: function (editor, editPath) {
             this._editPath = editPath;
             //pdf粘贴检查
            this._pastePdf('clip', '', function (state, text, title) {
                if (state) {
                    text = 'PDF: ['+title+'](' + text + ')' + '  \n';
                    editor.insertText(text, editor);
                }
            }, editor);
         },
         /**
          * 根据shift复制为路径的路径粘贴pdf
          * @param {String} type - 粘贴的类型: clip
          * @param {String} filePath - 需要读取的pdf路径
          * @param {Function} callback - 粘贴处理后的回调（是否成功的状态，PDF src路径，PDF title）
          * @param {Object} editor - 当前编辑器的引用
          * @private
          */
         _pastePdf: function (type, filePath, callback, editor) {
            let selectText = editor.getSelectedText();
            if (/^[a-z0-9\u4e00-\u9fa5\s\-_!,.?:;（）！，。？“”：；]+$/.test(selectText)) {
                selectText = ' "' + selectText.replace(/^\s+|\s+$/g, '') + '"';
            } else {
                selectText = '';
            } 
            //读取路径
             let pdfpath = null;
             let ext = 'pdf';
             if (type === 'clip') {
                //  const img = clipboard.readImage();
                 const pdfpathread = clipboard.readText();
                 if (pdfpathread=="" || pdfpathread.substr(pdfpathread.length-4,3)!="pdf") {
                     callback && callback(false);
                    //  callback && callback(true, pdfpathread.substr(pdfpathread.length-4,3), pdfpathread);
                     return;
                 }
                 pdfpath = pdfpathread.replace("\"","").replace("\"","");
                //  pdfbuffer = fs.createReadStream(text);
             }
             //计算路径
             const [assetsDirPath, createDirPath, insertText] = this.getPastePaths();
             if (!assetsDirPath) {
                 callback && callback(false);
                 return;
             }
             //计算文件名
             let filename = '';
             //按天区分文件
             const date = new Date();
             let month = date.getMonth() + 1;
             let day = date.getDate();
             month = (month <= 9 ? '0' : '') + month;
             day = (day <= 9 ? '0' : '') + day;
             //加入 md5 创建文件名，重复多次粘贴时只创建一个图片文件
             const md5 = crypto.createHash('md5');
             md5.update(pdfpath);
             filename += date.getFullYear() + month + day + '-' + md5.digest('hex').slice(0, 8) + '.' + ext;
             //输出文件
             mngFolder.createFolder(createDirPath);
             fs.copyFile(pdfpath,createDirPath + filename,function(err){
                if(err) {
                    callback && callback(false);
                }
                else {callback && callback(true, insertText + filename, filename);}
            }
             );
         },
         /**
          * 计算操作路径
          * @param {String} [editPath] - 当前文档的路径
          * @returns {Object} 粘贴图片需要的路径列表
          * @public
          */
         getPastePaths: function (editPath = this._editPath) {
             const path = mngFolder.getProjectFolder(editPath);
             if (!path) {
                 return [];
             }
             let assetsDirPath = path + 'assets/pdf/';  //项目assets文件夹地址;
             let createDirPath = '',  //本次创建图片地址
                 insertText = '';     //插入文档的图片引用路径
             // library 目录
             if (mngFolder.getBaseName(mngFolder.getParentFolder(editPath)) === 'library') {
                 createDirPath = assetsDirPath;
                 insertText = 'assets/'
             }
             // library 深子级
             else {
                 let lv1Name = editPath.substr((path + 'library/').length);
                 let lv1Id = lv1Name.split(/[-_]/)[0];
                 createDirPath = assetsDirPath + lv1Id + '/';
                 insertText = 'assets/pdf/' + lv1Id + '/';
             }
             return [assetsDirPath, createDirPath, insertText];
         }
     };
 })();
 
 module.exports = richPasteofPDF;

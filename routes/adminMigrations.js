var express = require('express');

module.exports = function (app) {
    'use strict';
    var router = express();

    router.get('/', app.userController.Pass, function(req, res) {
        updateNews();
        updatePages();
        res.status(200).send({message: 'ok'})
        
    });

    app.use('/admin/migrate', router);

    function updateNews() {
        app.newsController.Collection
                .find()
                .exec(function (err, docs) {
                    var doc;
                    for(var i = 0; i < docs.length; i++) {
                        var doc = docs[i];
                        if (doc.image) {
                            if (doc.image[0] === ',') {
                                doc.image = doc.image.slice(1,doc.image.length)
                            }
                            if (JSON.parse(doc.image).data) {
                                doc.imagenew = JSON.parse(doc.image).data[0].data
                                console.log('news$$$', JSON.parse(doc.image).data[0].data)
                            } else {
                                console.log('err', JSON.parse(doc.image))
                            }
                            
                        }

                        doc.bodynew.ru.blocks = recreateBlocks(doc.body.ru.data, doc);
                        doc.teasernew.ru.blocks = recreateBlocks(doc.teaser.ru.data, doc);
                        doc.bodynew.by.blocks = recreateBlocks(doc.body.by.data, doc);
                        doc.teasernew.by.blocks = recreateBlocks(doc.teaser.by.data, doc);
                        doc.bodynew.en.blocks = recreateBlocks(doc.body.en.data, doc);
                        doc.teasernew.en.blocks = recreateBlocks(doc.teaser.en.data, doc);
                        doc.save();
                    }
                })
        app.congratulationsController.Collection
                .find()
                .exec(function (err, docs) {
                    var doc;
                    for(var i = 0; i < docs.length; i++) {
                        var doc = docs[i];
                        if (doc.image) {
                            if (doc.image[0] === ',') {
                                doc.image = doc.image.slice(1,doc.image.length)
                            }
                            if (JSON.parse(doc.image).data) {
                                doc.imagenew = JSON.parse(doc.image).data[0].data
                                console.log('news$$$', JSON.parse(doc.image).data[0].data)
                            } else {
                                console.log('err', JSON.parse(doc.image))
                            }
                            
                        }

                        doc.bodynew.ru.blocks = recreateBlocks(doc.body.ru.data, doc);
                        doc.teasernew.ru.blocks = recreateBlocks(doc.teaser.ru.data, doc);
                        doc.bodynew.by.blocks = recreateBlocks(doc.body.by.data, doc);
                        doc.teasernew.by.blocks = recreateBlocks(doc.teaser.by.data, doc);
                        doc.bodynew.en.blocks = recreateBlocks(doc.body.en.data, doc);
                        doc.teasernew.en.blocks = recreateBlocks(doc.teaser.en.data, doc);
                        doc.save();
                    }
                })  
        app.mediaController.Collection
                .find()
                .exec(function (err, docs) {
                    var doc;
                    for(var i = 0; i < docs.length; i++) {
                        var doc = docs[i];
                        if (doc.image) {
                            if (doc.image[0] === ',') {
                                doc.image = doc.image.slice(1,doc.image.length)
                            }
                            if (JSON.parse(doc.image).data) {
                                doc.imagenew = JSON.parse(doc.image).data[0].data
                                console.log('news$$$', JSON.parse(doc.image).data[0].data)
                            } else {
                                console.log('err', JSON.parse(doc.image))
                            }
                            
                        }
                        doc.save();
                    }
                })                
    }
    
    function updatePages() {
        app.pageController.Collection
                .find()
                .exec(function (err, docs) {
                    var doc;
                    for(var i = 0; i < docs.length; i++) {
                        doc = docs[i];
                        doc.bodynew.ru.blocks = recreateBlocks(doc.body.ru.data, doc);
                        doc.bodynew.by.blocks = recreateBlocks(doc.body.by.data, doc);
                        doc.bodynew.en.blocks = recreateBlocks(doc.body.en.data, doc);
                        doc.save();
                    }
                })
    }
};



function recreateBlocks (datas, doc){
    var blocks = [];
    var block;
    var text;

    for(var i = 0; i < datas.length; i++) {
        block = datas[i];
        console.log(block.commented)
        if (block.type === "text") {
            text = block.data.text.split('\n').join('<br>');
            blocks.push({
                type: 'paragraph',
                data: {
                    text: parse(text),
                    commented: block.commented
                }
                
            });
        }
        if (block.type === "heading") {
            text = block.data.text;
            blocks.push({
                type: 'header',
                data: {
                    text: parse(text),
                    level: 2,
                    commented: block.commented
                }
                
            });
        }
        if (block.type === "heading3") {
            text = block.data.text;
            blocks.push({
                type: 'header',
                data: {
                    text: parse(text),
                    level: 3,
                    commented: block.commented
                }
                
            });
        }
        if (block.type === "heading4") {
            text = block.data.text;
            blocks.push({
                type: 'header',
                data: {
                    text: parse(text),
                    level: 4,
                    commented: block.commented
                }
                
            });
        }
        if (block.type === "video") {
            blocks.push({
                type: 'embed',
                data : {
                    "service" : "youtube",
                    "source" : "https://youtu.be/" + block.data.remote_id,
                    "embed" : "https://www.youtube.com/embed/" +  block.data.remote_id,
                    "width" : 620,
                    "height" : 400,
                    "caption" : "",
                    commented: block.commented
                }
                
            });
        }
        if (block.type === "list") {
            text = parse( block.data.text.replace(/^ - (.+)$/mg,"$1</li>").replace(/\n/mg, "")).split("</li>")
            text.pop();
            blocks.push({
                type : "list",
                data : {
                    "style" : "unordered",
                    "items" : text,
                    commented: block.commented
                } 
            });
        }
        if (block.type === "pagebreak") {
            blocks.push({
                type : "delimiter",
                data : {
                    commented: block.commented
                } 
            });
        }
        if (block.type === "shopbutton") {
            
            blocks.push({
                type : "shopbutton",
                data : {
                    url: parse(block.data.text),
                    commented: block.commented
                } 
            });
        }
        if (block.type === "image") {
            block.data.commented = block.commented
            blocks.push({
                type : "image",
                data : block.data
            });
        }
        if (block.type === "table") {
            var rows = block.data.text.split('\n');
            rows.splice(1,1);
            for (var j = 0; j < rows.length; j++) {
                rows[j] = rows[j].split('|');
                for (var k = 0; k < rows[j].length; k++) {
                    rows[j][k] = (parse(rows[j][k]))
                }
            }
            blocks.push({
                type : "table",
                data : {
                    content: rows,
                    commented: block.commented
                }
            });
        }
       
    }

    return blocks;
}


 function parse (text) {
	 var html = text
	 
	 html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/gm,function(match, p1, p2){
	      return "<a href='"+p2+"'>"+p1.replace(/\n/g, '')+"</a>"
	  })

	 html = reverse(html)
	 html = html.replace(/_(?!\\)((_\\|[^_])*)_(?=$|[^\\])/gm, function(match, p1) {
	        return ">i/<"+ p1.replace(/\n/g, '').replace(/[\s]+$/,'') +">i<"
	  })
	 html = html.replace(/\*\*(?!\\)((\*\*\\|[^\*\*])*)\*\*(?=$|[^\\])/gm, function(match, p1){
	        return ">b/<"+ p1.replace(/\n/g, '').replace(/[\s]+$/,'') +">b<"
	  })
	 html = reverse(html)

	 html = html.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;").replace(/\n/g, "<br>").replace(/\*\*/, "").replace(/__/, "")
	 html = html.replace(/\\\*/g, "*").replace(/\\\[/g, "[").replace(/\\\]/g, "]").replace(/\\\_/g, "_").replace(/\\\(/g, "(").replace(/\\\)/g, ")").replace(/\\\-/g, "-")

	 html =  html.replace(/^\> (.+)$/mg,"$1").replace(/\"/g, '&smallQuot;');

	 return html
}


function reverse(s){
    return s.split("").reverse().join("")
}
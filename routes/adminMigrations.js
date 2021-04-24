var express = require('express');

module.exports = function (app) {
    'use strict';
    var router = express();

    //console.log('####################', messages)  
    router.get('/', app.userController.Pass, function(req, res) {
        //updateNews();
        //updatePages();
        updateProfiles();
        //setMessages(messages);
        res.status(200).send({message: 'ok'})
        
    });

    app.use('/admin/migrate', router);

    function updateProfiles() {
      var subject;
      var names = [];
      var subjectsToSave = [];
      app.subjectController.Collection.find()
        .exec(function(err, subjects) {
          app.profileController.Collection.find()
            .exec(function(err, profiles) {
              for(var i =0; i< profiles.length; i++) {
                subject = findSubjectByName(subjects, profiles[i].firstExamName)
                
                if (names.indexOf(profiles[i].firstExamName) === -1) {
                  names.push(profiles[i].firstExamName)
                  subject.date = profiles[i].firstExamDate
                  subject.startTime = profiles[i].firstExamStartTime
                  subject.appelationDate = profiles[i].firstExamAppelationDate
                  subject.place = profiles[i].examPlace
                  subject.uploaded = false
                  subject.noStats = false
                  subject.examKey = profiles[i].examKey1;
                  subjectsToSave.push(subject);
                }
                
                
                

                profiles[i].exam1 = subject._id
                

                subject = findSubjectByName(subjects, profiles[i].secondExamName)
                
                if (names.indexOf(profiles[i].secondExamName) === -1) {
                  names.push(profiles[i].secondExamName)
                  subject.date = profiles[i].secondExamDate
                  subject.startTime = profiles[i].secondExamStartTime
                  subject.appelationDate = profiles[i].secondExamAppelationDate
                  subject.place = profiles[i].examPlace
                  subject.uploaded = false
                  subject.noStats = false
                  subject.examKey = profiles[i].examKey2;
                  subjectsToSave.push(subject);
                }

                

                profiles[i].exam2 = subject._id

                profiles[i].save(function(err, doc) {
                  console.log('pr save err', err)
                })
              }
              console.log('names', names)
              for(var i =0; i< subjectsToSave.length; i++) { 
                var s = subjectsToSave[i];
                  s.save(function(err, doc) {
                    console.log('subjectsToSave save', err, doc, s)
                  })

              }
            })
        })
      
    }

    function findSubjectByName(subjects, name) {
      var subject;
      for(var i = 0; i < subjects.length; i++) {
        if (subjects[i].name === name) {
          subject = subjects[i]
        }
      }
      return subject
    }

    function setMessages(messages) {
        for (var i =0; i < messages.length; i++) {
            saveMessage(messages[i])
        }
    }

    function saveMessage(message) {
        var doc = new app.pupilMessageController.Collection(message);
        doc.save(function() {
            console.log('doc saved', arguments)
        })
    }

    function updateNews() {
        app.newsController.Collection
                .find()
                .exec(function (err, docs) {
                    var doc;
                    for(var i = 0; i < docs.length; i++) {
                        var doc = docs[i];
                        /*
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
                            
                        }*/

                        doc.bodynew.ru.blocks = recreateBlocks(doc.bodynew.ru.blocks, doc);
                        doc.teasernew.ru.blocks = recreateBlocks(doc.teasernew.ru.blocks, doc);
                        doc.bodynew.by.blocks = recreateBlocks(doc.bodynew.by.blocks, doc);
                        doc.teasernew.by.blocks = recreateBlocks(doc.teasernew.by.blocks, doc);
                        doc.bodynew.en.blocks = recreateBlocks(doc.bodynew.en.blocks, doc);
                        doc.teasernew.en.blocks = recreateBlocks(doc.teasernew.en.blocks, doc);
                        doc.markModified('bodynew') 
                        doc.markModified('teasernew') 
                        doc.save();
                    }
                })
        app.congratulationsController.Collection
                .find()
                .exec(function (err, docs) {
                    var doc;
                    for(var i = 0; i < docs.length; i++) {
                        var doc = docs[i];
                       /* if (doc.image) {
                            if (doc.image[0] === ',') {
                                doc.image = doc.image.slice(1,doc.image.length)
                            }
                            if (JSON.parse(doc.image).data) {
                                doc.imagenew = JSON.parse(doc.image).data[0].data
                                console.log('news$$$', JSON.parse(doc.image).data[0].data)
                            } else {
                                console.log('err', JSON.parse(doc.image))
                            }
                            
                        }*/

                        doc.bodynew.ru.blocks = recreateBlocks(doc.teasernew.ru.blocks, doc);
                        doc.teasernew.ru.blocks = recreateBlocks(doc.teasernew.ru.blocks, doc);
                        doc.bodynew.by.blocks = recreateBlocks(doc.bodynew.by.blocks, doc);
                        doc.teasernew.by.blocks = recreateBlocks(doc.teasernew.by.blocks, doc);
                        doc.bodynew.en.blocks = recreateBlocks(doc.bodynew.en.blocks, doc);
                        doc.teasernew.en.blocks = recreateBlocks(doc.teasernew.en.blocks, doc);
                        doc.markModified('bodynew') 
                        doc.markModified('teasernew') 
                        doc.save();
                    }
                })  
        /*app.mediaController.Collection
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
                }) */               
    }
    
    function updatePages() {
        app.pageController.Collection
                .find()
                .exec(function (err, docs) {
                    var doc;
                    for(var i = 0; i < docs.length; i++) {
                        doc = docs[i]; 
                        doc.bodynew.ru.blocks = recreateBlocks(doc.bodynew.ru.blocks, doc);
                        doc.bodynew.by.blocks = recreateBlocks(doc.bodynew.by.blocks, doc);
                        doc.bodynew.en.blocks = recreateBlocks(doc.bodynew.en.blocks, doc);
                        
                        doc.markModified('bodynew') 
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
        if (block.type === "paragraph") {
            block.data.text = block.data.text.split('&smallQuot;').join('"');
            blocks.push(block);
        }
        
        if (block.type === "header") {
            blocks.push(block);
        }
        if (block.type === "video") {
            blocks.push(block);
        }
        if (block.type === "list") {
            for(var j = 0; j < block.data.items.length; j++) {
                block.data.items[j] = block.data.items[j].split('&smallQuot;').join('"');
            }
            blocks.push(block);
        }
        if (block.type === "pagebreak") {
            blocks.push(block);
        }
        if (block.type === "shopbutton") {
            blocks.push(block);
        }
        if (block.type === "image") {
            blocks.push(block);
        }
        if (block.type === "table") {
            blocks.push(block);
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
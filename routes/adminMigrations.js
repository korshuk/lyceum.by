var express = require('express');

module.exports = function (app) {
    'use strict';
    var router = express();

    var messages = [
        {
          "name": "Нет справки",
          "messageTemplate": {
            "blocks": [
              {
                "data": {
                  "commented": false,
                  "text": "Уважаемый {{data.pupil.lastName}}!"
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "commented": false,
                  "text": "Вам необходимо загрузить фотографию справки с места обучения полностью. На справке должны быть:&nbsp;"
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "items": [
                    "Ваши фамилия, имя, отчество",
                    "Ваша фотография с печатью (печать должна частично быть на справке, а частично на фотографии)<br>",
                    "класс, в котором Вы обучаетесь в текущем учебном году<br>",
                    "номер школы, в которой Вы обучаетесь<br>"
                  ],
                  "commented": false,
                  "style": "unordered"
                },
                "type": "list"
              }
            ]
          },
          "order": 0,
          "type": 0
        },
        {
          "name": "справка НЕ подошла",
          "messageTemplate": {
            "blocks": [
              {
                "data": {
                  "commented": false,
                  "text": "Ваша справка из школы не подошла"
                },
                "type": "paragraph"
              }
            ]
          },
          "order": 1,
          "type": 0
        },
        {
          "name": "Диплом НЕ прокатил",
          "messageTemplate": {
            "blocks": [
              {
                "data": {
                  "commented": false,
                  "text": "Ваш диплом не соответсвует требованиям"
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "commented": false,
                  "text": "Согласно п.{{data.config.rulesOlympPassPoint}} Правил приема в Государственное учреждение образования «Лицей Белорусского государственного университета» на {{new Date().getFullYear() }}  год: \"Без прохождения вступительных испытаний в Лицей БГУ зачисляются победители ЗАКЛЮЧИТЕЛЬНОГО этапа (дипломы I, II, III степени) республиканской олимпиады по учебному предмету, проведенной Министерством образования Республики Беларусь в {{new Date().getFullYear() - 1}}/{{new Date().getFullYear() }} учебном году (далее республиканской олимпиады) в соответствии с профилем обучения\". Ваш диплом не освобождает Вас от вступительных испытаний в Лицей БГУ.&nbsp;"
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "commented": false,
                  "text": "Удалите диплом из Личного кабинета."
                },
                "type": "paragraph"
              }
            ]
          },
          "order": 1,
          "type": 1
        },
        {
          "name": "Нет фотографии на справке",
          "messageTemplate": {
            "blocks": [
              {
                "data": {
                  "text": "На справке отсутсвует фотография."
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "text": "Вам нужно сделать другую справку."
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "text": "Для этого:"
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "items": [
                    "Сфотографируйтесь",
                    "Наклейте фотографию на справку",
                    "Поставьте печать в школе (гимназии)Обратите внимание - необходимо, чтобы печать попадала на фото",
                    "Загрузите изображение новой справки"
                  ],
                  "commented": false,
                  "style": "ordered"
                },
                "type": "list"
              }
            ]
          },
          "order": 2,
          "type": 0
        },
        {
          "name": "Слишком плохое качество",
          "messageTemplate": {
            "blocks": [
              {
                "data": {
                  "text": "Изображение справки плохого качества - информация не читается."
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "text": "Сделайте четкое фото справки и перезагрузите ее."
                },
                "type": "paragraph"
              }
            ]
          },
          "order": 3,
          "type": 0
        },
        {
          "name": "Печать отсутсвует",
          "messageTemplate": {
            "blocks": [
              {
                "data": {
                  "text": "Ваша фотография на справке должна быть заверена печатью (печать частично должна попадать на край фотографии)"
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "text": "При регистрации на вступительные испытания в Лицей БГУ Вами была предоставлена справка с места обучения. В справке нет печати на фотографии. Поскольку справка с места обучения является пропуском на вступительные испытания, необходимо оформить ее в соответствии с требованиями Приемной комиссии. Поставьте в школе еще одну печать так, чтобы она захватывала край фотографии (на этой же справке). Затем перезагрузите изображение справки."
                },
                "type": "paragraph"
              }
            ]
          },
          "order": 4,
          "type": 0
        },
        {
          "name": "Печать не на фото",
          "messageTemplate": {
            "blocks": [
              {
                "type": "paragraph",
                "data": {
                  "text": "Ваша фотография на справке должна быть заверена печатью (печать частично должна попадать на край фотографии)"
                }
              },
              {
                "type": "paragraph",
                "data": {
                  "text": "При регистрации на вступительные испытания в Лицей БГУ Вами была предоставлена справка с места обучения. В справке нет печати на фотографии. Поскольку справка с места обучения является пропуском на вступительные испытания, необходимо оформить ее в соответствии с требованиями Приемной комиссии. Поставьте в школе еще одну печать так, чтобы она захватывала край фотографии (на этой же справке). Затем перезагрузите изображение справки."
                }
              }
            ]
          },
          "order": 4,
          "type": 0
        },
        {
          "name": "Абитуриент в 8 классе",
          "messageTemplate": {
            "blocks": [
              {
                "data": {
                  "commented": false,
                  "text": "Уважаемый Имя!"
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "commented": false,
                  "text": "Согласно п.{{data.config.rulesClassPoint}} Правил приема в Государственное учреждение образования «Лицей Белорусского государственного университета» на {{new Date().getFullYear() }} год: \"Для получения общего среднего образования в Лицее БГУ осуществляется приём лиц, завершивших обучение и воспитание в IX классе на II ступени общего среднего образования в {{new Date().getFullYear() - 1}}/{{new Date().getFullYear() }} учебном году, по конкурсу на основании результатов вступительных испытаний\" Вы не можете поступать в Лицей БГУ."
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "commented": false,
                  "text": "Судя по вашей справке, вы будете обучаться в 9-м классе только в следующем учебном году, с 1 сентября {{new Date().getFullYear()} года."
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "commented": false,
                  "text": "Если это ошибка, то Вам необходимо переделать справку с места обучения. На справке должны быть:"
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "items": [
                    "Ваши фамилия, имя, отчество",
                    "Ваша фотография с печатью (печать должна частично быть на справке, а частично на фотографии)<br>",
                    "класс, в котором Вы обучаетесь в текущем учебном году<br>",
                    "номер школы, в которой Вы обучаетесь<br>"
                  ],
                  "commented": false,
                  "style": "unordered"
                },
                "type": "list"
              }
            ]
          },
          "order": 5,
          "type": 0
        },
        {
          "name": "Абитуриент в 10 классе",
          "messageTemplate": {
            "blocks": [
              {
                "data": {
                  "commented": false,
                  "text": "Согласно п.{{data.config.rulesClassPoint}}  Правил приема в Государственное учреждение образования «Лицей Белорусского государственного университета» на {{new Date().getFullYear() }}  год: \"Для получения общего среднего образования в Лицее БГУ осуществляется приём лиц, завершивших обучение и воспитание в IX классе на II ступени общего среднего образования в  {{new Date().getFullYear() - 1}}/{{new Date().getFullYear() }} учебном году, по конкурсу на основании результатов вступительных испытаний\" Вы не можете поступать в Лицей БГУ."
                },
                "type": "paragraph"
              }
            ]
          },
          "order": 6,
          "type": 0
        },
        {
          "name": "Невозможно прочесть",
          "messageTemplate": {
            "blocks": [
              {
                "type": "paragraph",
                "data": {
                  "text": "На справке не читается информация (ФИО)."
                }
              },
              {
                "type": "paragraph",
                "data": {
                  "text": "Возьмите новую справку с места учебы и перезагрузите изображение справки."
                }
              }
            ]
          },
          "order": 7,
          "type": 0
        },
        {
          "name": "Неверная дата выдачи справки",
          "messageTemplate": {
            "blocks": [
              {
                "data": {
                  "commented": false,
                  "text": "В справке должно быть указано, что в текущем {{new Date().getFullYear() - 1}}/{{new Date().getFullYear() }} учебном году Вы обучаетесь в 9-м классе. Дата выдачи Вашей справки не соответствует этому критерию."
                },
                "type": "paragraph"
              }
            ]
          },
          "order": 8,
          "type": 0
        },
        {
          "name": "Карта учащегося - пропуск",
          "messageTemplate": {
            "blocks": [
              {
                "type": "paragraph",
                "data": {
                  "text": "На вступительные испытания в Лицей БГУ необходимо предоставить документ, удостоверяющий личность. Т.е. обязательно должна быть Ваша фотография.&nbsp;"
                }
              },
              {
                "type": "paragraph",
                "data": {
                  "text": "На Вашей справке фотографии нет. Предъявив только данную справку, Вы на экзамен допущены не будете. Вам необходимо взять с собой или паспорт или карту учащегося.&nbsp;"
                }
              }
            ]
          },
          "order": 9,
          "type": 0
        },
        {
          "name": "Паспорт - пропуск",
          "messageTemplate": {
            "blocks": [
              {
                "type": "paragraph",
                "data": {
                  "text": "В Вашем случае справка не является пропуском на вступительные испытания, так как фотография не заверена школьной печатью. Для того чтобы быть зарегистрированным на вступительные испытания, сфотографируйте справку с места обучения и разворот паспорта с фотографией, а затем загрузите полученное изображение в личный кабинет.&nbsp;"
                }
              },
              {
                "type": "paragraph",
                "data": {
                  "text": "На вступительные испытания необходимо обязательно явиться с паспортом, так как он будет являться Вашим пропуском."
                }
              }
            ]
          },
          "order": 9,
          "type": 0
        },
        {
          "name": "Карта учащегося не подходит",
          "messageTemplate": {
            "blocks": [
              {
                "data": {
                  "commented": false,
                  "text": "Карта учащегося не подходит, т.к. в ней не указан класс, в котором Вы обучаетесь в текущем учебном году. Загрузите изображение справки с места обучения, оформленной в соответствии с требованиями Приемной комиссии:"
                },
                "type": "paragraph"
              },
              {
                "data": {
                  "commented": false,
                  "text": "в справке должна быть приклеена Ваша фотография, печать должна захватывать край фотографии, в справке должен быть указан класс, в котором Вы обучаетесь в {{new Date().getFullYear() - 1}}/{{new Date().getFullYear() }} учебном году и место обучения."
                },
                "type": "paragraph"
              }
            ]
          },
          "order": 9,
          "type": 0
        }
      ];

    console.log('####################', messages)  
    router.get('/', app.userController.Pass, function(req, res) {
        //updateNews();
        //updatePages();
        setMessages(messages);
        res.status(200).send({message: 'ok'})
        
    });

    app.use('/admin/migrate', router);

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
var expect = require('chai').expect;
var messageRenderer = require('../modules/messageRenderer').api;


var Renderer = messageRenderer.Renderer;
var editorToHtml = messageRenderer.editorToHtml;
var makeMessage = messageRenderer.makeMessage;

console.log(messageRenderer)

describe('Message Renderer', function () {
    
    describe('makeMessage(blocksData, options)', function () {
        it('should render HTML from template with data', function () {
            var data = {
                "blocks":[
                    {"type":"paragraph","data":{"commented":false,"text":"it is {{data.year + 1}} now"}},
                    {"type":"list","data":{"style":"ordered","commented":false,"items":["vbbvvb","vbbvb"]}},
                    {"type":"header","data":{"text":"vbvcbvvb&nbsp;","level":2,"commented":false}}
                ]};
            var options = {
                year: 2020
            }    
            var html = "<p>it is 2021 now</p><ul><li>vbbvvb</li><li>vbbvb</li></ul><h2>vbvcbvvb&nbsp;</h2>";    
            var result =  makeMessage(data, options)
            
            expect(result).to.equal(html);
        });
    });

    describe('Renderer(template, options)', function () {
        it('should render year to template', function () {
            var template = "it is {{data.year}} now";
            var options = {
                year: 2020
            }
            var result = Renderer(template, options);

            expect(result).to.equal("it is 2020 now");
        });
        it('should evaluate simple js operations', function () {
            var template = "it is {{data.year + 1}} now";
            var options = {
                year: 2020
            }
            var result = Renderer(template, options);

            expect(result).to.equal("it is 2021 now");
        });
        it('should return error with wrong variable', function () {
            var template = "it is {{data.year}} now";
            var options = {
                month: 'may'
            }

            expect(function() {
                Renderer(template, options)
            }).to.throw('Template renderer rendered undefined variable');
        });
    });
    describe('editorToHtml(blocksData)', function () {
        it('should valid HTML from blocks data', function () {
            var data = {
                "blocks":[
                    {"type":"paragraph","data":{"commented":false,"text":"sdfsdfsdfds12355"}},
                    {"type":"list","data":{"style":"ordered","commented":false,"items":["vbbvvb","vbbvb"]}},
                    {"type":"header","data":{"text":"vbvcbvvb&nbsp;","level":2,"commented":false}}
                ]};
            var html = "<p>sdfsdfsdfds12355</p><ul><li>vbbvvb</li><li>vbbvb</li></ul><h2>vbvcbvvb&nbsp;</h2>"   
            var result =  editorToHtml(data)
            expect(result).to.equal(html);
        });
    });

});
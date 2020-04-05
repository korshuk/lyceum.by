var doT = require("dot");

doT.templateSettings = {
    evaluate:    /\{\{=([\s\S]+?)\}\}/g,
    interpolate: /\{\{([\s\S]+?)\}\}/g,
    encode:      /\{\{!([\s\S]+?)\}\}/g,
    use:         /\{\{#([\s\S]+?)\}\}/g,
    define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
    conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
    iterate:     /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
    varname: 'data',
    strip: true,
    append: true,
    selfcontained: false
};

function makeMessage(data, options) {
    var template = editorToHtml(data);
    var result = Renderer(template, options);
    return result
}

function editorToHtml(data) {
    var html = '';
    for(var i = 0; i < data.blocks.length; i++) {
        var block = data.blocks[i];
        if (block.type === 'paragraph') {
            html += '<p>' + block.data.text + '</p>';
        }
        if (block.type === 'header') {
            html += '<h' + block.data.level +'>' + block.data.text + '</h' + block.data.level +'>';
        }
        if (block.type === 'list') {
            html += '<ul>';
            for(var j = 0; j < block.data.items.length; j++) {
                html += '<li>' + block.data.items[j] + '</li>';
            }
            html += '</ul>';
        }
    }
    return html
}

function Renderer(template, options) {
    var doTCompiled = doT.template(template, undefined, { a: 100, b: 200});
    var result = doTCompiled(options);
    if (result.indexOf('undefined') > -1) {
        throw new Error('Template renderer rendered undefined variable');
    }
    return result
}

exports.api = {
    Renderer:Renderer,
    editorToHtml:editorToHtml,
    makeMessage: makeMessage,
}
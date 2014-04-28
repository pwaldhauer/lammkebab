var _ = require('underscore');
var async = require('async');
var PFParser = require('pdf2json');
var request = require('request');
var fs = require('fs');

var days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
var url = 'http://www.restaurant-lorient.de/Mittagsmenue.pdf';

function parsePDF(pdf_data) {
    var current_day = '';
    var buffer = '';

    for (var i in pdf_data.data.Pages) {
        for (var j in pdf_data.data.Pages[i].Texts) {
            var text_block = pdf_data.data.Pages[i].Texts[j];
            var text = textFromBlock(text_block);

            buffer += text;

            if (days.indexOf(text.trim()) != -1) {


                if (analyzeBuffer(buffer)) {
                    return writeTemplate(current_day);
                }

                current_day = text;
                buffer = '';
            }
        }
    }

    if (analyzeBuffer(buffer)) {
        return writeTemplate(current_day);
    }

    return writeTemplate('Niemals :(');
}

function textFromBlock(block) {
    if (!block.R || !block.R.length) {
        return '';
    }

    return unescape(block.R[0].T);
}

function analyzeBuffer(buffer) {
    return buffer.match(/Kebab/);
}

function writeTemplate(day) {
    var template = '<!DOCTYPE html><meta charset="UTF-8"><style>body{margin-top: 5%}h1,p{text-align: center;font-family:Helvetica,sans-serif;}h1{font-size:48px; line-height: 60px;}a{color: #000;}</style><body><h1>' + day + '</h1><p><a href="' + url + '">Mittagsmenü</a></p></body>';

    fs.writeFileSync('./index.html', template);
}

var pdfParser = new PFParser();
pdfParser.on('pdfParser_dataReady', parsePDF);

request({
    url: url,
    encoding: null
}, function(error, response, body) {
    if (!error && response.statusCode == 200) {
        pdfParser.parseBuffer(body);
    }
})



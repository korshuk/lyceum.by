var ExamDatasSchema;

function define(mongoose, fn) {
    var Schema = mongoose.Schema,

    ExamDatasSchema = new Schema({
    	'vid': Number,
    	'date': Date
    });

    mongoose.model('ExamDatas', ExamDatasSchema);
    fn();
}

exports.define = define;
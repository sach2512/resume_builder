const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const resumeSchema = new Schema({
    name : String,
    sirname: String,
    city: String,
    state: String,
    phone: String,
    email: String,
    school: String,
    zip: Number,
    URL: String,
    DOB: Date,
    skills: [],
    Experiance: [],
    Experiance_month: [],
    university: [],
    certificate: [],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
        

});


const resume = mongoose.model('resume', resumeSchema);
module.exports = resume;
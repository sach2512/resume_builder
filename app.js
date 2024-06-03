const express = require("express");
const app = express();
const path = require("path"); // if we start server from other than Resume_Builder ... then it should get views 
const port = 8080;
const mongoose = require('mongoose');
const Resume_model = require("./models/resume");
const methodOverride = require("method-override"); // method override to send put , delete , etc req
const session = require("express-session"); 

//middlwares
app.set("view engine", "ejs"); // for ejs
app.use(express.static(path.join(__dirname, "/public"))); //  to join public files css, js
app.set("views", path.join(__dirname, "/views")); 
app.use(express.urlencoded({extended: true})); // to parse the data of post req
app.use(methodOverride("_method"));

// variable 
let resumeData;


// making connection with mongoDB
main().then(() => {
    console.log("connected to DB");
})
.catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/Resume');
}




const sessionOptions = {
    secret: "mySuperSecret", 
    resave: false, 
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // cookie will save in browser for 1 week 
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
 };


 
// session middleware
app.use(session(sessionOptions));



// Configration for Passport  
// Link :- https://www.npmjs.com/package/passport-local-mongoose
const User = require("./models/users"); 
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { saveRedirectUrl, isLoggedIn } = require("./middleware");

// this code should be written after the all session code 
// middleware to initialize passport
app.use(passport.initialize());

// each req has to know that at whichs session part he is
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

// to add users info into the session   
passport.serializeUser(User.serializeUser());
// to removing users info from the session
passport.deserializeUser(User.deserializeUser());


// adding curr user variable to the res.locals
app.use((req,res,next) => {
    res.locals.currUser = req.user;
    next();
});




// signup form render
app.get("/signup" , (req,res) => {
    res.render("signup.ejs");
});



// sign up
app.post("/signup", async (req,res) =>{
    try{
       let {username, email, password} = req.body;
       const newUser = new User({username, email});
       const registeredUser =  await User.register(newUser, password);
       User_id = registeredUser._id;

    //    logged in after signup
       req.login(registeredUser, (err) => {
        if(err) {
            return next(err);
        }
   
        res.redirect("/home");
      });

   } catch(err) {
       res.send(err);
   }
});



//login form 
app.get("/login",(req,res) => {
    res.render("login.ejs");
});


// login user 
app.post("/login", passport.authenticate("local", {failureRedirect: "/login"} ),  async (req,res) => {
    res.redirect("/home");
});



//logout form
app.get("/logout",(req,res) => {
    req.logout((err) => {
        if(err) {
            return next(err);
        }

        res.redirect("/home");
    });
});










// home route (gives info about resume)
app.get("/Home",(req,res) => {
    res.render("home.ejs");
});


// input forms starts 
//  form1 
app.get("/form1", isLoggedIn, (req,res) => {
    let edit = false;
    res.render("resume_forms/form1.ejs", { edit } );
});

//  form2 
app.get("/form2", isLoggedIn, (req,res) => {
    let object = req.query.data;
    let edit = false;
    if(req.query.data.edit) edit = true;   
    res.render("resume_forms/form2.ejs", { object , edit , resumeData});
});

//  form3
app.get("/form3", isLoggedIn, (req,res) => {
    let object = req.query.data;
    let edit = false;
    if(req.query.data.edit) edit = true;
    res.render("resume_forms/form3.ejs", { object , edit , resumeData});
});

//  form4 
app.get("/form4", isLoggedIn, (req,res) => {
    let object = req.query.data;
    let edit = false;
    if(req.query.data.edit) edit = true;
    res.render("resume_forms/form4.ejs", { object, edit , resumeData });
});

//  form5 
app.get("/form5", isLoggedIn, (req,res) => {
    let object = req.query.data;
    let edit = false;
    if(req.query.data.edit) edit = true;
    res.render("resume_forms/form5.ejs", { object, edit, resumeData });
});



// to show resume
app.get("/resume", (req,res) => {
    res.render("resume.ejs");
});


// Create route
app.post("/addResume", async (req,res) => {
    let resume = req.body.data;
    const newResume = new Resume_model(req.body.data);
    newResume.owner = req.user._id;
    newResume.Experiance = resume.Experiance;
    newResume.skills = resume.skills;
    newResume.university = resume.university;
    newResume.certificate = resume.certificate;

    try {
      let savedResume = await newResume.save();
    } catch (err) {
       console.log("error");
    }

    res.redirect("/allResumes");
});




// show route (to show created resume)
app.get("/showResume/:id",async (req,res) => {

    try {
        let { id } = req.params;
        let resume = await Resume_model.findById(id).populate("");
        let owner = resume.owner;
        res.render("resume.ejs", { resume , owner});

    } catch(err) {
        res.send(err);
    }
   
});



// show all resumes
app.get("/allResumes",isLoggedIn, async (req,res) => {
    try {
        let AllResumes = await Resume_model.find();
        let owner = req.user._id;
        res.render("allResume.ejs" , { AllResumes , owner});
    } catch(err) {
        res.send(err);
    }
});




// Edit Route 
app.get("/edit/:id", isLoggedIn, async (req,res) => {
    let { id } = req.params;

    try {
        resumeData = await Resume_model.findById(id);
        let edit = true;
        res.render("resume_forms/form1.ejs", { resumeData , edit});
    } catch(err) {
        res.send("page not found ");
    }
});



//update route 
app.put("/edit/:id", async (req,res) => {
    let { id } = req.params;
    try {
        let updatedResume = await Resume_model.findByIdAndUpdate(id, { ...req.body.data });
        await updatedResume.save();
    } catch(err) {
        console.log(err);
    }

    res.redirect("/allResumes");
});



// delete route 
app.delete("/delete/:id", async (req,res) => {
    try {
     let { id } = req.params;
     await Resume_model.findByIdAndDelete(id);
     res.redirect("/allResumes");

    } catch(err) {
        res.send(err);
    }
});








// page not found 404
app.get("*", (req,res) => {
    res.status(404).send("Page not Found 404");
});

app.listen(port, () => {
   console.log(`app is listening on port ${port}`)
});
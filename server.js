const express = require("express");
const dataService= require("./data-service");
const app = express();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const exphbs = require('express-handlebars');
const dataServiceAuth = require ('./data-service-auth');
const clientSessions = require ("client-sessions");

app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

// setup client-session
app.use(clientSessions({
  cookieName: "session", 
  secret: "rnguyen18", 
  duration: 2 * 60 * 1000, 
  activeDuration: 1000 * 60 
}));
app.use( (req, res, next) =>{
  res.locals.session = req.session;
  next();
});
// login check middleware
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

//setup multer
const storage = multer.diskStorage({
  destination: "./public/images/uploaded/",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// setup express handlebars
app.engine('.hbs', exphbs({ 
  extname: '.hbs',
  // custom helper to fix navigation bar
  helpers: {
    navLink: function(url, options){
      return '<li' + 
          ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
          '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    linkGen: function(options){
      return `<a href="app.locals.activeRoute/${options.fn(this)}"> ${options.fn(this)}</a>`;
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  },
}));
app.set('view engine', '.hbs');
app.use(function(req, res,next){
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
  next();
});


// home route
app.get("/", (req, res) => {
  res.render('home');
});

// about route
app.get("/about", (req, res) => {
  res.render('about');
});

// Dept CRUD - get all:
app.get("/departments", ensureLogin, (req, res) => {
  dataService
    .getDepartments()
    .then(dept => {
      if (dept.length > 0)
        res.render("departments", { data: dept });
      else res.render("departments", { message: "no results" });
    })
    .catch((err) =>
      res.render("departments", { message: "no results" })
    );
});
// Dept CRUD get - add
app.get("/departments/add", ensureLogin, (req, res) => {
  res.render("addDepartment");
});
// Dept CRUD post - add 
app.post("/departments/add", ensureLogin, (req, res) => {
  dataService.addDepartment(req.body).then(() => res.redirect("/departments"));
});
// Dept CRUD post - update
app.post("/department/update", ensureLogin, (req, res) => {
    dataService.updateDepartment(req.body).then(() => res.redirect("/departments"));
});

// Dept CRUD get - get one
app.get("/department/:departmentId", ensureLogin, (req, res) => {
  dataService
    .getDepartmentById(req.params.departmentId)
    .then((dept) => {
      if (dept) res.render("department", { data: dept });
      else res.status(404).send("Department Not Found");
    })
    .catch((err) => res.status(404).send("Department Not Found"));
});
// Dept CRUD get - delete
app.get("/departments/delete/:departmentId", ensureLogin, (req, res) => {
  dataService.deleteDepartmentById(req.params.departmentId)
    .then( () => res.redirect("/departments"))
    .catch(err => res.status(500).send("Unable to Remove Department / Department not found)"));
});

// Emp CRUD get - get all & get all with filter
app.get("/employees", ensureLogin, (req, res) => {
  if (req.query.status) {
    dataService
      .getEmployeesByStatus(req.query.status)
      .then( emp => {
        if (emp.length > 0) res.render("employees", { data: emp });
        else res.render("employees", { message: "no results" });
      })
      .catch((err) => res.render("employees", { message: "no results" }));
  } else if (req.query.department) {
    dataService
      .getEmployeesByDepartment(req.query.department)
      .then( emp => {
        if (emp.length  > 0) res.render("employees", { data: emp });
        else res.render("employees", { message: "no results" });
      })
      .catch((err) => res.render("employees", { message: "no results" }));
  } else if (req.query.manager) {
    dataService
      .getEmployeesByManager(req.query.manager)
      .then( emp => {
        if (emp.length  > 0) res.render("employees", { data: emp });
        else res.render("employees", { message: "no results" });
      })
      .catch((err) => res.render("employees", { message: "no results" }));
  } else {
    dataService
      .getAllEmployees()
      .then( emp => {
        if (emp.length  > 0) res.render("employees", { data: emp });
        else res.render("employees", { message: "no results" });
      })
      .catch((err) => res.render("employees", { message: "no results" }));
  }
});

// Emp CRUD get - add
app.get("/employees/add", ensureLogin, (req, res) => {
  dataService.getDepartments()
  .then( data => res.render("addEmployee", {departments: data}))
  .catch( err => res.render("addEmployee", {departments: []}))
});

// Emp CRUD post - add
app.post("/employees/add", ensureLogin, (req, res) => {
  dataService.addEmployee(req.body)
  .then(() => res.redirect("/employees"))
  .catch((err)=>{
    res.status(500).send("Unable to add employee");
});

});

// from assignment 5 document
// Emp CRUD get - get one
app.get("/employee/:empNum", ensureLogin, (req, res) => {
  // initialize an empty object to store the values
  let viewData = {};
  dataService
    .getEmployeeByNum(req.params.empNum)
    .then(data => {
      if (data) {
        viewData.employee = data; //store employee data in the "viewData" object as "employee"
      } else {
        viewData.employee = null; // set employee to null if none were returned
      }
    })
    .catch(() => {
      viewData.employee = null; // set employee to null if there was an error
    })
    .then(data.getDepartments)
    .then(data => {
      viewData.departments = data; // store department data in the "viewData" object as "departments"

      // loop through viewData.departments and once we have found the departmentId that matches
      // the employee's "department" value, add a "selected" property to the matching
      // viewData.departments object

      for (let i = 0; i < viewData.departments.length; i++) {
        if (viewData.departments[i].departmentId == viewData.employee.department) {
          viewData.departments[i].selected = true;
        }
      }
    })
    .catch(() => {
      viewData.departments = []; // set departments to empty if there was an error
    })
    .then(() => {
      if (viewData.employee == null) {
        // if no employee - return an error
        res.status(404).send("Employee Not Found");
      } else {
        res.render("employee", { viewData: viewData }); // render the "employee" view
      }
    });
});

// Emp CRUD post - update
app.post("/employee/update", ensureLogin, (req, res) => {
  dataService.updateEmployee(req.body)
  .then(() => res.redirect("/employees"))
  .catch( err => res.status(500).send("Unable to update employee"));
});
// Emp CRUD get - delete
app.get("/employees/delete/:empNum", ensureLogin, (req, res) => {
  dataService.deleteEmployeeByNum(req.params.empNum)
    .then( () => res.redirect("/employees"))
    .catch(err => res.status(500).send("Unable to Remove Employee / Employee not found)"));
});

// route to handle get all images request
app.get("/images", ensureLogin, (req, res) => {
  fs.readdir("./public/images/uploaded/", function (err, files) {
      res.render('images',{
        data: files
      });
  });
});

// route to add image interface
app.get("/images/add", ensureLogin, (req, res) => {
  res.render("addImage");
});

// handle adding new image 
app.post("/images/add", ensureLogin, upload.single("imageFile"), (req, res) => {
  res.redirect("/images");
});

// login route
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  dataServiceAuth.checkUser(req.body)
  .then( user => {
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory 
    };
    console.log(req.session);
    res.redirect('/employees');
  })
  .catch( err => res.render('login',{errorMessage: err, userName: req.body.userName}));
});

// register routes
app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/register", (req, res) => {
  dataServiceAuth.registerUser(req.body)
  .then( () => res.render('register', {successMessage: "User created"}))
  .catch( err => res.render('register',{errorMessage: err, userName: req.body.userName}));
});

// res.render('register',{errorMessage: err, userName: req.body.userName})

app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory');
});

// catch all other request
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

const PORT = process.env.PORT || 8080;

dataService.initialize()
  .then(dataServiceAuth.initialize)
  .then(() =>
    app.listen(PORT, () =>
      console.log("Express http server listening on: " + PORT)
    )
  )
  .catch((err) => console.log(err.message));

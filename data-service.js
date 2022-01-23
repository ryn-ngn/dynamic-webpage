const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  "da0mr7g8r0cb62",
  "jqdsqkgcpeievt",
  "96e2273d179486c4acb9b487562bfa16d6f50571e89af487b699130d26963325",
  {
    host: "ec2-52-86-25-51.compute-1.amazonaws.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true }
  }
);

// Employee model
const Employee = sequelize.define("Employee", {
  employeeNum: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: Sequelize.STRING,
  lastName: Sequelize.STRING,
  email: Sequelize.STRING,
  SSN: Sequelize.STRING,
  addressStreet: Sequelize.STRING,
  addressCity: Sequelize.STRING,
  addressState: Sequelize.STRING,
  addressPostal: Sequelize.STRING,
  maritalStatus: Sequelize.STRING,
  isManager: Sequelize.BOOLEAN,
  employeeManagerNum: Sequelize.INTEGER,
  status: Sequelize.STRING,
  hireDate: Sequelize.STRING,
});

// Department model
const Department = sequelize.define("Department", {
  departmentId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  departmentName: Sequelize.STRING,
});

// relationship Emp vs Dept
Department.hasMany(Employee, { foreignKey: "department" });

exports.initialize = () => {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => resolve())
      .catch((err) => {
        console.log("unable to sync the database");
        reject();
      });
  });
};

// Emp CRUD op - get all
exports.getAllEmployees = () => {
  return new Promise((resolve, reject) => {
    Employee.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject("unable to sync the database")
      });
  });
};

function filterData(field, query) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
          where: {[field]:  query}
        })
        .then (data => resolve(data))
        .catch ( () => reject("no results returned"));
    });
}
// Emp CRUD op - get all with filter
exports.getEmployeesByStatus = (status) => filterData("status", status); 
exports.getEmployeesByDepartment = (department) => filterData("department", department); 
exports.getEmployeesByManager = (manager) => filterData("employeeManagerNum", manager); 
exports.getEmployeeByNum = (num) => {
     return new Promise(function (resolve, reject) {
        Employee.findAll({
          where: {employeeNum:  num}
        })
        .then (data => resolve(data[0]))
        .catch ( () => reject("no results returned"));
    });
};

function prepareData(employeeData){
    employeeData.isManager = (employeeData.isManager) ? true : false;
        for (field in employeeData) {
            if (employeeData[field] == "") employeeData[field] = null;
        };
}
// Emp CRUD op - create
exports.addEmployee = (employeeData) => {
    return new Promise((resolve, reject) => {
        prepareData(employeeData);
        Employee.create(employeeData)
        .then(data => resolve (data))
        .catch ( () => reject("unable to create employee"));
  });
};
// Emp CRUD op - update
exports.updateEmployee = (employeeData) => {
    return new Promise(function (resolve, reject) {
        for (field in employeeData) {
            if (employeeData[field] == "") employeeData[field] = null;
        };
        Employee.update(
          {
            employeeNum: employeeData.employeeNum,
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            email: employeeData.email,
            addressStreet: employeeData.addressStreet,
            addressCity: employeeData.addressCity,
            addressState: employeeData.addressState,
            addressPostal: employeeData.addressPostal,
            maritalStatus: employeeData.maritalStatus,
            isManager: employeeData.isManager,
            employeeManagerNum: employeeData.employeeManagerNum,
            status: employeeData.status,
            department: employeeData.department
          },
          {
            where: { employeeNum: employeeData.employeeNum },
          }
        )
          .then((data) => resolve(data))
          .catch(() => reject("unable to update employee"));
      });
  };
// Emp CRUD op - delete
exports.deleteEmployeeByNum = (empNum) => {
    return new Promise(function (resolve, reject) {
        Employee.destroy({
            where: {employeeNum:  empNum}
          })
        .then(() => {
            console.log("successsfully removed emploloyee: ", empNum);
            resolve(); 
        })
        .catch ( err => reject("unable to emploloyee: ", empNum));
      });
}
// Dept CRUD op - get all
exports.getDepartments = () => {
    return new Promise(function (resolve, reject) {
      Department.findAll()
      .then(data => resolve(data))
      .catch ( () => reject("no results returned"));
    });
  };
// Dept CRUD op - add
exports.addDepartment = (departmentData) => {
    return new Promise(function (resolve, reject) {
        for (field in departmentData) {
            if (departmentData[field] == "") departmentData[field] = null;
        };
        Department.create(departmentData)
        .then(data => resolve (data))
        .catch ( () => reject("unable to create department"));
      });
}
// Dept CRUD op - update
exports.updateDepartment = (departmentData) => {
    return new Promise(function (resolve, reject) {
        for (field in departmentData) {
            if (departmentData[field] == "") departmentData[field] = null;
        };
        Department.update({
            departmentName: departmentData.departmentName
        },{
            where: {departmentId: departmentData.departmentId }
        })
        .then(data => resolve (data))
        .catch ( () => reject("unable to update department"));
      });
}
// Dept CRUD op - get one
exports.getDepartmentById = (id) => {
    return new Promise(function (resolve, reject) {
        Department.findAll({
            where: {departmentId:  id}
          })
        .then(data => resolve(data[0]))
        .catch ( () => reject("no results returned"));
      });
}
// Dept CRUD op - delete
exports.deleteDepartmentById = (id) => {
    return new Promise(function (resolve, reject) {
        Department.destroy({
            where: {departmentId:  id}
          })
        .then(() => {
            console.log("successsfully removed department: ", id);
            resolve(); 
        })
        .catch ( err => reject("unable to deletedepartment: ", id));
      });
}

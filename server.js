const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");

const app = express();
// Enable CORS
app.use(cors());
const PORT = 3000;
// Configure body-parser to handle POST requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'DB_PASSWORD',
  database: 'DB_NAME'
});

//test connection
app.get("/getAllTvSeries", (req, res) => {
  pool.query(`SELECT * FROM tvseries`, (error, results) => {
    if (error) throw error;
    res.send(results);
  });
});

function authenticateUser(email, password, callback) {
  const sql = `SELECT Email, Password FROM User WHERE email = "${email}"`;
  pool.query(sql, (err, result) => {
    if (err) {
      console.log(err);
    }
    else if (result.length == 0) {
      callback("Invalid user!");
    }
    else if (result[0].Email = email && result[0].Password == password) {
      callback("Authenticated!");
    }
    else if (result[0].Email = email && result[0].Password != password) {
      callback("Invalid password!");
    }
  })
}

function registerUser(name, surname, age, email, password, callback) {
  const sql = `SELECT COUNT (*) AS Result FROM User WHERE email = "${email}"`;
  pool.query(sql, (err, result) => {
    if (err) {
      console.log(err);
    }
    else if (result[0].Result == 0) {
      const sql = `INSERT INTO User Values ("${email}", "${password}", "${name}"\
      ,"${surname}", ${age})`;
      pool.query(sql, (err, result) => {
        if (err) {
          console.log(err);
        }
        else {
          callback("Registered succesfully!");
        }
      });
    }
    else {
      callback("The email already exists!")
    }
  });

}

function retrieveFilms(primaryTitle, genres, durations, averageRating, listReleaseYear, callback) {
  var sql = `SELECT DISTINCT movie.* FROM movie `;
  var genreFilter = '';
  var durationFilter = '';
  var releaseYearFilter = '';

  for (let genre in genres) {
    if (genres[genre]) {
      genreFilter += genreFilter ? " OR " : "";
      genreFilter += `moviegenre.genre = '${genre}\\r'`;
    }
  }

  if (genreFilter) {
    sql += ` INNER JOIN moviegenre ON movie.tconst = moviegenre.tconst AND (${genreFilter})`;
  }

  sql += ' WHERE 1=1';

  if (primaryTitle) {
    sql += ` AND movie.primaryTitle = '${primaryTitle}'`;
  }

  for (let duration in durations) {
    if (durations[duration]) {
      durationFilter += durationFilter ? " OR " : "";
      switch (duration) {
        case "Less than 40 minutes":
          durationFilter += "movie.duration < 40";
          break;
        case "More than 150 minutes":
          durationFilter += "movie.duration >= 150";
          break;
        case "Between 40 and 70 minutes":
          durationFilter += "(movie.duration >= 40 AND movie.duration < 70)";
          break;
        case "Between 70 and 150 minutes":
          durationFilter += "(movie.duration >= 70 AND movie.duration < 150)";
          break;
      }
    }
  }


  if (durationFilter) {
    sql += ` AND (${durationFilter})`;
  }

  if (averageRating) {
    sql += ` AND movie.averageRating >= ${averageRating}`;
  }

  for (let year in listReleaseYear) {
    if (listReleaseYear[year]) {
      releaseYearFilter += releaseYearFilter ? " OR " : "";
      switch (year) {
        case "1920":
          releaseYearFilter += "(movie.releaseYear < 1920)";
          break;
        case "2040":
          releaseYearFilter += "(movie.releaseYear >= 1920 AND movie.releaseYear < 1940)";
          break;
        case "4060":
          releaseYearFilter += "(movie.releaseYear >= 1940 AND movie.releaseYear < 1960)";
          break;
        case "6080":
          releaseYearFilter += "(movie.releaseYear >= 1960 AND movie.releaseYear < 1980)";
          break;
        case "8000":
          releaseYearFilter += "(movie.releaseYear >= 1980 AND movie.releaseYear < 2000)";
          break;
        case "0010":
          releaseYearFilter += "(movie.releaseYear >= 2000 AND movie.releaseYear < 2010)";
          break;
        case "1020":
          releaseYearFilter += "(movie.releaseYear >= 2010 AND movie.releaseYear < 2020)";
          break;
        case "2020":
          releaseYearFilter += "(movie.releaseYear >= 2020)";
          break;
      }
    }
  }

  if (releaseYearFilter) {
    sql += ` AND (${releaseYearFilter})`;
  }

  // console.log(sql); for debug purposes

  pool.query(sql, (err, results) => {
    if (err) {
      console.log(err);
    } else {
      callback(results);
    }
  });
}


app.get('/retrieveFilms', (req, res) => {
  const genres = {
    Drama: req.query.genreDrama === 'true',
    History: req.query.genreHistory === 'true',
    Comedy: req.query.genreComedy === 'true',
    Biography: req.query.genreBiography === 'true',
    Romance: req.query.genreRomance === 'true',
    Family: req.query.genreFamily === 'true',
    Western: req.query.genreWestern === 'true',



  };

  const durations = {
    "Less than 40 minutes": req.query.duration0040 === 'true',
    "More than 150 minutes": req.query.duration150 === 'true',
    "Between 40 and 70 minutes": req.query.duration4070 === 'true',
    "Between 70 and 150 minutes": req.query.duration70150 === 'true',
  };

  const listReleaseYears = {
    "1920": req.query.releaseYear1920 === 'true',
    "2040": req.query.releaseYear2040 === 'true',
    "4060": req.query.releaseYear4060 === 'true',
    "6080": req.query.releaseYear6080 === 'true',
    "8000": req.query.releaseYear8000 === 'true',
    "0010": req.query.releaseYear0010 === 'true',
    "1020": req.query.releaseYear1020 === 'true',
    "2020": req.query.releaseYear2020 === 'true',
  };

  retrieveFilms(
    req.query.primaryTitle, genres, durations, req.query.averageRating, listReleaseYears, (result) => {
      res.send(result);
    }
  );
});


app.get('/authenticateUser', (req, res) => {
  var email = req.query.email;
  var password = req.query.password;
  authenticateUser(email, password, (result) => {
    res.send(result);
  });
});

app.post('/registerUser', (req, res) => {
  var name = req.body.name;
  var surname = req.body.surname;
  var age = req.body.age;
  var email = req.body.email;
  var password = req.body.password;
  registerUser(name, surname, age, email, password, (result) => {
    res.send(result);
  });
});

app.listen(PORT, () => {
  console.log("Server started");
});


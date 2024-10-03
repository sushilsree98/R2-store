const express = require('express');
const app = express();
const cors = require('cors');
const uploadRoutes = require('./routes/upload.js') 

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.use(cors())

app.use('/upload', uploadRoutes)



app.listen(process.env.PORT, () => {
    console.log('App listening on port:', process.env.PORT)
});

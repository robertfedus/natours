const express = require('express');

const app = express();

app.get('/api', (req, res) => {
  res.status(200).send('This is an API');
});

const port = 5000;
app.listen(port, () => console.log(`Server listening on port ${port}...`));

// Routing

// app.get('/', (req, res) => {
//   // res.status(200).send('Hello from the server!');
//   res.status(200).json({
//     message: 'Hello from the server!', 
//     app: 'Natours'
//   });
// });
// 
// app.post('/', (req, res) => {
//   res.status(200).send('You can post to this endpoint');
// });

//////////////
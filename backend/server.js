const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const userRoutes       = require('./routes/userRoutes');
const travelLogRoutes  = require('./routes/travelLogRoutes');
const journeyPlanRoutes= require('./routes/journeyPlanRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Mount the routers:
app.use('/users',       userRoutes);
app.use('/travellogs',  travelLogRoutes);
app.use('/journeyplans',journeyPlanRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

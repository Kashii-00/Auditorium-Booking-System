
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
require('./db'); 

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

// Start server
const PORT = 5007;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import propertyRoutes from './routes/property';
import jobRoutes from './routes/jobs';
import organizationRoutes from './routes/organizations';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/properties', propertyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/organizations', organizationRoutes);

export default app;

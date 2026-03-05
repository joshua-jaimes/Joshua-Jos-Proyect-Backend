
import mongoose from 'mongoose';
import axios from 'axios';
import Usuario from './models/usuario.js';
import Lectura from './models/lecturas.js';
import 'dotenv/config';

// Fix for strictQuery warning if updated mongoose
mongoose.set('strictQuery', false);

const run = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/basejosnumerolog');
        console.log('Connected to DB');

        // Find a user
        const usuario = await Usuario.findOne();
        if (!usuario) {
            console.log('No users found in DB. Cannot test.');
            process.exit(1);
        }
        console.log(`Testing with user: ${usuario.nombre} (${usuario._id})`);

        // Check API Key and List Models
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("No API KEY found in .env");
        } else {
            console.log("Testing API Key access to models...");
            try {
                const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                const listResponse = await axios.get(listModelsUrl);
                console.log("List Models Success!");
                const models = listResponse.data.models || [];
                console.log("Found", models.length, "models.");
                const hasPro = models.find(m => m.name.includes("gemini-pro"));
                const hasFlash = models.find(m => m.name.includes("gemini-1.5-flash"));
                console.log("Available Models:");
                models.forEach(m => console.log(`- ${m.name}`));
            } catch (e) {
                console.error("List Models Failed:", e.response ? e.response.status : e.message);
                if (e.response && e.response.data) console.error(JSON.stringify(e.response.data, null, 2));
            }
        }

        // Check if principal reading exists
        const existingLectura = await Lectura.findOne({ usuario_id: usuario._id, tipo: 'principal' });
        if (existingLectura) {
            console.log('User already has a principal reading. Deleting it for test purposes...');
            await Lectura.deleteOne({ _id: existingLectura._id });
        }

        const port = process.env.PORT || 4000;
        const url = `http://localhost:${port}/api/lecturas`;

        console.log(`Sending POST request to ${url}...`);
        const response = await axios.post(url, {
            usuario_id: usuario._id,
            tipo: 'principal'
        });

        console.log('Response status:', response.status);
        console.log('Response data:', response.data);

        if (response.data.lectura && response.data.lectura.contenido) {
            console.log('SUCCESS: Reading generated!');
        } else {
            console.log('FAILURE: Reading not generated properly.');
        }

    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    } finally {
        await mongoose.disconnect();
    }
};

run();

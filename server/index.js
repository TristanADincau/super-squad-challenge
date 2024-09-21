// index.js
// Required modules
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// Initialize Express application
const app = express();

// Define paths
const clientPath = path.join(__dirname, '..', 'client/src');
const dataPath = path.join(__dirname, 'data', 'users.json');
const serverPublic = path.join(__dirname, 'public');
// Middleware setup
app.use(express.static(clientPath)); // Serve static files from client directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies

// Routes

// Home route
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: clientPath });
});

app.get('/users', async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf8');

        const users = JSON.parse(data);
        if (!users) {
            throw new Error("Error no users available");
        }
        res.status(200).json(users);
    } catch (error) {
        console.error("Problem getting users" + error.message);
        res.status(500).json({ error: "Problem reading users" });
    }
});

// Form route
app.get('/form', (req, res) => {
    res.sendFile('pages/form.html', { root: serverPublic });
});

// Form submission route
app.post('/submit-form', async (req, res) => {
    try {
        const { superHeroName, universe, superPowers } = req.body;

        // Read existing users from file
        let users = [];
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            users = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or is empty, start with an empty array
            console.error('Error reading user data:', error);
            users = [];
        }

        // Find or create user
        let user = users.find(u => u.superHeroName === superHeroName && u.universe === universe);
        if (user) {
            user.messages.push(superPowers);
        } else {
            user = { superHeroName, universe, superPowers: [superPowers] };
            users.push(user);
        }

        // Save updated users
        await fs.writeFile(dataPath, JSON.stringify(users, null, 2));
        res.redirect('/form');
    } catch (error) {
        console.error('Error processing form:', error);
        res.status(500).send('An error occurred while processing your submission.');
    }
});

// Update user route (currently just logs and sends a response)
app.put('/update-user/:currentSuperHeroName/:currentUniverse', async (req, res) => {
    try {
        const { currentSuperHeroName, currentUniverse } = req.params;
        const { newSuperHeroName, newUniverse } = req.body;
        console.log('Current Superhero:', { currentSuperHeroName, currentUniverse });
        console.log('New Universe:', { newSuperHeroName, newUniverse });
        const data = await fs.readFile(dataPath, 'utf8');
        if (data) {
            let users = JSON.parse(data);
            const userIndex = users.findIndex(user => user.superHeroName === currentSuperHeroName && user.universe === currentUniverse);
            console.log(userIndex);
            if (userIndex === -1) {
                return res.status(404).json({ superPowers: "Superhero not found" })
            }
            users[userIndex] = { ...users[userIndex], superHeroName: newSuperHeroName, universe: newUniverse };
            console.log(users);
            await fs.writeFile(dataPath, JSON.stringify(users, null, 2));

            res.status(200).json({ superPowers: `You sent ${newSuperHeroName} and ${newUniverse}` });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('An error occurred while updating the user.');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

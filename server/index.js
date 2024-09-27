// index.js
// Required modules
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// Initialize Express application
const app = express();

// Define paths
const clientPath = path.join(__dirname, '..', 'client/src');
const dataPath = path.join(__dirname, 'data', 'heroes.json');
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

app.get('/heroes', async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf8');

        const heroes = JSON.parse(data);
        if (!heroes) {
            throw new Error("Error no heroes available");
        }
        res.status(200).json(heroes);
    } catch (error) {
        console.error("Problem getting heroes" + error.message);
        res.status(500).json({ error: "Problem reading heroes" });
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
        let heroes = [];
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            heroes = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or is empty, start with an empty array
            console.error('Error reading hero data:', error);
            heroes = [];
        }

        // Find or create user
        let hero = heroes.find(u => u.superHeroName === superHeroName && u.universe === universe);
        if (hero) {
            hero.messages.push(superPowers);
        } else {
            hero = { superHeroName, universe, superPowers: [superPowers] };
            heroes.push(hero);
        }

        // Save updated users
        await fs.writeFile(dataPath, JSON.stringify(heroes, null, 2));
        res.redirect('/form');
    } catch (error) {
        console.error('Error processing form:', error);
        res.status(500).send('An error occurred while processing your submission.');
    }
});

// Update user route (currently just logs and sends a response)
app.put('/update-hero/:currentSuperHeroName/:currentUniverse', async (req, res) => {
    try {
        const { currentSuperHeroName, currentUniverse } = req.params;
        const { newSuperHeroName, newUniverse } = req.body;
        console.log('Current Superhero:', { currentSuperHeroName, currentUniverse });
        console.log('New Universe:', { newSuperHeroName, newUniverse });
        const data = await fs.readFile(dataPath, 'utf8');
        if (data) {
            let heroes = JSON.parse(data);
            const heroIndex = heroes.findIndex(hero => hero.superHeroName === currentSuperHeroName && hero.universe === currentUniverse);
            console.log(heroIndex);
            if (heroIndex === -1) {
                return res.status(404).json({ superPowers: "Superhero not found" })
            }
            heroes[heroIndex] = { ...heroes[heroIndex], superHeroName: newSuperHeroName, universe: newUniverse };
            console.log(heroes);
            await fs.writeFile(dataPath, JSON.stringify(heroes, null, 2));

            res.status(200).json({ superPowers: `You sent ${newSuperHeroName} and ${newUniverse}` });
        }
    } catch (error) {
        console.error('Error updating hero:', error);
        res.status(500).send('An error occurred while updating the hero.');
    }
});

app.delete('/hero/:superHeroName/:universe', async (req, res) => {
    try {
        const { superHeroName, universe } = req.params;
        // initalize an empty array of 'users'
        let heroes = [];
        // try to read the users.json file and cache as data
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            // parse the data
            heroes = JSON.parse(data);
        } catch (error) {
            return res.status(404).send('File data not found');
        }
        // cache the userIndex based on a matching name and email
        const heroIndex = heroes.findIndex(hero => hero.superHeroName === superHeroName && hero.universe === universe);
        // handle a situation where the index does NOT exist
        if (heroIndex === -1) {
            return res.status(404).send('Hero not found');
        }
        // splice the users array with the intended delete name and email
        heroes.splice(heroIndex, 1);
        console.log(heroIndex);
        console.log(heroes);
        // try to write the users array back to the file
        try {
            await fs.writeFile(dataPath, JSON.stringify(heroes, null, 2));
        } catch (error) {
            console.error('Failed to write to database');
        }
        res.send('successfully deleted hero');
        // send a success deleted message
    } catch (error) {
        res.status(500).send("There was a problem");
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

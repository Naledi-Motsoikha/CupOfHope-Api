const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
            // Create content table
            db.run(`CREATE TABLE IF NOT EXISTS content (
                key TEXT PRIMARY KEY,
                value TEXT
            )`);

            // Create users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
            )`, (err) => {
                if (!err) {
                    // Insert default user if table is empty
                    db.get("SELECT count(*) as count FROM users", (err, row) => {
                        if (row.count === 0) {
                            const salt = bcrypt.genSaltSync(10);
                            const hash = bcrypt.hashSync('admin123', salt);
                            db.run("INSERT INTO users (username, password) VALUES (?, ?)", ['admin', hash]);
                            console.log('Created default admin user (admin / admin123)');
                        }
                    });
                }
            });

            // Insert default content if table is empty
            db.get("SELECT count(*) as count FROM content", (err, row) => {
                if (row.count === 0) {
                    const defaultContent = [
                        ['hero_title', 'Stream All Your <br> Favorite Audio Content'],
                        ['hero_subtitle', 'Discover inspiring podcasts, live radio shows, and exclusive interviews from creators around the world.'],
                        ['about_title', 'A Voice of <span class="about-title-accent">Hope</span><br>for Every Ear'],
                        ['about_desc1', 'Cup of Hope FM is a 24/7 community radio station powered by faith, music, and the relentless belief that every person deserves encouragement. Born from a heart to serve, we broadcast uplifting messages, live worship, prayer, and the best in gospel and inspirational music across South Africa and beyond.'],
                        ['about_desc2', 'From our humble beginnings to a growing online presence, our mission remains unchanged — to pour out hope into hearts, homes, and communities one broadcast at a time.'],
                        ['programs', JSON.stringify([
                            { image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80', title: 'Sacred Hours', time: '00:00 - 03:00', desc: 'A peaceful journey of prayer and worship' },
                            { image: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400&q=80', title: 'The Early Riser', time: '03:00 - 05:00', desc: 'Start your day with faith and inspiration' },
                            { image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80', title: 'Daily Dose of Hope', time: '05:00 - 08:00', desc: 'Your daily dose of encouragement' },
                            { image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&q=80', title: 'The Breakfast Show', time: '08:00 - 10:00', desc: 'Great conversations to fuel your morning' },
                            { image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80', title: 'The Music Pour', time: '10:00 - 13:00', desc: 'Non-stop uplifting music pour' }
                        ])],
                        ['news', JSON.stringify([
                            { image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&q=80', title: 'NOT TO BE MISSED!', date: '08 Jun 2026', snippet: 'One unforgettable weekend for only R250.00 - DAY 1: 19 June 2026...' },
                            { image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&q=80', title: 'ADVERTISE WITH US', date: '12 May 2026', snippet: 'Your next customer is listening to Cup Of Hope FM RIGHT NOW...' }
                        ])],
                        ['events', JSON.stringify([
                            { type: 'primary', day: '19', month: 'JUN', title: 'Annual Youth Conference', venue: 'Hope Community Centre', color: 'orange' },
                            { type: 'secondary', day: '05', month: 'JUL', title: 'Worship Night Live', venue: 'Cup Of Hope Auditorium', color: 'dark' }
                        ])],
                        ['sponsors', JSON.stringify([
                            { icon: 'flame', name: 'Flames of Fire' },
                            { icon: 'trophy', name: 'FIFA' }
                        ])]
                    ];
                    
                    const stmt = db.prepare("INSERT INTO content (key, value) VALUES (?, ?)");
                    defaultContent.forEach(item => {
                        stmt.run(item);
                    });
                    stmt.finalize();
                    console.log('Inserted default content');
                }
            });
        });
    }
});

module.exports = db;

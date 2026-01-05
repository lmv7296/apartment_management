import express from 'express';
import bodyParser from 'body-parser';

const router = express.Router();
router.use(bodyParser.json());

const users = [
    { username: 'user1', password: 'password1' },
    { username: 'user2', password: 'password2' }
];

router.post('/signin', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.status(200).json({ message: 'Sign in successful' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

export default router;
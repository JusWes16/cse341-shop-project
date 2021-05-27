const express = require('express');
const { check, body } = require('express-validator/check')

const router = express.Router();

const authController = require('../controllers/auth');

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getReset);

router.get('/reset/:token', authController.getNewPassword);

router.post(
    '/login',
    [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .normalizeEmail(),
    body('password', 'Invalid password.')
        .isLength({min: 5})
        .isAlphanumeric()
        .trim()
    ],
    authController.postLogin
);

router.post(
    '/signup',
    [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .normalizeEmail(),
    body('password', 'Please enter a password that only uses numbers and letters and is at least 5 characters long.')
        .isLength({min: 5})
        .isAlphanumeric()
        .trim(),
    body('confirmPassword')
        .trim()
        .custom((value, {req}) => {
            if (value !== req.body.password) {
                throw new Error('Passwords have to match.');
            }
            return true;
        })
    ],
    authController.postSignup
);

router.post('/logout', authController.postLogout);

router.post('/reset', authController.postReset);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
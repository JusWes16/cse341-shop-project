const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    let message1 = req.flash('error');
    let message2 = req.flash('success');
    if (message1.length > 0) {
        message1 = message1[0];
    } else {
        message1 = null;
    }
    if (message2.length > 0) {
        message2 = message2[0];
    } else {
        message2 = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message1,
        successMessage: message2
    });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email})
        .then(user =>{
            if (!user) {
                req.flash('error', 'Invalid email or password.')
                return res.redirect('/login')
            }
            bcrypt.compare(password, user.password)
                .then(result =>{
                    if (result) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    req.flash('error', 'Invalid email or password.')
                    res.redirect('/login');
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login')
                });
        })
        .catch(err => console.log(err));  
};

exports.postSignup = (req, res, next) => {
    const fname = req.body.fname;
    const lname = req.body.lname;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    User.findOne({email: email})
        .then(userInfo => {
        if (userInfo) {
            req.flash('error', 'This email already exsists. Please choose another email.')
            return res.redirect('/signup');
        }
        return bcrypt
            .hash(password, 12)
            .then(hashedPassword =>{
                const user = new User ({
                    fname: fname,
                    lname: lname,
                    email: email,
                    password: hashedPassword,
                    cart: { items: [] }
                });
                return user.save();
            })
            .then(results => {
                req.flash('success', 'You have successfully created an account. You can now login using your email and password.')
                res.redirect('/login');
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err =>{
        console.log(err);
        res.redirect('/');
    });
};
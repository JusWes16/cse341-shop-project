const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator/check')

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));

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
        successMessage: message2,
        oldInput: { 
            email: '', 
            password: ''
        }
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
        errorMessage: message,
        oldInput: {
            fname: '', 
            lname: '', 
            email: '', 
            password: '', 
            confirmPassword: ''
        }
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            successMessage: null,
            oldInput: { 
                email: email, 
                password: password
            }
        });
    }

    User.findOne({email: email})
        .then(user =>{
            if (!user) {
                req.flash('error', 'Invalid email or password.')
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: req.flash('error'),
                    successMessage: null,
                    oldInput: { 
                        email: email, 
                        password: password
                    }
                });
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
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: req.flash('error'),
                        successMessage: null,
                        oldInput: { 
                            email: email, 
                            password: password
                        }
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login')
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          }); 
};

exports.postSignup = (req, res, next) => {
    const fname = req.body.fname;
    const lname = req.body.lname;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                fname: req.body.fname, 
                lname: req.body.lname, 
                email: email, 
                password: password, 
                confirmPassword: confirmPassword
            }
        });
    }
    User.findOne({email: email})
        .then(userInfo => {
        if (userInfo) {
            req.flash('error', 'This email already exsists. Please choose another email.');
            return res.redirect('/signup');
        }
        // if (password != confirmPassword){
        //     req.flash('error', 'Passwords do not match. Please try again');
        //     return res.redirect('/signup');
        // }
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
                return transporter.sendMail({
                    to: email,
                    from: '1997wak@gmail.com',
                    subject: 'Signup Succeeded',
                    html: '<h1>You successfully signed up!</h1>'
                });
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
              });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err =>{
        console.log(err);
        res.redirect('/');
    });
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
            .then(user => {
                if(!user){
                    req.flash('error', 'No account with that email found');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect('/');
                transporter.sendMail({
                    to: req.body.email,
                    from: '1997wak@gmail.com',
                    subject: 'Password Reset',
                    html: `
                        <p>You have requested a password reset</p>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
                    `
                })
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
              });
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
        .then(user =>{
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });

    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
        resetToken: passwordToken, 
        resetTokenExpiration: {$gt: Date.now()}, 
        _id: userId
    })
        .then(user =>{
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword =>{
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result =>{
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
};
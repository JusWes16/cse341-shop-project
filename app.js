const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const errorController = require('./controllers/error');
const User = require('./models/user');
const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const PORT = process.env.PORT || 3000;

const cors = require('cors') // Place this with other requires (like 'path' and 'express')

const corsOptions = {
    origin: "https://<your_app_name>.herokuapp.com/",
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    family: 4
};

const MONGODB_URL = process.env.MONGODB_URL || "mongodb+srv://weston:test1234@cluster0.yqxnp.mongodb.net/shop?retryWrites=true'";

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false })); 
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User.findById('60a04913016e804c64772913')
        .then(user =>{
            req.user = user;
            next();
        })
        .catch(err => console.log(err))
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
    .connect(
        MONGODB_URL, options
    )
    .then(result => {
        User.findOne()
            .then(user => {
                if (!user){
                    const user = new User ({
                        name: 'Weston',
                        email: 'weston@email.com',
                        cart: {
                            items: []
                        }
                    });
                    user.save();
                }
            })
        app.listen(PORT, () => {
            console.log(`Our app is running on port ${ PORT }`);
        });
    })
    .catch(err =>{
        console.log(err);
    })
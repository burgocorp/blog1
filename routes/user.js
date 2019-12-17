const express = require('express');

const router = express.Router();
const gravatar = require('gravatar');
const userModel = require('../model/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const validateRegisterInput = require('../validation/register');
const validateLoginInput = require('../validation/login');


//user register  1.email유무체크 2.avatar 생성 3.usermodel 4.password 암호화 5.response 

router.post('/register', (req,res ) => {

    const {errors, isValid } = validateRegisterInput(req.body);
    if (!isValid){
        return res.status(400).json(errors);
    }

        userModel
            .findOne({email : req.body.email})
            .exec()
            .then(user => {
                if (user) {
                    return res.json({
                        msg : '가입된 이메일이 존재합니다'
                    });
                }else{
                    const avatar = gravatar.url(req.body.email, {
                        s: '200', //size
                        r: 'pg', //Rating
                        d: 'mm' //default
                    });

                    const user = new userModel({
                        name : req.body.username,
                        email : req.body.email,
                        password : req.body.password,
                        avatar : avatar
                    });

                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(user.password, salt, (err, hash)=> {
                            if (err) throw err;
                            user.password = hash;
                            user
                            .save()
                            .then(result => {
                                res.json({
                                    msg : "registered user",
                                    userInfo : result
                                });
                            })
                            .catch(err => {
                                res.json({
                                    msg : err.message
                                });
                            });

                        })
                    })
                }
            })
            .catch(err => {
                res.json({
                    msg : err.message
                });
            });
});

//user login

router.post('/login', (req,res) => {

    const {errors, isValid} = validateLoginInput(req.body);
    if(!isValid){
        return res.status(400).json(errors);
    }

    //1.이메일 체크 2.암호 체크(디코딩) 3.returning jwt 4. response

    userModel
        .findOne({email : req.body.email})
        .exec()
        .then(user => {
            if(!user){
                return res.json({
                    msg : "회원가입 후 로그인 해주세요"
                });
            }else{
                bcrypt
                    .compare(req.body.password, user.password)
                    .then(isMatch => {
                        if (isMatch){
                            const payload = { id:user.id, name:user.name, avatar:user.avatar};

                            const token = jwt.sign(
                                payload,
                                process.env.SECRET_KEY,
                                {expiresIn : 3600}
                            );

                            return res.json({
                                msg : "successfull login",
                                tokenInfo : 'bearer' + token
                            });
                        }else{
                            res.json({
                                msg : 'password incorrect'
                            });
                        }
                    })
                    .catch(err => res.json(err));
            }
        })
        .catch(err => {
            res.json({
                msg : err.message
            });
        });

});

//current user

router.get('/currents', (req,res) => {

});




module.exports = router;
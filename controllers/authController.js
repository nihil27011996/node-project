const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { promisify } = require('util');
const CatchAsyncFunction = require('../utils/catchAsyncFn');
const AppError = require('../utils/appError');

const signToken = id => {
  return jwt.sign({ id: id }, 'hi-my-name-is-nihl-this-is-my-token', {
    expiresIn: '1h'
  });
};

const createToken = async function(newUser, statusCode, res) {
  const token = signToken(newUser._id);
  const cookieOptions = {
    expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    httpOnly: true
  };
  res.cookie('jwt', token, cookieOptions);

  User.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      User
    }
  });
};

exports.signup = CatchAsyncFunction(async function(req, res, next) {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  await createToken(newUser, 200, res);
});

exports.login = CatchAsyncFunction(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.checkPassword(user.password, password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createToken(user, 200, res);
});

exports.protect = CatchAsyncFunction(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  const decoded = await promisify(jwt.verify)(
    token,
    'hi-my-name-is-nihl-this-is-my-token'
  );
  /*   if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  } */

  // GRANT ACCESS TO PROTECTED ROUTE

  const currentuser = await User.findById(decoded.id);

  if (!currentuser) return next(new AppError('The user is not present', 401));
  req.user = currentuser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log('helloo', roles.includes(req.user.role));
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have the necessary role for the same', 401)
      );
    }
    next();
  };
};

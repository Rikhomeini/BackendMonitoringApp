const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Cek jika user sudah ada
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email or username'
      });
    }

    // Buat user baru
    const newUser = await User.create({
      username,
      email,
      password,
      role: role || 'viewer'
    });

    // Generate JWT token
    const token = signToken(newUser._id);

    // Hapus password dari output
    newUser.password = undefined;

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser
      }
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Cek jika email dan password ada
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password'
      });
    }

    // 2) Cek jika user exists dan password correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        message: 'Incorrect email or password'
      });
    }

    // 3) Jika semua ok, kirim token ke client
    const token = signToken(user._id);

    // 4) Hapus password dari output
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    // Filter field yang tidak boleh diupdate
    const filteredBody = { ...req.body };
    const restrictedFields = ['password', 'role']; // Hanya admin yang bisa update role
    restrictedFields.forEach(field => delete filteredBody[field]);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};
const Users = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userCtrl = {
  register: async (req, res)=>{
    try {
      const {name, email, password} = req.body;

      const user = await Users.findOne({email})
      if(user) return res.status(400).json({msg: "email already exists"})

      if(password.length < 6)
        return res.status(400).json({msg: "password must be 6 characters"})

      // password encryption
      const passwordHash = await bcrypt.hash(password, 10)
      const newUser = new Users({
        name, email, password: passwordHash
      })

      // save MongoDb
      await newUser.save()

      // Creating jsonwebtoken for authentication
      const accessToken = createAccessToken({id: newUser._id})
      const refreshToken = createRefreshToken({id: newUser._id})

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        path: 'user/refresh_token'
      })

      res.json({accessToken})
      // res.json({msg:"registration successfull"})

    } catch (err) {
      return res.status(500).json({msg: err.message})
    }
  },
  login: async (req, res)=>{
    try {
      const {email, password} = req.body;

      const user = await Users.findOne({email})
      if(!user) return res.status(400).json({msg: "User doesn't exist."})

      const isMatch = await bcrypt.compare(password, user.password)

      if(!isMatch) return res.status(400).json({msg: "Incorrect Password"})

      // if login success, create access token amd refresh token
      const accessToken = createAccessToken({id: newUser._id})
      const refreshToken = createRefreshToken({id: newUser._id})

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        path: 'user/refresh_token'
      })

      res.json({accessToken})
    } catch (err) {
      return res.status(500).json({msg: err.message})
    }
  },
  logout: async (req, res)=> {
    try {
      res.clearCookie('refreshToken', {path: 'user/refresh_token'})
      return res.json({msg: "Logged out"})
    } catch (err) {
      return res.status(500).json({msg: err.message})
    }
  },
  refreshToken: (req, res)=>{
    try {
      const rf_token = req.cookies.refreshToken;
      if(!rf_token) return res.status(400).json({msg: "Please Login or Register"})

      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET,(err, user) => {
        if(err) return res.status(400).json({msg: "Please Login or Register"})

        const accessToken = createAccessToken({id: user.id})
        res.json({accessToken})
      })
      
    } catch (err) {
      return res.status(500).json({msg: err.message})
    }
    
  },
  getUser: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id).select('-password')
      if(!user) return res.status(400).json({mes: "User not found"})
      
      res.json(req.user)
    } catch (err) {
      return res.status(500).json({msg: err.message})
    }
  }
}

const createAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'})
}

const createRefreshToken = (user) => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'})
}

module.exports = userCtrl

const userModel = require('../models/user.model');

const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  const refreshtoken = req.cookies.refreshtoken;
  if (!refreshtoken) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(
      refreshtoken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await userModel.findById(decoded.id);
    if (!user) return res.sendStatus(403);


    if (user.refreshtoken !== refreshtoken)
      return res.sendStatus(403);


    const token = jwt.sign({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      ispremium: user.ispremium,
      premiumEndDate: user.premiumEndDate
    }, process.env.JWT, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message:
        "Done"

    });

  } catch (err) {
    res.sendStatus(403);
  }
}

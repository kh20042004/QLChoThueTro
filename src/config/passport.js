const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');

// Cấu hình Passport để serialize và deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Cấu hình Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Kiểm tra xem user đã tồn tại chưa
        let user = await User.findOne({
          where: { email: profile.emails[0].value }
        });

        if (user) {
          // Nếu user đã tồn tại, cập nhật thông tin
          user.name = profile.displayName;
          user.avatar = profile.photos[0]?.value;
          user.email_verified = true;
          user.google_id = profile.id;
          await user.save();
        } else {
          // Tạo user mới từ thông tin Google
          user = await User.create({
            google_id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0]?.value,
            email_verified: true,
            password: Math.random().toString(36).slice(-8), // Password ngẫu nhiên (không sử dụng)
            role: 'tenant' // Mặc định là người thuê
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth Error:', error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;

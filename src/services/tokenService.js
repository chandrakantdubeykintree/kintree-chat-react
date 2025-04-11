import Cookies from "js-cookie";

const cookieOptions = {
  // secure: true,
  // sameSite: "strict",
  // secure: window.location.protocol === "https:",
  sameSite: "lax",
  path: "/",
};

class TokenService {
  constructor() {
    this.loginTokenKey = "login_token";
    this.registrationTokenKey = "complete_registration_token";
    this.expiryKey = "token_expiry";
    this.resetPasswordTokenKey = "reset_password_token";
  }

  setLoginToken(token, remember = false) {
    const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    if (remember) {
      Cookies.set(this.loginTokenKey, token, { ...cookieOptions, expires: 7 });
      Cookies.set(this.expiryKey, expiry.toString(), { expires: 7 });
    } else {
      Cookies.set(this.loginTokenKey, token);
      Cookies.set(this.expiryKey, expiry.toString());
    }
  }

  setResetPasswordToken(token) {
    Cookies.set(this.resetPasswordTokenKey, token);
  }

  removeResetPasswordToken() {
    Cookies.remove(this.resetPasswordTokenKey);
  }

  getResetPasswordToken() {
    return Cookies.get(this.resetPasswordTokenKey);
  }

  setRegistrationToken(token) {
    Cookies.set(this.registrationTokenKey, token);
  }

  getLoginToken() {
    return Cookies.get(this.loginTokenKey);
  }

  getRegistrationToken() {
    return Cookies.get(this.registrationTokenKey);
  }

  removeLoginToken() {
    Cookies.remove(this.loginTokenKey);
    Cookies.remove(this.expiryKey);
  }

  removeRegistrationToken() {
    Cookies.remove(this.registrationTokenKey);
  }

  removeAllTokens() {
    this.removeLoginToken();
    this.removeRegistrationToken();
  }

  isLoginTokenValid() {
    const token = this.getLoginToken();
    const expiry = Cookies.get(this.expiryKey);

    if (!token || !expiry) return false;
    return new Date().getTime() < parseInt(expiry);
  }
}

export const tokenService = new TokenService();

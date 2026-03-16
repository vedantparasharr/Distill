import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const login = async (email, password) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

const register = async (username, email, password) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

const verifyEmail = async (email, otp) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.VERIFY_EMAIL, {
      email,
      otp,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

const resendOtp = async (email) => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.RESEND_OTP, {
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

const getProfile = async () => {
  try {
    const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

const updateProfile = async (userData) => {
  try {
    const response = await axiosInstance.put(
      API_PATHS.AUTH.UPDATE_PROFILE,
      userData,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

const changePassword = async (passwords) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.AUTH.CHANGE_PASSWORD,
      passwords,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

const logout = async () => {
  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.LOGOUT);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

const authService = {
  login,
  register,
  verifyEmail,
  resendOtp,
  getProfile,
  updateProfile,
  changePassword,
  logout,
};

export default authService;
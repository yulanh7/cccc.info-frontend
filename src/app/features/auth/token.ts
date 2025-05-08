
export const storeToken = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);

};

export const getToken = (): string | null => {
  try {

    return localStorage.getItem('access_token');
  } catch (error) {
    console.error('Error accessing token:', error);
    return null;
  }
};

export const getRefreshToken = (): string | null => {
  try {

    return localStorage.getItem('refresh_token');
  } catch (error) {
    console.error('Error accessing refresh token:', error);
    return null;
  }
};
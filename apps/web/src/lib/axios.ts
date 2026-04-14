import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:4000',
  withCredentials: true, // Garante que mandaremos e receberemos os cookies
})

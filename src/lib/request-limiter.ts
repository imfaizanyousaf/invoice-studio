"use client"

import axios from "axios";

const REQUEST_LIMIT_KEY = 'invoiceProcessingRequests';
const MAX_REQUESTS_FOR_GUEST = 5;
const MAX_REQUESTS_FOR_REGISTERED = 8;

export const canProcessRequest = async (user: any): Promise<boolean> => {
  console.log('user', user);
  console.log(localStorage.getItem(REQUEST_LIMIT_KEY))
  if (user) {
    const userPackage = await axios.get(`/api/packages/${user.userId}`)

    console.log('userPackage', userPackage.data);
    if(userPackage.data.requests > 0){
      return true;
    }else{
      return false;
    }
    
    
    
  };

  if (typeof window === 'undefined') return false;

  const requestData = localStorage.getItem(REQUEST_LIMIT_KEY);
  console.log('requestData', requestData);
  if (!requestData) return true;

  try {
    const { count, lastRequestTime } = JSON.parse(requestData);
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Reset count if more than 24 hours have passed since last request
    if (now - lastRequestTime > oneDayInMs) {
      localStorage.removeItem(REQUEST_LIMIT_KEY);
      return true;
    }

    return count < MAX_REQUESTS_FOR_GUEST;
  } catch (error) {
    console.error('Error parsing request limit data:', error);
    return true;
  }
};

export const recordRequest = (user: any): void => {
  if(user) return;

  if (typeof window === 'undefined') return;




  const requestData = localStorage.getItem(REQUEST_LIMIT_KEY);
  let count = 1;
  const now = Date.now();

  if (requestData) {
    try {
      const parsedData = JSON.parse(requestData);
      count = parsedData.count + 1;
    } catch (error) {
      console.error('Error parsing request limit data:', error);
    }
  }

  localStorage.setItem(REQUEST_LIMIT_KEY, JSON.stringify({
    count,
    lastRequestTime: now
  }));
};

export const getRemainingRequests = (user: any): number => {
  if (user) return MAX_REQUESTS_FOR_REGISTERED;

  if (typeof window === 'undefined') return 0;

  const requestData = localStorage.getItem(REQUEST_LIMIT_KEY);
  if (!requestData) return MAX_REQUESTS_FOR_GUEST;

  try {
    const { count, lastRequestTime } = JSON.parse(requestData);
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (now - lastRequestTime > oneDayInMs) {
      localStorage.removeItem(REQUEST_LIMIT_KEY);
      return MAX_REQUESTS_FOR_GUEST;
    }

    return Math.max(0, MAX_REQUESTS_FOR_GUEST - count);
  } catch (error) {
    console.error('Error parsing request limit data:', error);
    return MAX_REQUESTS_FOR_GUEST;
  }
};
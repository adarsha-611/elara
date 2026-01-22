export function generateOtp(){
    return Math.floor(100000+Math.random() * 900000).toString();
}

export function getOtpExpiry(minutes = 5){
    return Date.now() + minutes * 60 * 1000;
}

export function isOtpExpired(expiryTime){
    return Date.now()>expiryTime;
}
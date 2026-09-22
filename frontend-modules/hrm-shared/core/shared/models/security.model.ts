export interface CustomTokenObtainPair {
    email: string;
    // title: Email
    // minLength: 1
    password: string;
    // title: Password
    // minLength: 1
}

export interface TokenRefresh {
    refresh: string | null;
    // title: Refresh
    // minLength: 1
    access?: string;
    // title: Access
    // readOnly: true
    // minLength: 1
}

export interface TokenVerify {
    token: string;
    // title: Token
    // minLength: 1
}

export interface User {
    first_name?: string;
    // title: First name
    // maxLength: 30
    email: string;
    // title: Email
    // maxLength: 40
    // minLength: 1
    password: string;
    // title: Password
    // maxLength: 128
    // minLength: 1
    is_staff?: boolean;
    // title: Is staff
}
interface IAuthData {
  login: string;
  password: string;
}

interface INetrcData {
  [domain: string]: IAuthData;
}

declare module 'netrc' {
  export default function(): INetrcData;
}

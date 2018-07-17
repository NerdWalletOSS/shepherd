interface authData {
  login: string,
  password: string,
}

interface netrcData {
  [domain: string]: authData,
}

declare module 'netrc' {
  export default function() : netrcData;
}
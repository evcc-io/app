export interface BasicAuth {
  required: boolean;
  username?: string;
  password?: string;
}

export type RootStackParamList = {
  Main: undefined;
  Settings: undefined;
  Server: undefined;
  ServerManual?: {
    url?: string;
    basicAuth?: BasicAuth;
  };
};

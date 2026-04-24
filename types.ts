export interface Server {
  title?: string;
  url: string;
  basicAuth: BasicAuth;
}

export interface BasicAuth {
  required?: boolean;
  username?: string;
  password?: string;
}

export type RootStackParamList = {
  Main: undefined;
  Settings?: {
    server?: Server;
    serverIndex: number;
  };
  Server: undefined;
  ChangeServer: undefined;
  ServerManual?: {
    url?: string;
    username?: string;
    password?: string;
    required?: boolean;
  };
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

export interface BasicAuth {
  required: boolean;
  username?: string;
  password?: string;
}

export interface EvccInstance {
  type: string;
  hostName: string;
  port: number;
}

export type RootStackParamList = {
  Main: undefined;
  Settings: undefined;
  Server: undefined;
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

import { NavigatorScreenParams } from "@react-navigation/native";

export interface ClientCert {
  label: string;
  secureStoreKey: string;
}

export interface Server {
  title?: string;
  url: string;
  basicAuth: BasicAuth;
  clientCert?: ClientCert;
}

export interface BasicAuth {
  required?: boolean;
  username?: string;
  password?: string;
}

export type AddServerParams = {
  title?: string;
  url?: string;
  username?: string;
  password?: string;
  required?: boolean;
};

export type SwitchServerStackParamList = {
  SwitchServer: undefined;
  EditServer?: {
    server?: Server;
    serverIndex: number;
  };
  AddServer?: AddServerParams;
  QRCodeCamera: undefined;
};

export type RootStackParamList = {
  QRCodeCamera: undefined;
  Main: undefined;
  Onboarding: undefined;
  SwitchServerModal?: NavigatorScreenParams<SwitchServerStackParamList>;
  AddServer?: AddServerParams;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

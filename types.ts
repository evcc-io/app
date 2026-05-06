import { NavigatorScreenParams } from "@react-navigation/native";

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
};

export type RootStackParamList = {
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

import { NavigatorScreenParams } from "@react-navigation/native";

export interface Server {
  title?: string;
  url: string;
  basicAuth: BasicAuth;
  serviceToken?: ServiceToken;
}

export interface BasicAuth {
  required?: boolean;
  username?: string;
  password?: string;
}

// Cloudflare Access service token. Sent as CF-Access-Client-Id/-Secret on
// native requests and the WebView's first document load; Access answers with
// a CF_Authorization cookie that carries all subsequent traffic (XHR, assets,
// WebSocket). See https://github.com/evcc-io/app/issues/100.
export interface ServiceToken {
  required?: boolean;
  clientId?: string;
  clientSecret?: string;
}

export type AddServerParams = {
  title?: string;
  url?: string;
  username?: string;
  password?: string;
  required?: boolean;
  serviceTokenId?: string;
  serviceTokenSecret?: string;
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

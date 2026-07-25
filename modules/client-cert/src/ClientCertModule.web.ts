import { registerWebModule, NativeModule } from 'expo';

class ClientCertModule extends NativeModule<{}> {}

export default registerWebModule(ClientCertModule, 'ClientCertModule');
